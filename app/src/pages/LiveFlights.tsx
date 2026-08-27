import { useEffect, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { getAirline, displayName, findAircraftByTypeCode } from '../data'
import { useUI } from '../store/ui'
import { useLiveFlights, icaoPrefix, colorForAltitude } from '../hooks/useLiveFlights'

export default function LiveFlights() {
  const { t } = useTranslation()
  const lang = useUI((s) => s.lang)
  const theme = useUI((s) => s.theme)
  const mapRef = useRef<HTMLDivElement>(null)
  const mapObj = useRef<L.Map | null>(null)
  const markers = useRef<L.CircleMarker[]>([])
  const { flights, loading, error, lastUpdate, source, stale } = useLiveFlights()

  const tileLayer = useRef<L.TileLayer | null>(null)

  useEffect(() => {
    if (!mapRef.current || mapObj.current) return
    const map = L.map(mapRef.current, { center: [34, 106], zoom: 4, zoomControl: true })
    const layer = L.tileLayer(
      theme === 'dark'
        ? 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png'
        : 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png',
      { attribution: '&copy; OpenStreetMap contributors &copy; CARTO', maxZoom: 19 }
    ).addTo(map)
    tileLayer.current = layer
    mapObj.current = map
    return () => {
      map.remove()
      mapObj.current = null
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // Swap tiles when theme changes
  useEffect(() => {
    const map = mapObj.current
    if (!map || !tileLayer.current) return
    const url =
      theme === 'dark'
        ? 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png'
        : 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png'
    tileLayer.current.setUrl(url)
  }, [theme])

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
      const aircraft = f.typeCode ? findAircraftByTypeCode(f.typeCode) : undefined
      const popup = L.popup({ maxWidth: 280 }).setContent(
        '<div style="font-family: inherit">' +
          '<div style="font-weight:600;font-size:14px">' + (f.callsign || t('live.unknownCallsign')) + '</div>' +
          '<div style="font-size:12px;color:#666;margin:2px 0 6px">' + (name ?? f.country) + '</div>' +
          '<table style="font-size:12px;border-collapse:collapse;width:100%">' +
          (f.typeCode ? '<tr><td style="color:#888;padding:1px 8px 1px 0">' + t('live.aircraft') + '</td><td style="font-weight:500">' + f.typeCode + (aircraft ? ' · <a href="aircraft/' + aircraft.id + '" style="color:#1d4ed8">' + displayName(aircraft.en, aircraft.zh, lang) + '</a>' : '') + '</td></tr>' : '') +
          (f.registration ? '<tr><td style="color:#888;padding:1px 8px 1px 0">' + t('live.registration') + '</td><td style="font-weight:500;font-family:monospace">' + f.registration + '</td></tr>' : '') +
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

      {/* Data source + freshness status */}
      <div className="mt-3 flex flex-wrap items-center gap-2 text-xs">
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-runway-100 dark:bg-runway-800 text-runway-600 dark:text-runway-300">
          <span className={`w-2 h-2 rounded-full ${stale ? 'bg-amber-500' : 'bg-emerald-500'}`} />
          {source === 'opensky' ? 'OpenSky Network (ADS-B)' : source ?? t('live.source')}
        </span>
        {stale && (
          <span className="px-2.5 py-1 rounded-lg bg-amber-50 dark:bg-amber-900/40 text-amber-600 dark:text-amber-300">
            {t('live.stale')}
          </span>
        )}
        <span className="text-runway-400">
          {t('live.refresh')}: {t('live.refreshInterval')}
        </span>
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