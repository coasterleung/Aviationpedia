import { useMemo } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { getAircraft, refLabel, displayName, aircraftName, airlineName } from '../data'
import { useUI } from '../store/ui'
import ImageWithFallback from '../components/ImageWithFallback'
import { ActionButtons } from '../components/ActionButtons'
import { notFound } from './NotFound'

function fmtDate(d: string | null): string | null {
  if (!d) return null
  return d.slice(0, 10)
}

export default function AircraftDetail() {
  const { id } = useParams<{ id: string }>()
  const { t } = useTranslation()
  const lang = useUI((s) => s.lang)
  const a = id ? getAircraft(id) : undefined

  const specs = useMemo(() => {
    if (!a) return []
    const rows: { key: string; value: string | null }[] = [
      { key: t('aircraft.manufacturer'), value: a.manufacturer ? refLabel(a.manufacturer, lang) : null },
      { key: t('aircraft.firstFlight'), value: fmtDate(a.firstFlight) },
      { key: t('aircraft.serviceEntry'), value: fmtDate(a.serviceEntry) },
      { key: t('aircraft.length'), value: a.lengthM != null ? `${a.lengthM.toFixed(2)} m` : null },
      { key: t('aircraft.wingspan'), value: a.wingspanM != null ? `${a.wingspanM.toFixed(2)} m` : null },
      { key: t('aircraft.height'), value: a.heightM != null ? `${a.heightM.toFixed(2)} m` : null },
      { key: t('aircraft.width'), value: a.widthM != null ? `${a.widthM.toFixed(2)} m` : null },
      { key: t('aircraft.range'), value: a.rangeKm != null ? `${a.rangeKm.toLocaleString()} km` : null },
      { key: t('aircraft.speed'), value: a.speedKmh != null ? `${a.speedKmh.toLocaleString()} km/h` : null },
      { key: t('aircraft.wingArea'), value: a.wingAreaM2 != null ? `${a.wingAreaM2.toLocaleString()} m²` : null },
      { key: t('aircraft.capacity'), value: a.capacity != null ? a.capacity.toLocaleString() : null },
      { key: t('aircraft.produced'), value: a.produced != null ? a.produced.toLocaleString() : null },
      { key: t('aircraft.altitude'), value: a.altitudeM != null ? `${Math.round(a.altitudeM).toLocaleString()} m` : null },
      { key: t('aircraft.mass'), value: a.massKg != null ? `${(a.massKg / 1000).toLocaleString(undefined, { maximumFractionDigits: 1 })} t` : null },
    ]
    return rows.filter((r) => r.value != null)
  }, [a, t, lang])

  if (!a) return notFound(t('aircraft.title'))

  const name = displayName(a.en, a.zh, lang)
  const family = a.family ? getAircraft(a.family) : undefined
  const variants = a.variants.map((vid) => ({ id: vid, name: aircraftName(vid, lang) }))
  const operators = a.operators.slice(0, 24).map((oid) => ({ id: oid, name: airlineName(oid, lang) }))
  const engines = a.poweredBy.map((eid) => refLabel(eid, lang)).filter(Boolean) as string[]
  const derivatives = a.basedOn.map((bid) => ({ id: bid, name: aircraftName(bid, lang) }))

  return (
    <div className="max-w-6xl mx-auto px-4 py-6">
      <Link to="/aircraft" className="text-sm text-runway-500 hover:text-runway-700 dark:text-runway-400">
        ← {t('aircraft.title')}
      </Link>

      <div className="mt-3 grid lg:grid-cols-[1.2fr_1fr] gap-6">
        {/* Left: image + overview */}
        <div>
          <div className="rounded-2xl overflow-hidden border border-runway-200 dark:border-runway-700 bg-white dark:bg-runway-900">
            <div className="aspect-[16/10]">
              <ImageWithFallback name={a.images[0]} alt={name} className="w-full h-full object-cover" width={1000} />
            </div>
            {a.images.length > 1 && (
              <div className="grid grid-cols-4 gap-1 p-1">
                {a.images.slice(1, 5).map((img, i) => (
                  <div key={i} className="aspect-[16/10] rounded overflow-hidden">
                    <ImageWithFallback name={img} alt={`${name} ${i + 2}`} className="w-full h-full object-cover" width={300} />
                  </div>
                ))}
              </div>
            )}
          </div>

          {a.desc && (
            <div className="mt-4 bg-white dark:bg-runway-900 border border-runway-200 dark:border-runway-700 rounded-2xl p-5">
              <h2 className="font-semibold mb-2">{t('aircraft.overview')}</h2>
              <p className="text-sm leading-relaxed text-runway-700 dark:text-runway-300">{a.desc}</p>
            </div>
          )}
        </div>

        {/* Right: info */}
        <div>
          <div className="flex items-start justify-between gap-3">
            <div>
              <h1 className="text-2xl font-bold">{name}</h1>
              {a.zh && lang !== 'zh' && <div className="text-sm text-runway-400">{a.zh}</div>}
              {a.en && lang === 'zh' && <div className="text-sm text-runway-400">{a.en}</div>}
            </div>
            <ActionButtons kind="aircraft" id={a.id} className="shrink-0" />
          </div>

          {family && (
            <Link
              to={`/aircraft/${family.id}`}
              className="mt-3 inline-block text-xs px-3 py-1.5 rounded-lg bg-runway-100 dark:bg-runway-800 text-runway-600 dark:text-runway-300 hover:bg-runway-200"
            >
              {t('aircraft.familyName')}: {displayName(family.en, family.zh, lang)}
            </Link>
          )}

          <div className="mt-4 bg-white dark:bg-runway-900 border border-runway-200 dark:border-runway-700 rounded-2xl overflow-hidden">
            <h2 className="px-5 pt-4 font-semibold text-sm">{t('aircraft.specs')}</h2>
            <dl className="mt-2 divide-y divide-runway-100 dark:divide-runway-800 text-sm">
              {specs.map((s) => (
                <div key={s.key} className="flex justify-between px-5 py-2.5">
                  <dt className="text-runway-500 dark:text-runway-400">{s.key}</dt>
                  <dd className="font-medium text-right">{s.value}</dd>
                </div>
              ))}
            </dl>
          </div>

          {engines.length > 0 && (
            <div className="mt-3 bg-white dark:bg-runway-900 border border-runway-200 dark:border-runway-700 rounded-2xl p-5 text-sm">
              <h2 className="font-semibold mb-2">{t('aircraft.poweredBy')}</h2>
              <div className="flex flex-wrap gap-2">
                {engines.map((e) => (
                  <span key={e} className="px-2.5 py-1 rounded-lg bg-runway-100 dark:bg-runway-800">{e}</span>
                ))}
              </div>
            </div>
          )}

          <div className="mt-3 text-xs text-runway-400">
            <a href={`https://www.wikidata.org/wiki/${a.id}`} target="_blank" rel="noreferrer" className="underline">
              {t('detail.wikiLink')}
            </a>
          </div>
        </div>
      </div>

      {/* Variants + operators */}
      <div className="mt-6 grid md:grid-cols-2 gap-4">
        {variants.length > 0 && (
          <div className="bg-white dark:bg-runway-900 border border-runway-200 dark:border-runway-700 rounded-2xl p-5">
            <h2 className="font-semibold text-sm mb-3">{t('aircraft.variants')} · {variants.length}</h2>
            <div className="flex flex-wrap gap-2">
              {variants.map((v) => (
                <Link
                  key={v.id}
                  to={`/aircraft/${v.id}`}
                  className="px-2.5 py-1.5 rounded-lg bg-runway-50 dark:bg-runway-800 border border-runway-200 dark:border-runway-700 text-xs hover:border-altitude-500"
                >
                  {v.name}
                </Link>
              ))}
            </div>
          </div>
        )}
        {derivatives.length > 0 && (
          <div className="bg-white dark:bg-runway-900 border border-runway-200 dark:border-runway-700 rounded-2xl p-5">
            <h2 className="font-semibold text-sm mb-3">{t('aircraft.derivative')}</h2>
            <div className="flex flex-wrap gap-2">
              {derivatives.map((d) => (
                <Link
                  key={d.id}
                  to={`/aircraft/${d.id}`}
                  className="px-2.5 py-1.5 rounded-lg bg-runway-50 dark:bg-runway-800 border border-runway-200 dark:border-runway-700 text-xs hover:border-altitude-500"
                >
                  {d.name}
                </Link>
              ))}
            </div>
          </div>
        )}
        {operators.length > 0 && (
          <div className="bg-white dark:bg-runway-900 border border-runway-200 dark:border-runway-700 rounded-2xl p-5">
            <h2 className="font-semibold text-sm mb-3">
              {t('aircraft.operators')} · {a.operators.length}
            </h2>
            <div className="flex flex-wrap gap-2">
              {operators.map((o) => (
                <Link
                  key={o.id}
                  to={`/airlines/${o.id}`}
                  className="px-2.5 py-1.5 rounded-lg bg-runway-50 dark:bg-runway-800 border border-runway-200 dark:border-runway-700 text-xs hover:border-altitude-500"
                >
                  {o.name}
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
