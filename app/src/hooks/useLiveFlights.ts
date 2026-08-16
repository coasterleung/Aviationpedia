import { useEffect, useState } from 'react'

export interface LiveFlight {
  icao24: string
  callsign: string
  country: string
  lon: number
  lat: number
  baroAlt: number | null
  onGround: boolean
  vel: number | null
  track: number | null
  vrate: number | null
  geoAlt: number | null
}

// Live data: GitHub Actions pushes OpenSky China-region states to the live-data branch every 5 min.
export const LIVE_DATA_URL =
  'https://raw.githubusercontent.com/coasterleung/Aviationpedia/live-data/data/flights.json'

/** Parse the 3-letter ICAO prefix from a callsign (e.g. "CSN3456" -> "CSN"). */
export function icaoPrefix(callsign: string): string {
  const m = callsign.match(/^[A-Z]{3}/)
  return m ? m[0] : ''
}

/** Marker/row color by barometric altitude. */
export function colorForAltitude(alt: number | null): string {
  if (alt == null || alt <= 0) return '#64748b'
  if (alt < 3000) return '#22c55e'
  if (alt < 7000) return '#eab308'
  if (alt < 10000) return '#f97316'
  return '#ef4444'
}

/** Poll live flight data (shared by map page and airline detail). */
export function useLiveFlights(pollMs = 60_000) {
  const [flights, setFlights] = useState<LiveFlight[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [lastUpdate, setLastUpdate] = useState<number | null>(null)

  useEffect(() => {
    let cancelled = false
    async function load() {
      try {
        const res = await fetch(LIVE_DATA_URL)
        if (!res.ok) throw new Error('HTTP ' + res.status)
        const json = await res.json()
        if (cancelled) return
        const list: LiveFlight[] = (json.states ?? []).map((s: (string | number | null)[]) => ({
          icao24: String(s[0]),
          callsign: String(s[1] ?? ''),
          country: String(s[2] ?? ''),
          lon: Number(s[3]),
          lat: Number(s[4]),
          baroAlt: s[5] == null ? null : Number(s[5]),
          onGround: s[6] === 1,
          vel: s[7] == null ? null : Number(s[7]),
          track: s[8] == null ? null : Number(s[8]),
          vrate: s[9] == null ? null : Number(s[9]),
          geoAlt: s[10] == null ? null : Number(s[10]),
        }))
        setFlights(list)
        setLastUpdate(typeof json.fetchedAt === 'number' ? json.fetchedAt : Date.now())
        setError(null)
      } catch (e) {
        if (!cancelled) setError(String(e instanceof Error ? e.message : e))
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    load()
    const timer = setInterval(load, pollMs)
    return () => {
      cancelled = true
      clearInterval(timer)
    }
  }, [pollMs])

  return { flights, loading, error, lastUpdate }
}
