import { useMemo } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { getAirline, refLabel, displayName, aircraftName, getAlliance } from '../data'
import { useUI } from '../store/ui'
import ImageWithFallback from '../components/ImageWithFallback'
import Avatar from '../components/Avatar'
import { ActionButtons } from '../components/ActionButtons'
import { notFound } from './NotFound'
import { useLiveFlights, colorForAltitude } from '../hooks/useLiveFlights'

export default function AirlineDetail() {
  const { id } = useParams<{ id: string }>()
  const { t } = useTranslation()
  const lang = useUI((s) => s.lang)
  const a = id ? getAirline(id) : undefined
  const { flights: liveFlights, loading: liveLoading } = useLiveFlights()
  const myFlights = useMemo(() => {
    if (!a?.icao) return []
    const prefix = a.icao.toUpperCase()
    return liveFlights.filter(
      (f) => f.callsign.startsWith(prefix) && f.callsign.length > prefix.length
    )
  }, [liveFlights, a?.icao])

  if (!a) return notFound(t('airlines.title'))

  const name = displayName(a.en, a.zh, lang)
  const country = a.country ? refLabel(a.country, lang) : null
  const hq = a.hq ? refLabel(a.hq, lang) : null
  const alliance = a.alliance ? getAlliance(a.alliance) : undefined
  const fleet = a.fleet.slice(0, 30).map((fid) => ({ id: fid, name: aircraftName(fid, lang) }))

  const info = [
    { key: t('airlines.iata'), value: a.iata },
    { key: t('airlines.icao'), value: a.icao },
    { key: t('airlines.callsign'), value: a.callsign },
    { key: t('airlines.country'), value: country },
    { key: t('airlines.headquarters'), value: hq },
    { key: t('airlines.founded'), value: a.founded ? a.founded.slice(0, 10) : null },
    { key: t('airlines.status'), value: a.active ? t('airlines.active') : t('airlines.defunct') },
  ].filter((r) => r.value != null)

  return (
    <div className="max-w-6xl mx-auto px-4 py-6">
      <Link to="/airlines" className="text-sm text-runway-500 hover:text-runway-700 dark:text-runway-400">
        ← {t('airlines.title')}
      </Link>

      <div className="mt-4 grid lg:grid-cols-[1.2fr_1fr] gap-6">
        {/* Left: identity + fleet + hubs */}
        <div>
          <div className="bg-white dark:bg-runway-900 border border-runway-200 dark:border-runway-700 rounded-2xl p-6">
            <div className="flex items-start gap-4">
              {a.logo || a.image ? (
                <div className="w-16 h-16 rounded-xl overflow-hidden bg-runway-100 dark:bg-runway-800 shrink-0">
                  <ImageWithFallback name={a.logo ?? a.image} alt={name} className="w-full h-full object-cover" width={200} />
                </div>
              ) : (
                <Avatar seed={a.id} name={name} className="w-16 h-16 rounded-xl shrink-0 text-2xl" />
              )}
              <div className="min-w-0 flex-1">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h1 className="text-2xl font-bold">{name}</h1>
                    {a.zh && lang !== 'zh' && <div className="text-sm text-runway-400">{a.zh}</div>}
                    {a.en && lang === 'zh' && <div className="text-sm text-runway-400">{a.en}</div>}
                    <div className="flex items-center gap-1.5 mt-2">
                      {a.iata && <span className="px-1.5 py-0.5 rounded bg-altitude-400/20 text-altitude-600 font-mono text-xs font-bold">{a.iata}</span>}
                      {a.icao && <span className="px-1.5 py-0.5 rounded bg-runway-200 dark:bg-runway-700 font-mono text-xs font-bold">{a.icao}</span>}
                      {alliance && (
                        <Link
                          to="/alliances"
                          className="px-1.5 py-0.5 rounded bg-runway-800 dark:bg-runway-700 text-white font-mono text-xs"
                          title={t('airlines.alliance')}
                        >
                          {displayName(alliance.en, alliance.zh ?? null, lang)}
                        </Link>
                      )}
                    </div>
                  </div>
                  <ActionButtons kind="airline" id={a.id} className="shrink-0" />
                </div>
              </div>
            </div>

            {a.desc && <p className="mt-4 text-sm leading-relaxed text-runway-700 dark:text-runway-300">{a.desc}</p>}

            {a.website && (
              <a
                href={a.website}
                target="_blank"
                rel="noreferrer"
                className="mt-4 inline-flex items-center gap-1.5 text-sm text-runway-600 dark:text-runway-300 hover:text-altitude-600"
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="w-4 h-4">
                  <circle cx="12" cy="12" r="9" />
                  <path d="M3 12h18M12 3a15 15 0 0 1 0 18M12 3a15 15 0 0 0 0 18" />
                </svg>
                {t('airlines.website')}
              </a>
            )}
          </div>

          {fleet.length > 0 && (
            <div className="mt-4 bg-white dark:bg-runway-900 border border-runway-200 dark:border-runway-700 rounded-2xl p-5">
              <h2 className="font-semibold text-sm mb-3">
                {t('airlines.fleet')} · {a.fleet.length}
              </h2>
              <div className="flex flex-wrap gap-2">
                {fleet.map((f) => (
                  <Link
                    key={f.id}
                    to={`/aircraft/${f.id}`}
                    className="px-2.5 py-1.5 rounded-lg bg-runway-50 dark:bg-runway-800 border border-runway-200 dark:border-runway-700 text-xs hover:border-altitude-500"
                  >
                    {f.name}
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* Live flights */}
          <div className="mt-4 bg-white dark:bg-runway-900 border border-runway-200 dark:border-runway-700 rounded-2xl p-5">
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-semibold text-sm">
                {t('live.currentFlights')}
                {myFlights.length > 0 && <span className="ml-2 text-xs text-runway-400">· {myFlights.length}</span>}
              </h2>
              <Link to="/live" className="text-xs text-altitude-600 hover:underline">
                {t('live.viewLiveMap')}
              </Link>
            </div>
            {liveLoading ? (
              <div className="text-sm text-runway-400 py-3">{t('common.loading')}</div>
            ) : !a.icao ? (
              <div className="text-sm text-runway-400 py-2">{t('live.noIcao')}</div>
            ) : myFlights.length === 0 ? (
              <div className="text-sm text-runway-400 py-2">{t('live.noFlights')}</div>
            ) : (
              <ul className="divide-y divide-runway-100 dark:divide-runway-800 text-sm max-h-72 overflow-y-auto nice-scroll">
                {myFlights.map((f) => (
                  <li key={f.icao24} className="py-2 flex items-center gap-3">
                    <span className="w-2.5 h-2.5 rounded-full shrink-0 border border-white" style={{ backgroundColor: colorForAltitude(f.baroAlt) }} />
                    <span className="font-mono font-semibold text-xs">{f.callsign}</span>
                    {f.typeCode && (
                      <span className="px-1.5 py-0.5 rounded bg-runway-100 dark:bg-runway-800 font-mono text-[11px] text-runway-600 dark:text-runway-300">
                        {f.typeCode}
                      </span>
                    )}
                    <span className="text-xs text-runway-500 dark:text-runway-400 flex-1 truncate">
                      {f.baroAlt != null && f.baroAlt > 0
                        ? Math.round(f.baroAlt).toLocaleString() + ' m'
                        : t('live.ground')}
                      {f.registration ? ' · ' + f.registration : ''}
                    </span>
                    <span className="text-xs text-runway-500 dark:text-runway-400 shrink-0">
                      {f.vel != null ? Math.round(f.vel * 3.6).toLocaleString() + ' km/h' : '—'}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        {/* Right: info panel */}
        <div>
          <div className="bg-white dark:bg-runway-900 border border-runway-200 dark:border-runway-700 rounded-2xl overflow-hidden">
            <h2 className="px-5 pt-4 font-semibold text-sm">{t('airlines.title')}</h2>
            <dl className="mt-2 divide-y divide-runway-100 dark:divide-runway-800 text-sm">
              {info.map((r) => (
                <div key={r.key} className="flex justify-between px-5 py-2.5">
                  <dt className="text-runway-500 dark:text-runway-400">{r.key}</dt>
                  <dd className="font-medium text-right">{r.value}</dd>
                </div>
              ))}
            </dl>
          </div>

          {a.hubs.length > 0 && (
            <div className="mt-3 bg-white dark:bg-runway-900 border border-runway-200 dark:border-runway-700 rounded-2xl p-5 text-sm">
              <h2 className="font-semibold mb-2">{t('airlines.hubs')}</h2>
              <div className="flex flex-wrap gap-2">
                {a.hubs.map((h) => (
                  <span key={h} className="px-2.5 py-1 rounded-lg bg-runway-100 dark:bg-runway-800">
                    {refLabel(h, lang) ?? h}
                  </span>
                ))}
              </div>
            </div>
          )}

          {a.fleet.length === 0 && (
            <div className="mt-3 bg-white dark:bg-runway-900 border border-runway-200 dark:border-runway-700 rounded-2xl p-5 text-sm text-runway-400">
              {t('airlines.noFleetData')}
            </div>
          )}

          <div className="mt-3 text-xs text-runway-400">
            <a href={`https://www.wikidata.org/wiki/${a.id}`} target="_blank" rel="noreferrer" className="underline">
              {t('detail.wikiLink')}
            </a>
          </div>
        </div>
      </div>
    </div>
  )
}