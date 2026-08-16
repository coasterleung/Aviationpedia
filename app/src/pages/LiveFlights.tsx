import { useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { getAirline, displayName } from '../data'
import { useUI } from '../store/ui'

// Live data: GitHub Actions pushes OpenSky China-region states to the live-data branch every 5 min.
const LIVE_DATA_URL =
  'https://raw.githubusercontent.com/coasterleung/Aviationpedia/live-data/data/flights.json'
const POLL_MS = 60_000

interface Flight {
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

function colorForAltitude(alt: number | null): string {
  if (alt == null || alt <= 0) return '#64748b'
  if (alt < 3000) return '#22c55e'
  if (alt < 7000) return '#eab308'
  if (alt < 10000) return '#f97316'
  return '#ef4444'
}

function icaoPrefix(callsign: string): string {
  const m = callsign.match(/^[A-Z]{3}/)
  return m ? m[0] : ''
}

export default function LiveFlights() {
  const { t } = useTranslation()
  const lang = useUI((s) => s.lang)
  const mapRef = useRef<HTMLDivElement>(null)
  const mapObj = useRef<L.Map | null>(null)
  const markers = useRef<L.CircleMarker[]>([])
  const [flights, setFlights] = useState<Flight[]>([])
  const [lastUpdate, setLastUpdate] = useState<number | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!mapRef.current || mapObj.current) return
    const map = L.map(mapRef.current, { center: [34, 106], zoom: 4, zoomControl: true })
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap contributors',
      maxZoom: 19,
    }).addTo(map)
    mapObj.current = map
    return () => {
      map.remove()
      mapObj.current = null
    }
  }, [])

  useEffect(() => {
    let cancelled = false
    async function load() {
      try {
        const res = await fetch(LIVE_DATA_URL)
        if (!res.ok) throw new Error('HTTP ' + res.status)
        const json = await res.json()
        if (cancelled) return
        const list: Flight[] = (json.states ?? []).map((s: (string | number | null)[]) => ({
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
    const timer = setInterval(load, POLL_MS)
    return () => {
      cancelled = true
      clearInterval(timer)
    }
  }, [])

  useEffect(() => {
    const map = mapObj.current
    if (!map) return
    markers.current.forEach((m) => m.remove())
    markers.current = []

    for (const f of flights) {
      if (f.lat == null || f.lon == null || Number.isNaN(f.lat) || Number.isNaN(f.lon)) continue
      const marker = L.circleMarker([f.lat, f.lon], {
        radius: f.onGround ? 4 : 6,
        color: '#ffffff',
        weight: 1,
        fillColor: colorForAltitude(f.baroAlt),
        fillOpacity: 0.9,
      })
      const airline = icaoPrefix(f.callsign) ? getAirline(icaoPrefix(f.callsign)) : undefined
      const name = airline ? displayName(airline.en, airline.zh, lang) : null
      const popup = L.popup({ maxWidth: 260 }).setContent(
        '<div style="font-family: inherit">' +
          '<div style="font-weight:600;font-size:14px">' + (f.callsign || t('live.unknownCallsign')) + '</div>' +
          '<div style="font-size:12px;color:#666;margin:2px 0 6px">' + (name ?? f.country) + '</div>' +
          '<table style="font-size:12px;border-collapse:collapse;width:100%">' +
          (f.baroAlt != null ? '<tr><td style="color:#888;padding:1px 8px 1px 0">' + t('live.altitude') + '</td><td style="font-weight:500">' + Math.round(f.baroAlt).toLocaleString() + ' m</td></tr>' : '') +
          (f.vel != null ? '<tr><td style="color:#888;padding:1px 8px 1px 0">' + t('live.speed') + '</td><td style="font-weight:500">' + Math.round(f.vel * 3.6).toLocaleString() + ' km/h</td></tr>' : '') +
          (f.track != null ? '<tr><td style="color:#888;padding:1px 8px 1px 0">' + t('live.heading') + '</td><td style="font-weight:500">' + Math.round(f.track) + '°</td></tr>' : '') +
          (f.vrate != null ? '<tr><td style="color:#888;padding:1px 8px 1px 0">' + t('live.vrate') + '</td><td style="font-weight:500">' + Math.round(f.vrate).toLocaleString() + ' m/s</td></tr>' : '') +
          '<tr><td style="color:#888;padding:1px 8px 1px 0">' + t('live.origin') + '</td><td style="font-weight:500">' + (f.country || '—') + '</td></tr>' +
          (airline ? '<tr><td colspan="2" style="padding-top:4px"><a href="airlines/' + airline.id + '" style="color:#1d4ed8">' + t('live.viewAirline') + '</a></td></tr>' : '') +
          '</table></div>'
      )
      marker.bindPopup(popup)
      marker.addTo(map)
      markers.current.push(marker)
    }
  }, [flights, lang])

  return (
    <div className="max-w-7xl mx-auto px-4 py-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">{t('live.title')}</h1>
          <p className="text-sm text-runway-500 dark:text-runway-400 mt-1">
            {t('live.subtitle')} · {t('live.region')}
          </p>
        </div>
        <div className="text-xs text-runway-500 dark:text-runway-400 text-right">
          <div>
            {t('live.aircraftCount')}: <span className="font-semibold">{flights.length.toLocaleString()}</span>
          </div>
          <div className="mt-0.5">
            {lastUpdate
              ? t('live.lastUpdate') + ': ' + new Date(lastUpdate).toLocaleTimeString(lang === 'zh' ? 'zh-CN' : 'en-US')
              : t('common.loading')}
          </div>
        </div>
      </div>

      <div className="mt-4 grid lg:grid-cols-[1fr_280px] gap-4">
        <div className="rounded-2xl overflow-hidden border border-runway-200 dark:border-runway-700 relative h-[520px] lg:h-[600px]">
          {loading && (
            <div className="absolute inset-0 z-[500] bg-white/70 dark:bg-runway-950/70 flex items-center justify-center text-sm text-runway-500">
              {t('common.loading')}
            </div>
          )}
          {error && !loading && (
            <div className="absolute top-3 left-1/2 -translate-x-1/2 z-[500] bg-red-50 dark:bg-red-900/70 border border-red-200 text-red-600 dark:text-red-300 text-xs px-4 py-2 rounded-lg">
              {t('live.error')}: {error}
            </div>
          )}
          <div ref={mapRef} className="w-full h-full z-0" />
        </div>

        <div className="space-y-3">
          <div className="bg-white dark:bg-runway-900 border border-runway-200 dark:border-runway-700 rounded-2xl p-4 text-sm">
            <h2 className="font-semibold mb-3">{t('live.legend')}</h2>
            <div className="space-y-2">
              {[
                ['#ef4444', t('live.highAlt')],
                ['#f97316', t('live.midHighAlt')],
                ['#eab308', t('live.midAlt')],
                ['#22c55e', t('live.lowAlt')],
                ['#64748b', t('live.ground')],
              ].map(([c, label]) => (
                <div key={c} className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full border border-white" style={{ backgroundColor: c }} />
                  <span className="text-xs text-runway-600 dark:text-runway-300">{label}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="bg-white dark:bg-runway-900 border border-runway-200 dark:border-runway-700 rounded-2xl p-4 text-xs text-runway-500 dark:text-runway-400 leading-relaxed">
            {t('live.disclaimer')}
          </div>
        </div>
      </div>
    </div>
  )
}
