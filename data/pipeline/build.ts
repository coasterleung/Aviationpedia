/**
 * build.ts — merge raw data into final encyclopedia datasets.
 * 1. Resolve labels for referenced entities (manufacturers, hubs, countries, HQ, variants, engines)
 * 2. Unit conversion (ft -> m for altitude; drop unknown units)
 * 3. Merge OpenFlights airlines (defunct coverage) with Wikidata airlines
 * 4. Compose final JSON -> data/generated/final/ and app/src/data/
 */
import { sparql, val, qid } from './helpers.ts';
import { readFile, writeFile, mkdir, cp } from 'node:fs/promises';
import { ALLIANCE_MEMBER_OVERRIDES } from '../src/alliance-overrides.ts';

const GEN = new URL('../generated/', import.meta.url);
const APP_DATA = new URL('../../app/src/data/', import.meta.url);

const rawAircraft = JSON.parse(await readFile(new URL('raw-aircraft.json', GEN), 'utf8')).aircraft;
const rawAirlines = JSON.parse(await readFile(new URL('raw-airlines.json', GEN), 'utf8')).airlines;
const rawAlliances = JSON.parse(await readFile(new URL('raw-alliances.json', GEN), 'utf8')).alliances;
const rawMembers = JSON.parse(await readFile(new URL('raw-members.json', GEN), 'utf8')).members;

console.log(`loaded: ${rawAircraft.length} aircraft, ${rawAirlines.length} airlines, ${Object.keys(rawAlliances).length} alliances`);

// ---------- 1. Labels for referenced entities ----------
// Manufacturers: query directly
const mfrRows = await sparql(`
SELECT DISTINCT ?mfr ?mfrLabel ?zhLabel WHERE {
  VALUES ?cls { wd:Q15056993 wd:Q15056995 }
  ?a wdt:P31 ?cls .
  ?a wdt:P176 ?mfr .
  ?mfr rdfs:label ?mfrLabel . FILTER(LANG(?mfrLabel)="en")
  OPTIONAL { ?mfr rdfs:label ?zhLabel . FILTER(LANG(?zhLabel)="zh") }
}`);
const mfrLabels = new Map<string, { en: string; zh: string | null }>();
for (const r of mfrRows) {
  const id = qid(r, 'mfr')!;
  mfrLabels.set(id, { en: val(r, 'mfrLabel')!, zh: val(r, 'zhLabel') });
}
console.log(`manufacturers resolved: ${mfrLabels.size}`);

// Chunked label lookup for arbitrary QID sets
async function fetchLabels(ids: Set<string>, chunkSize = 400): Promise<Map<string, { en: string; zh: string | null }>> {
  const out = new Map<string, { en: string; zh: string | null }>();
  const arr = [...ids];
  for (let i = 0; i < arr.length; i += chunkSize) {
    const chunk = arr.slice(i, i + chunkSize);
    const values = chunk.map((id) => 'wd:' + id).join(' ');
    const rows = await sparql(`
SELECT ?item ?en ?zh WHERE {
  VALUES ?item { ${values} }
  ?item rdfs:label ?en . FILTER(LANG(?en)="en")
  OPTIONAL { ?item rdfs:label ?zh . FILTER(LANG(?zh)="zh") }
}`);
    for (const r of rows) {
      const id = qid(r, 'item')!;
      out.set(id, { en: val(r, 'en')!, zh: val(r, 'zh') });
    }
    console.log(`  labels chunk ${i + chunk.length}/${arr.length} -> ${out.size} total`);
  }
  return out;
}

// Collect referenced QIDs from airlines
const airlineRefIds = new Set<string>();
for (const a of rawAirlines) {
  if (a.country) airlineRefIds.add(a.country);
  if (a.hq) airlineRefIds.add(a.hq);
  for (const h of a.hubs) airlineRefIds.add(h);
}
console.log(`resolving ${airlineRefIds.size} airline-referenced entities (hubs/countries/HQ)...`);
const refLabels = await fetchLabels(airlineRefIds);

