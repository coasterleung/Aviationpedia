/**
 * Fetch aircraft from Wikidata (SPARQL) — split queries to avoid cartesian blowup.
 * Class: Q15056993 = aircraft family.
 * Query A: identity + labels + dates + counts (GROUP BY)
 * Query B: variants (flat) | Query C: operators (flat)
 * Query D: measurements, one flat query per property (P2043 P2050 P2048 P2049 P2073 P2052 P2112 P2254)
 * Output: data/generated/raw-aircraft.json
 */
import { sparql, val, qid, num, assertContains } from './helpers.ts';
import { writeFile, mkdir } from 'node:fs/promises';

// ---- Query A: core ----
const QUERY_A = `
SELECT ?item ?itemLabel ?zhLabel ?desc
  (GROUP_CONCAT(DISTINCT ?instanceOf; separator="|") AS ?instanceOfs)
  (SAMPLE(?manufacturer) AS ?manufacturer)
  (SAMPLE(?capacity) AS ?capacity)
  (SAMPLE(?produced) AS ?produced)
  (SAMPLE(?firstFlight) AS ?firstFlight)
  (SAMPLE(?serviceEntry) AS ?serviceEntry)
  (SAMPLE(?inception) AS ?inception)
  (GROUP_CONCAT(DISTINCT ?image; separator="|") AS ?images)
  (GROUP_CONCAT(DISTINCT ?poweredBy; separator="|") AS ?poweredBys)
WHERE {
  VALUES ?instanceOf { wd:Q15056993 }
  ?item wdt:P31 ?instanceOf .
  OPTIONAL { ?item wdt:P176 ?manufacturer . }
  OPTIONAL { ?item wdt:P1083 ?capacity . }
  OPTIONAL { ?item wdt:P1092 ?produced . }
  OPTIONAL { ?item wdt:P606 ?firstFlight . }
  OPTIONAL { ?item wdt:P729 ?serviceEntry . }
  OPTIONAL { ?item wdt:P571 ?inception . }
  OPTIONAL { ?item wdt:P18 ?image . }
  OPTIONAL { ?item wdt:P516 ?poweredBy . }
  OPTIONAL { ?item schema:description ?desc . FILTER(LANG(?desc)="en") }
  ?item rdfs:label ?itemLabel . FILTER(LANG(?itemLabel)="en")
  OPTIONAL { ?item rdfs:label ?zhLabel . FILTER(LANG(?zhLabel)="zh") }
}
GROUP BY ?item ?itemLabel ?zhLabel ?desc
LIMIT 50000
`;

// ---- Query B: variants ----
const QUERY_B = `
SELECT ?item ?variant WHERE {
  ?item wdt:P31 wd:Q15056993 .
  ?item wdt:P527 ?variant .
}
LIMIT 50000
`;

// ---- Query C: operators ----
const QUERY_C = `
SELECT ?item ?operator WHERE {
  ?item wdt:P31 wd:Q15056993 .
  ?item wdt:P137 ?operator .
}
LIMIT 50000
`;

// ---- Query D: measurements (one per property) ----
const MEASUREMENTS: { field: string; prop: string }[] = [
  { field: 'length', prop: 'P2043' },
  { field: 'wingspan', prop: 'P2050' },
  { field: 'height', prop: 'P2048' },
  { field: 'width', prop: 'P2049' },
  { field: 'range', prop: 'P2073' },
  { field: 'speed', prop: 'P2052' },
  { field: 'wingArea', prop: 'P2112' },
  { field: 'altitude', prop: 'P2254' },
];
// ---- Query E: based-on relationships ----
const QUERY_E = `
SELECT ?item ?basedOn WHERE {
  ?item wdt:P31 wd:Q15056993 .
  ?item wdt:P144 ?basedOn .
}
LIMIT 50000
`;

// ---- Query F: mass ----
const QUERY_F = `
SELECT ?item ?amount ?unit WHERE {
  ?item wdt:P31 wd:Q15056993 .
  ?item p:P2067 ?s .
  ?s psv:P2067 ?vs .
  ?vs wikibase:quantityAmount ?amount .
  OPTIONAL { ?vs wikibase:quantityUnit ?unit . }
}
LIMIT 50000
`;

const QUERY_D = (prop: string) => `
SELECT ?item ?amount ?unit WHERE {
  ?item wdt:P31 wd:Q15056993 .
  ?item p:${prop} ?s .
  ?s psv:${prop} ?vs .
  ?vs wikibase:quantityAmount ?amount .
  OPTIONAL { ?vs wikibase:quantityUnit ?unit . }
}
LIMIT 100000
`;

interface RawAircraft {
  id: string; en: string | null; zh: string | null; desc: string | null;
  manufacturer: string | null;
  length: number | null; lengthUnit: string | null;
  wingspan: number | null; wingspanUnit: string | null;
  height: number | null; heightUnit: string | null;
  width: number | null; widthUnit: string | null;
  range: number | null; rangeUnit: string | null;
  speed: number | null; speedUnit: string | null;
  wingArea: number | null; wingAreaUnit: string | null;
  altitude: number | null; altitudeUnit: string | null;
  capacity: number | null; produced: number | null;
  firstFlight: string | null; serviceEntry: string | null; inception: string | null;
  images: string[]; variants: string[]; poweredBys: string[]; operators: string[];
  basedOn: string[]; mass: number | null; massUnit: string | null;
}

console.log('[fetch] Query A: core...');
const rowsA = await sparql(QUERY_A);
console.log('[fetch] Query B: variants...');
const rowsB = await sparql(QUERY_B);
console.log('[fetch] Query C: operators...');
const rowsC = await sparql(QUERY_C);

