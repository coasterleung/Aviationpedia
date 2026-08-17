// Aviationpedia Live Flights Worker
// - Cron (every 5 min): fetch OpenSky China-region states -> join aircraft type/reg from a small
//   lookup served by the GitHub workflow -> cache in KV -> serve with CORS.
// - GET / : latest flights JSON (CORS *)

const OPENSKY_URL =
  'https://opensky-network.org/api/states/all?lamin=18&lomin=73&lamax=54&lomax=135'
const LOOKUP_URL =
  'https://raw.githubusercontent.com/coasterleung/Aviationpedia/live-data/data/lookup.json'

function compact(data, lookup) {
  const states = (data.states ?? []).map((s) => {
    const m = lookup ? lookup[String(s[0]).toLowerCase()] : null
    return [
      s[0],
      (s[1] ?? '').trim(),
      s[2] ?? '',
      s[5],
      s[6],
      s[7],
      s[8] === true ? 1 : 0,
      s[9] ?? null,
      s[10] ?? null,
      s[11] ?? null,
      s[13] ?? null,
      m ? m[0] : null,
      m ? m[1] : null,
    ]
  })
  return JSON.stringify({ fetchedAt: Date.now(), time: data.time, count: states.length, states })
}

export default {
  async scheduled(controller, env, ctx) {
    ctx.waitUntil(refresh(env))
  },

  async fetch(request, env, ctx) {
    const cors = {
      'Access-Control-Allow-Origin': '*',
      'Content-Type': 'application/json; charset=utf-8',
    }
    const url = new URL(request.url)

    // admin: seed/update lookup (optional; not used by the GitHub workflow yet)
    if (url.pathname === '/admin/lookup' && request.method === 'POST') {
      if (request.headers.get('x-api-token') !== env.API_TOKEN) {
        return new Response('unauthorized', { status: 401, headers: cors })
      }
      const body = await request.json()
      await env.LOOKUP.put('icao-lookup', JSON.stringify(body))
      return new Response('ok', { headers: cors })
    }

    // serve latest flights
    const data = await env.FLIGHTS.get('latest')
    if (!data) {
      return new Response(JSON.stringify({ error: 'no data yet' }), { status: 503, headers: cors })
    }
    return new Response(data, { headers: cors })
  },
}

async function refresh(env) {
  try {
    const [statesRes, lookupRes] = await Promise.all([
      fetch(OPENSKY_URL, { headers: { 'User-Agent': 'aviationpedia-worker/0.1' } }),
      fetch(LOOKUP_URL, { headers: { 'User-Agent': 'aviationpedia-worker/0.1' } }).catch(() => null),
    ])
    if (!statesRes.ok) return
    const data = await statesRes.json()
    let lookup = null
    if (lookupRes && lookupRes.ok) {
      try { lookup = await lookupRes.json() } catch { /* ignore */ }
    }
    const out = compact(data, lookup)
    await env.FLIGHTS.put('latest', out, { expirationTtl: 7200 })
    console.log('flights refreshed:', JSON.parse(out).count, 'aircraft')
  } catch (e) {
    console.error('refresh failed:', String(e))
  }
}
