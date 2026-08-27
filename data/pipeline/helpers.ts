/**
 * Shared helpers for the data pipeline.
 * Run with: node --experimental-strip-types <script>.ts
 */

export interface Binding {
  [k: string]: { type: string; value: string; datatype?: string } | undefined;
}

/** Execute a SPARQL query against Wikidata with retry + backoff. */
export async function sparql(query: string, maxRetries = 5): Promise<Binding[]> {
  const url = 'https://query.wikidata.org/sparql?format=json&query=' + encodeURIComponent(query);
  let attempt = 0;
  while (true) {
    attempt++;
    try {
      const res = await fetch(url, {
        headers: {
          'User-Agent': 'plane-encyclopaedia/0.1 (data pipeline; contact: dev)',
          Accept: 'application/sparql-results+json',
        },
      });
      if (res.status === 429) {
        throw new Error(`rate limited (HTTP 429), attempt ${attempt}`);
      }
      if (!res.ok) {
        const text = await res.text();
        throw new Error(`SPARQL HTTP ${res.status}: ${text.slice(0, 300)}`);
      }
      const json = await res.json() as { results?: { bindings?: Binding[] } };
      return json.results?.bindings ?? [];
    } catch (err) {
      if (attempt > maxRetries) throw err;
      const wait = Math.min(4000 * 2 ** (attempt - 1), 30000);
      console.warn(`[sparql] ${(err as Error).message} — retrying in ${wait}ms`);
      await new Promise((r) => setTimeout(r, wait));
    }
  }
}

/** Extract a plain value from a binding field. */
export function val(b: Binding, key: string): string | null {
  return b[key]?.value ?? null;
}

/** Extract a decimal value as a number. */
export function num(b: Binding, key: string): number | null {
  const v = val(b, key);
  if (v === null) return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

/** Extract the QID from a URI value. */
export function qid(b: Binding, key: string): string | null {
  const v = val(b, key);
  if (!v) return null;
  const m = v.match(/Q\d+/);
  return m ? m[0] : null;
}

/** Extract just the filename from a Special:FilePath URL. */
export function imageName(b: Binding, key: string): string | null {
  const v = val(b, key);
  if (!v) return null;
  return v.replace('http://commons.wikimedia.org/wiki/Special:FilePath/', '');
}

/** Sanity-check that a fetched dataset contains known entities; throw otherwise. */
export function assertContains(
  items: { id?: string; en?: string | null }[],
  must: { id?: string; name?: string }[],
  label: string
) {
  const ids = new Set(items.map((i) => i.id));
  const names = new Set(items.map((i) => (i.en ?? '').toLowerCase()));
  const missing = must.filter(
    (m) => (m.id && !ids.has(m.id)) || (m.name && !names.has(m.name.toLowerCase()))
  );
  if (missing.length) {
    throw new Error(
      `SANITY CHECK FAILED for ${label}: missing ${missing.map((m) => m.id ?? m.name).join(', ')}`
    );
  }
  console.log(`[sanity] ${label}: OK (${items.length} items, ${must.length} known entities present)`);
}