const measurements: Record<string, { [field: string]: { value: number | null; unit: string | null } }> = {};
for (const m of MEASUREMENTS) {
  console.log(`[fetch] Query D: ${m.field} (${m.prop})...`);
  const rows = await sparql(QUERY_D(m.prop));
  for (const r of rows) {
    const itemId = qid(r, 'item')!;
    const amount = num(r, 'amount');
    if (amount === null) continue;
    (measurements[itemId] ??= {})[m.field] = { value: amount, unit: qid(r, 'unit') };
  }
  console.log(`  -> ${Object.keys(measurements).length} items have ${m.field}`);
}


console.log('[fetch] Query E: based-on...');
const rowsE = await sparql(QUERY_E);
const basedOn = new Map<string, string[]>();
for (const r of rowsE) {
  const itemId = qid(r, 'item')!;
  const b = qid(r, 'basedOn');
  if (b) (basedOn.get(itemId) ?? basedOn.set(itemId, []).get(itemId)!).push(b);
}
console.log(`  -> ${basedOn.size} items have based-on relationships`);

console.log('[fetch] Query F: mass...');
const rowsF = await sparql(QUERY_F);
const massOf = new Map<string, { value: number; unit: string | null }>();
for (const r of rowsF) {
  const itemId = qid(r, 'item')!;
  const amount = num(r, 'amount');
  if (amount === null) continue;
  if (!massOf.has(itemId)) massOf.set(itemId, { value: amount, unit: qid(r, 'unit') });
}
console.log(`  -> ${massOf.size} items have mass`);

const variants = new Map<string, string[]>();
for (const r of rowsB) {
  const itemId = qid(r, 'item')!;
  const v = qid(r, 'variant');
  if (v) (variants.get(itemId) ?? variants.set(itemId, []).get(itemId)!).push(v);
}
const operators = new Map<string, string[]>();
for (const r of rowsC) {
  const itemId = qid(r, 'item')!;
  const o = qid(r, 'operator');
  if (o) (operators.get(itemId) ?? operators.set(itemId, []).get(itemId)!).push(o);
}

const toIdList = (s: string | null, stripUrl = true): string[] =>
  (s ?? '').split('|').filter(Boolean).map((x) => (stripUrl ? x.split('/').pop()! : x));

const aircraft: RawAircraft[] = rowsA.map((b) => {
  const id = qid(b, 'item')!;
  const m = measurements[id] ?? {};
  return {
    id,
    en: val(b, 'itemLabel'),
    zh: val(b, 'zhLabel'),
    desc: val(b, 'desc'),
    manufacturer: qid(b, 'manufacturer'),
    length: m.length?.value ?? null, lengthUnit: m.length?.unit ?? null,
    wingspan: m.wingspan?.value ?? null, wingspanUnit: m.wingspan?.unit ?? null,
    height: m.height?.value ?? null, heightUnit: m.height?.unit ?? null,
    width: m.width?.value ?? null, widthUnit: m.width?.unit ?? null,
    range: m.range?.value ?? null, rangeUnit: m.range?.unit ?? null,
    speed: m.speed?.value ?? null, speedUnit: m.speed?.unit ?? null,
    wingArea: m.wingArea?.value ?? null, wingAreaUnit: m.wingArea?.unit ?? null,
    altitude: m.altitude?.value ?? null, altitudeUnit: m.altitude?.unit ?? null,
    capacity: num(b, 'capacity'),
    produced: num(b, 'produced'),
    firstFlight: val(b, 'firstFlight'),
    serviceEntry: val(b, 'serviceEntry'),
    inception: val(b, 'inception'),
    images: toIdList(val(b, 'images'), false)
    .map((u) => u.replace('http://commons.wikimedia.org/wiki/Special:FilePath/', ''))
    .map((n) => { try { return decodeURIComponent(n) } catch { return n } })
    .filter(Boolean),
    variants: variants.get(id) ?? [],
    poweredBys: toIdList(val(b, 'poweredBys')),
    operators: operators.get(id) ?? [],
    basedOn: basedOn.get(id) ?? [],
    mass: massOf.get(id)?.value ?? null,
    massUnit: massOf.get(id)?.unit ?? null,
  };
});

assertContains(
  aircraft.map((a) => ({ id: a.id, en: a.en })),
  [
    { id: 'Q6387', name: 'Boeing 737' },
    { id: 'Q6475', name: 'Airbus A320 family' },
    { id: 'Q179', name: 'Boeing 747' },
    { id: 'Q5830', name: 'Airbus A380' },
  ],
  'aircraft'
);

const stats = (f: (a: RawAircraft) => boolean) => aircraft.filter(f).length;
console.log(`total=${aircraft.length} families=${aircraft.filter((a) => a.variants.length > 0).length}`);
console.log(`coverage: image=${stats((a) => a.images.length > 0)} length=${stats((a) => a.length !== null)} wingspan=${stats((a) => a.wingspan !== null)} range=${stats((a) => a.range !== null)} speed=${stats((a) => a.speed !== null)} cap=${stats((a) => a.capacity !== null)} produced=${stats((a) => a.produced !== null)} operators=${stats((a) => a.operators.length > 0)}`);

const a380 = aircraft.find((a) => a.id === 'Q5830');
console.log('A380:', JSON.stringify(a380));

await mkdir(new URL('../generated', import.meta.url), { recursive: true });
await writeFile(
  new URL('../generated/raw-aircraft.json', import.meta.url),
  JSON.stringify({ generatedAt: new Date().toISOString(), aircraft }, null, 1)
);
console.log('wrote data/generated/raw-aircraft.json');