// Variants not in the aircraft dataset (need labels)
const aircraftIds = new Set(rawAircraft.map((a) => a.id));
const variantIds = new Set<string>();
for (const a of rawAircraft) for (const v of a.variants) if (!aircraftIds.has(v)) variantIds.add(v);
const engineIds = new Set<string>();
for (const a of rawAircraft) for (const e of a.poweredBys) engineIds.add(e);
console.log(`resolving ${variantIds.size} external variants + ${engineIds.size} engines...`);
const extLabels = await fetchLabels(new Set([...variantIds, ...engineIds]));

// ---------- 2. Unit conversion ----------
const toM = (v: number | null, unit: string | null): number | null => {
  if (v === null) return null;
  if (unit === 'Q11573') return v;         // metre
  if (unit === 'Q3710') return v * 0.3048; // foot -> m
  return null; // unknown unit, drop
};
const toKm = (v: number | null, unit: string | null): number | null => {
  if (v === null) return null;
  if (unit === 'Q828224') return v;          // kilometre
  if (unit === 'Q11573') return v / 1000;    // metre -> km
  return null;
};
const toKmh = (v: number | null, unit: string | null): number | null => {
  if (v === null) return null;
  if (unit === 'Q25343') return v;           // km/h
  if (unit === 'Q182429') return v * 3.6;    // m/s -> km/h
  if (unit === 'Q212671') return v * 1.852;  // knot -> km/h
  if (unit === 'Q209701') return v * 1.609344; // mph -> km/h
  return null;
};
const toKg = (v: number | null, unit: string | null): number | null => {
  if (v === null) return null;
  if (unit === 'Q11582') return v;           // kilogram
  if (unit === 'Q207694') return v * 1000;   // tonne
  if (unit === 'Q204836') return v * 0.45359237; // pound
  if (unit === 'Q2728234') return v * 0.45359237; // pound (lb)
  return null;
};
const toM2 = (v: number | null, unit: string | null): number | null => {
  if (v === null) return null;
  if (unit === 'Q25343') return v;            // m2 (Q25343 appears to be m2 for area)
  if (unit === 'Q11573') return v;            // m2
  return null;
};

// ---------- 3. Compose final datasets ----------
interface FinalAircraft {
  id: string; en: string; zh: string | null; desc: string | null;
  manufacturer: string | null; // QID
  lengthM: number | null; wingspanM: number | null; heightM: number | null; widthM: number | null;
  rangeKm: number | null; speedKmh: number | null; wingAreaM2: number | null;
  capacity: number | null; produced: number | null; altitudeM: number | null;
  firstFlight: string | null; serviceEntry: string | null;
  images: string[]; variants: string[]; poweredBy: string[]; operators: string[];
  family: string | null; // for variants: parent family QID
  basedOn: string[]; // derivative-of relationships (P144)
  massKg: number | null;
}

// Build family edges: item -> its variants; reverse: variant -> family
const familyOf = new Map<string, string>();
for (const a of rawAircraft) {
  for (const v of a.variants) {
    if (!familyOf.has(v)) familyOf.set(v, a.id);
  }
}

const aircraft: FinalAircraft[] = rawAircraft.map((a: any) => ({
  id: a.id,
  en: a.en ?? a.id,
  zh: a.zh,
  desc: a.desc,
  manufacturer: a.manufacturer,
  lengthM: toM(a.length, a.lengthUnit),
  wingspanM: toM(a.wingspan, a.wingspanUnit),
  heightM: toM(a.height, a.heightUnit),
  widthM: toM(a.width, a.widthUnit),
  rangeKm: toKm(a.range, a.rangeUnit),
  speedKmh: toKmh(a.speed, a.speedUnit),
  wingAreaM2: toM2(a.wingArea, a.wingAreaUnit),
  capacity: a.capacity,
  produced: a.produced,
  altitudeM: toM(a.altitude, a.altitudeUnit),
  firstFlight: a.firstFlight ?? a.inception,
  serviceEntry: a.serviceEntry,
  images: a.images.slice(0, 8),
  variants: a.variants,
  poweredBy: a.poweredBys,
  operators: a.operators,
  family: familyOf.get(a.id) ?? null,
  basedOn: a.basedOn ?? [],
  massKg: toKg(a.mass, a.massUnit),
}));

