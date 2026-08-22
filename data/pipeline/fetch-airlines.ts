/**
 * Fetch airlines from Wikidata (SPARQL) + alliances (wbgetentities) + members (Wikipedia).
 * Output: data/generated/raw-airlines.json, raw-alliances.json, raw-members.json
 */
import { sparql, val, qid, assertContains } from './helpers.ts';
import { writeFile, mkdir } from 'node:fs/promises';
/** Fetch JSON with retry + backoff (handles API rate limits). */
async function fetchJson(url: string, retries = 6): Promise<any> {
  let attempt = 0;
  while (true) {
    attempt++;
    try {
      const res = await fetch(url, { headers: { 'User-Agent': 'plane-encyclopaedia/0.1 (data pipeline)' } });
      if (res.status === 429 || res.status === 503) throw new Error(`HTTP ${res.status}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return await res.json();
    } catch (err) {
      if (attempt > retries) throw err;
      const wait = Math.min(3000 * 2 ** (attempt - 1), 30000);
      console.warn(`[fetchJson] ${(err as Error).message} — retrying in ${wait}ms`);
      await new Promise((r) => setTimeout(r, wait));
    }
  }
}


// ---- Query A: airlines ----
const QUERY_A = `
SELECT ?item ?itemLabel ?zhLabel ?desc
  (SAMPLE(?iata) AS ?iata)
  (SAMPLE(?icao) AS ?icao)
  (SAMPLE(?callsign) AS ?callsign)
  (SAMPLE(?founded) AS ?founded)
  (SAMPLE(?website) AS ?website)
  (SAMPLE(?country) AS ?country)
  (SAMPLE(?logo) AS ?logo)
  (SAMPLE(?image) AS ?image)
  (SAMPLE(?hq) AS ?hq)
  (GROUP_CONCAT(DISTINCT ?hub; separator="|") AS ?hubs)
  (GROUP_CONCAT(DISTINCT ?fleet; separator="|") AS ?fleets)
WHERE {
  ?item wdt:P31 wd:Q46970 .
  OPTIONAL { ?item wdt:P229 ?iata . }
  OPTIONAL { ?item wdt:P230 ?icao . }
  OPTIONAL { ?item wdt:P432 ?callsign . }
  OPTIONAL { ?item wdt:P571 ?founded . }
  OPTIONAL { ?item wdt:P856 ?website . }
  OPTIONAL { ?item wdt:P17 ?country . }
  OPTIONAL { ?item wdt:P154 ?logo . }
  OPTIONAL { ?item wdt:P18 ?image . }
  OPTIONAL { ?item wdt:P159 ?hq . }
  OPTIONAL { ?item wdt:P113 ?hub . }
  OPTIONAL { ?item wdt:P121 ?fleet . }
  OPTIONAL { ?item schema:description ?desc . FILTER(LANG(?desc)="en") }
  ?item rdfs:label ?itemLabel . FILTER(LANG(?itemLabel)="en")
  OPTIONAL { ?item rdfs:label ?zhLabel . FILTER(LANG(?zhLabel)="zh") }
}
GROUP BY ?item ?itemLabel ?zhLabel ?desc
LIMIT 50000
`;


// ---- Query A2: airlines WITHOUT English labels (fallback: any language label) ----
const QUERY_A2 = `
SELECT ?item (SAMPLE(?pick) AS ?label) WHERE {
  ?item wdt:P31 wd:Q46970 .
  ?item rdfs:label ?pick .
  MINUS { ?item rdfs:label ?enl . FILTER(LANG(?enl) = "en") }
} GROUP BY ?item
LIMIT 20000
`;

const toIdList = (s: string | null, stripUrl = true): string[] =>
  (s ?? '').split('|').filter(Boolean).map((x) => (stripUrl ? x.split('/').pop()! : x));

console.log('[fetch] airlines...');
const rows = await sparql(QUERY_A);

const airlines = rows.map((b) => ({
  id: qid(b, 'item')!,
  en: val(b, 'itemLabel'),
  zh: val(b, 'zhLabel'),
  desc: val(b, 'desc'),
  iata: val(b, 'iata'),
  icao: val(b, 'icao'),
  callsign: val(b, 'callsign'),
  founded: val(b, 'founded'),
  website: val(b, 'website'),
  country: qid(b, 'country'),
  logo: (val(b, 'logo')?.replace('http://commons.wikimedia.org/wiki/Special:FilePath/', '') || null) ? (() => { const n = val(b, 'logo')!.replace('http://commons.wikimedia.org/wiki/Special:FilePath/', ''); try { return decodeURIComponent(n) } catch { return n } })() : null,
  image: (val(b, 'image')?.replace('http://commons.wikimedia.org/wiki/Special:FilePath/', '') || null) ? (() => { const n = val(b, 'image')!.replace('http://commons.wikimedia.org/wiki/Special:FilePath/', ''); try { return decodeURIComponent(n) } catch { return n } })() : null,
  hq: qid(b, 'hq'),
  hubs: toIdList(val(b, 'hubs')),
  fleets: toIdList(val(b, 'fleets')),
}));


console.log('[fetch] airlines without en labels...');
const rowsA2 = await sparql(QUERY_A2);
console.log(`  -> ${rowsA2.length} additional airlines without en labels`);
const a2ById = new Map(rowsA2.map((r) => [qid(r, 'item')!, val(r, 'label')]));
const airlinesAll = rowsA2
  .map((r) => ({
    id: qid(r, 'item')!,
    en: val(r, 'label') ?? qid(r, 'item')!,
    zh: null,
    desc: null,
    iata: null,
    icao: null,
    callsign: null,
    founded: null,
    website: null,
    country: null,
    logo: null,
    image: null,
    hq: null,
    hubs: [],
    fleets: [],
  }))
  .concat(airlines);

assertContains(
  airlines.map((a) => ({ id: a.id, en: a.en })),
  [{ id: 'Q32245', name: 'Singapore Airlines' }, { id: 'Q291090', name: 'China Southern Airlines' }],
  'airlines'
);
console.log(`airlines=${airlines.length} withIata=${airlines.filter((a) => a.iata).length} withIcao=${airlines.filter((a) => a.icao).length} withFleet=${airlines.filter((a) => a.fleets.length > 0).length} withImg=${airlines.filter((a) => a.image || a.logo).length}`);

// ---- Alliances via wbgetentities ----
const ALLIANCE_IDS = [
  { id: 'Q189709', name: 'Star Alliance' },
  { id: 'Q212282', name: 'SkyTeam' },
  { id: 'Q8787', name: 'Oneworld' },
];
const alliances: Record<string, { id: string; en: string; zh?: string; founded?: string; website?: string; logo?: string; image?: string; members?: number }> = {};
for (const a of ALLIANCE_IDS) {
  const url = `https://www.wikidata.org/w/api.php?action=wbgetentities&ids=${a.id}&props=claims|labels&languages=en|zh&format=json`;
  const res = await fetch(url, { headers: { 'User-Agent': 'plane-encyclopaedia/0.1 (dev)' } });
  const json = await res.json() as any;
  const e = json.entities?.[a.id];
  if (!e) continue;
  const c = e.claims ?? {};
  const pick = (p: string) => c[p]?.[0]?.mainsnak?.datavalue?.value;
  const amount = (p: string) => {
    const v = c[p]?.[0]?.mainsnak?.datavalue?.value;
    return v && typeof v === 'object' && 'amount' in v ? Number(v.amount) : undefined;
  };
  const uri = (p: string) => {
    const v = pick(p);
    if (typeof v !== 'string') return undefined;
    const n = v.replace('http://commons.wikimedia.org/wiki/Special:FilePath/', '');
    try { return decodeURIComponent(n) } catch { return n }
  };
  const time = (p: string) => {
    const v = pick(p);
    return v && typeof v === 'object' && 'time' in v ? String(v.time) : undefined;
  };
  alliances[a.id] = {
    id: a.id,
    en: e.labels?.en?.value ?? a.name,
    zh: e.labels?.zh?.value,
    founded: time('P571'),
    website: typeof pick('P856') === 'string' ? pick('P856') as string : undefined,
    logo: uri('P154'),
    image: uri('P18'),
    members: amount('P2124'),
  };
  console.log(`[alliance] ${a.name} -> ${JSON.stringify(alliances[a.id])}`);
  await new Promise((r) => setTimeout(r, 1500));
}

// ---- Alliance members from Wikipedia (robust table parser) ----
const WIKI_PAGES: Record<string, string> = {
  Q189709: 'Star Alliance',
  Q212282: 'SkyTeam',
  Q8787: 'Oneworld',
};

/** Parse member airlines from a wikitext table: rows start with |- and member cells are {{flagicon|XX}} [[Name]] */
function parseMembers(wt: string): string[] {
  // Find the FIRST header line containing "Full members" (handles all three alliance pages)
  const lines = wt.split('\n');
  const headerIdx = lines.findIndex((l) => /^==+/.test(l.trimStart()) && /Full\s+members/i.test(l));
  if (headerIdx === -1) return [];
  const rest = lines.slice(headerIdx + 1).join('\n');
  const nextHeader = rest.search(/^==+[^=]+==+$/m);
  const section = nextHeader === -1 ? rest : rest.slice(0, nextHeader);
  const members: string[] = [];
  for (const row of section.split('\n|-')) {
    const cell = row.match(/^\|\s*\{\{flagicon\|[^}]+\}\}\s*\[\[([^\]|]+)\]\]/m);
    if (cell && !/\{\{N\/A\}\}/.test(row.slice(0, 40))) {
      members.push(cell[1].trim());
    }
  }
  return [...new Set(members)];
}

const membersOut: Record<string, string[]> = {};
for (const [qidId, page] of Object.entries(WIKI_PAGES)) {
  const url = `https://en.wikipedia.org/w/api.php?action=parse&page=${encodeURIComponent(page)}&prop=wikitext&format=json&formatversion=2`;
  const res = await fetch(url, { headers: { 'User-Agent': 'plane-encyclopaedia/0.1 (dev)' } });
  const json = await res.json() as any;
  const wt = json.parse?.wikitext ?? '';
  const members = parseMembers(wt);
  membersOut[qidId] = members;
  console.log(`[members] ${page}: parsed ${members.length} members: ${members.join(', ')}`);
  await new Promise((r) => setTimeout(r, 1500));
}

await mkdir(new URL('../generated', import.meta.url), { recursive: true });
await writeFile(new URL('../generated/raw-airlines.json', import.meta.url), JSON.stringify({ generatedAt: new Date().toISOString(), airlines: airlinesAll }, null, 1));
await writeFile(new URL('../generated/raw-alliances.json', import.meta.url), JSON.stringify({ generatedAt: new Date().toISOString(), alliances }, null, 1));
await writeFile(new URL('../generated/raw-members.json', import.meta.url), JSON.stringify({ generatedAt: new Date().toISOString(), members: membersOut }, null, 1));
console.log('wrote raw-airlines.json, raw-alliances.json, raw-members.json');