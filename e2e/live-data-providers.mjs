/**
 * Pluggable live-flight providers. Each provider returns `{ time, states }`,
 * isolating the compacting pipeline and frontend from upstream API formats.
 */

const CHINA_BOUNDS = 'lamin=18&lomin=73&lamax=54&lomax=135'

async function fetchJson(url) {
  const res = await fetch(url, {
    headers: { 'User-Agent': 'aviationpedia-live-data/0.2' },
    signal: AbortSignal.timeout(30_000),
  })
  if (!res.ok) throw new Error(`Upstream HTTP ${res.status}`)
  return res.json()
}

export const providers = {
  opensky: {
    id: 'opensky',
    label: 'OpenSky Network (ADS-B)',
    commercial: false,
    async fetchStates() {
      const json = await fetchJson(`https://opensky-network.org/api/states/all?${CHINA_BOUNDS}`)
      if (!Array.isArray(json.states)) throw new Error('OpenSky response has no states array')
      return json
    },
  },
  // Templates: normalize a licensed API or readsb/dump1090 response to
  // `{ time, states }` here before making either provider active.
  licensed: {
    id: 'licensed',
    label: 'Licensed provider',
    commercial: true,
    async fetchStates() { throw new Error('Licensed provider is not configured') },
  },
  selfHosted: {
    id: 'selfHosted',
    label: 'Self-hosted ADS-B receiver',
    commercial: true,
    async fetchStates() { throw new Error('Self-hosted ADS-B normalizer is not configured') },
  },
}

export async function fetchFromProvider(id = 'opensky') {
  const provider = providers[id]
  if (!provider) throw new Error(`Unknown live-flight provider: ${id}`)
  return { provider, json: await provider.fetchStates() }
}