interface FinalAirline {
  id: string; en: string; zh: string | null; desc: string | null;
  iata: string | null; icao: string | null; callsign: string | null;
  country: string | null; hq: string | null; hubs: string[];
  founded: string | null; website: string | null;
  logo: string | null; image: string | null;
  fleet: string[]; alliance: string | null; // alliance QID
  active: boolean; source: 'wikidata' | 'openflights';
}

// Map alliance member names -> airline QIDs (overrides + normalized + word-boundary contains)
const norm = (s: string) => s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9 ]/g, ' ').replace(/\s+/g, ' ').trim();
const airlinesByName = new Map<string, string>(); // norm name -> id
for (const a of rawAirlines) {
  if (a.en) {
    const n = norm(a.en);
    if (!airlinesByName.has(n)) airlinesByName.set(n, a.id);
  }
}
const wordsOf = (s: string) => new Set(s.split(' ').filter((w) => w.length > 1));
const allianceOf = new Map<string, string>(); // airline QID -> alliance QID
for (const [allianceId, names] of Object.entries(rawMembers)) {
  for (const n of names) {
    const override = ALLIANCE_MEMBER_OVERRIDES[n];
    if (override) {
      allianceOf.set(override, allianceId);
      console.log(`[alliance] override: "${n}" -> ${override}`);
      continue;
    }
    const nn = norm(n);
    let q = airlinesByName.get(nn);
    if (!q) {
      const want = wordsOf(nn);
      for (const [name, id] of airlinesByName) {
        const have = wordsOf(name);
        // member's words are a subset of airline's words (e.g. "Qantas" in "Qantas Airways")
        let sub = true;
        for (const w of want) if (!have.has(w)) { sub = false; break; }
        if (sub) { q = id; break; }
      }
    }
    if (q) {
      allianceOf.set(q, allianceId);
    } else {
      console.warn(`[alliance] NO MATCH for member "${n}"`);
    }
  }
}console.log(`alliance memberships matched: ${allianceOf.size}`);

const airlines: FinalAirline[] = rawAirlines.map((a: any) => ({
  id: a.id,
  en: a.en ?? a.id,
  zh: a.zh,
  desc: a.desc,
  iata: a.iata || null,
  icao: a.icao || null,
  callsign: a.callsign || null,
  country: a.country,
  hq: a.hq,
  hubs: a.hubs,
  founded: a.founded,
  website: a.website,
  logo: a.logo,
  image: a.image,
  fleet: a.fleets,
  alliance: allianceOf.get(a.id) ?? null,
  active: true,
  source: 'wikidata',
}));

// Merge OpenFlights airlines: add airlines missing from Wikidata (defunct/regional coverage)
const ofText = await readFile(new URL('../src/airlines.dat', import.meta.url), 'utf8');
const ofRows: { name: string; iata: string; icao: string; callsign: string; country: string; active: boolean }[] = [];
for (const line of ofText.split('\n')) {
  const m = line.match(/^("(?:[^"]|"")*"|[^,]*),("(?:[^"]|"")*"|[^,]*),("(?:[^"]|"")*"|[^,]*),("(?:[^"]|"")*"|[^,]*),("(?:[^"]|"")*"|[^,]*),("(?:[^"]|"")*"|[^,]*),("(?:[^"]|"")*"|[^,]*),("(?:[^"]|"")*"|[^,]*)$/);
  if (!m) continue;
  const unq = (s: string) => (s === '\\N' ? '' : s.replace(/^"|"$/g, '').replace(/""/g, '"'));
  ofRows.push({
    name: unq(m[2]),
    iata: unq(m[4]),
    icao: unq(m[5]),
    callsign: unq(m[6]),
    country: unq(m[7]),
    active: unq(m[8]) === 'Y',
  });
}
console.log(`OpenFlights parsed: ${ofRows.length} airlines`);

const knownIcao = new Set(airlines.map((a) => a.icao).filter(Boolean));
const knownIata = new Set(airlines.map((a) => a.iata).filter(Boolean));
let added = 0;
for (const o of ofRows) {
  const dup = o.icao ? knownIcao.has(o.icao) : o.iata ? knownIata.has(o.iata) : false;
  if (dup || !o.name || o.iata === '-' && o.icao === 'N/A' && !o.callsign) continue;
  // Also skip entries with no codes at all and generic names
  if (!o.iata && !o.icao && !o.callsign) continue;
  airlines.push({
    id: 'OF:' + (o.icao || o.iata || o.name),
    en: o.name,
    zh: null,
    desc: null,
    iata: o.iata || null,
    icao: o.icao || null,
    callsign: o.callsign || null,
    country: null,
    hq: null,
    hubs: [],
    founded: null,
    website: null,
    logo: null,
    image: null,
    fleet: [],
    alliance: null,
    active: o.active,
    source: 'openflights',
  });
  if (o.icao) knownIcao.add(o.icao);
  if (o.iata) knownIata.add(o.iata);
  added++;
}
console.log(`added ${added} airlines from OpenFlights (defunct/regional)`);

// Manufacturers dataset
const manufacturers = [...mfrLabels.entries()].map(([id, l]) => ({
  id,
  en: l.en,
  zh: l.zh,
  aircraftCount: aircraft.filter((a) => a.manufacturer === id).length,
}));


// ---------- Aircraft type codes (OpenFlights planes.dat) ----------
const planesText = await readFile(new URL('../src/planes.dat', import.meta.url), 'utf8');
const aircraftCodes: { name: string; iata: string; icao: string }[] = [];
for (const line of planesText.split('\n')) {
  const m = line.match(/^"((?:[^"]|"")*)"s*,s*"([^"]*)"s*,s*"([^"]*)"\s*$/);
  if (m) {
    aircraftCodes.push({ name: m[1].replace(/""/g, '"'), iata: m[2], icao: m[3] });
  }
}
console.log(`aircraft type codes: ${aircraftCodes.length}`);

// ---------- 4. Write final ----------
const finalDir = new URL('final/', GEN);
await mkdir(finalDir, { recursive: true });
await mkdir(APP_DATA, { recursive: true });

const output = {
  generatedAt: new Date().toISOString(),
  meta: {
    aircraftCount: aircraft.length,
    airlineCount: airlines.length,
    allianceCount: Object.keys(rawAlliances).length,
    manufacturerCount: manufacturers.length,
  },
  aircraft,
  airlines,
  alliances: Object.values(rawAlliances),
  allianceMembers: Object.fromEntries(Object.entries(rawMembers).map(([id, names]) => [
    id,
    names.map((n) => airlinesByName.get(n.toLowerCase())).filter(Boolean),
  ])),
  manufacturers,
  aircraftCodes,
  labels: {
    refs: Object.fromEntries([...refLabels.entries()].map(([id, l]) => [id, [l.en, l.zh]])),
    ext: Object.fromEntries([...extLabels.entries()].map(([id, l]) => [id, [l.en, l.zh]])),
    mfr: Object.fromEntries([...mfrLabels.entries()].map(([id, l]) => [id, [l.en, l.zh]])),
  },
};

await writeFile(new URL('final/encyclopaedia.json', GEN), JSON.stringify(output));
const size = (new TextEncoder().encode(JSON.stringify(output))).length / 1024 / 1024;
console.log(`final/encyclopaedia.json: ${size.toFixed(2)} MB`);
console.log(`meta: ${JSON.stringify(output.meta)}`);

// Copy to app
await cp(new URL('final/encyclopaedia.json', GEN), new URL('encyclopaedia.json', APP_DATA), { force: true });
console.log('copied to app/src/data/encyclopaedia.json');