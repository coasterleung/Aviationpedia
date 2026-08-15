import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useUI, compareKey } from '../store/ui'
import { getAircraft, getAirline, displayName, refLabel } from '../data'
import ImageWithFallback from '../components/ImageWithFallback'

interface RowDef {
  key: string
  get: (id: string) => string | null
}

const AIRCRAFT_ROWS: RowDef[] = [
  { key: 'aircraft.manufacturer', get: (id) => { const a = getAircraft(id); return a?.manufacturer ? refLabel(a.manufacturer, 'en') : null } },
  { key: 'aircraft.firstFlight', get: (id) => { const d = getAircraft(id)?.firstFlight; return d ? d.slice(0, 10) : null } },
  { key: 'aircraft.length', get: (id) => { const v = getAircraft(id)?.lengthM; return v != null ? v.toFixed(2) + ' m' : null } },
  { key: 'aircraft.wingspan', get: (id) => { const v = getAircraft(id)?.wingspanM; return v != null ? v.toFixed(2) + ' m' : null } },
  { key: 'aircraft.height', get: (id) => { const v = getAircraft(id)?.heightM; return v != null ? v.toFixed(2) + ' m' : null } },
  { key: 'aircraft.range', get: (id) => { const v = getAircraft(id)?.rangeKm; return v != null ? v.toLocaleString() + ' km' : null } },
  { key: 'aircraft.speed', get: (id) => { const v = getAircraft(id)?.speedKmh; return v != null ? v.toLocaleString() + ' km/h' : null } },
  { key: 'aircraft.capacity', get: (id) => { const v = getAircraft(id)?.capacity; return v != null ? v.toLocaleString() : null } },
  { key: 'aircraft.produced', get: (id) => { const v = getAircraft(id)?.produced; return v != null ? v.toLocaleString() : null } },
  { key: 'aircraft.altitude', get: (id) => { const v = getAircraft(id)?.altitudeM; return v != null ? Math.round(v).toLocaleString() + ' m' : null } },
  { key: 'aircraft.wingArea', get: (id) => { const v = getAircraft(id)?.wingAreaM2; return v != null ? v.toLocaleString() + ' m²' : null } },
]

const AIRLINE_ROWS: RowDef[] = [
  { key: 'airlines.iata', get: (id) => getAirline(id)?.iata ?? null },
  { key: 'airlines.icao', get: (id) => getAirline(id)?.icao ?? null },
  { key: 'airlines.callsign', get: (id) => getAirline(id)?.callsign ?? null },
  { key: 'airlines.country', get: (id) => { const c = getAirline(id)?.country; return c ? refLabel(c, 'en') : null } },
  { key: 'airlines.founded', get: (id) => { const d = getAirline(id)?.founded; return d ? d.slice(0, 10) : null } },
  { key: 'airlines.status', get: (id) => (getAirline(id)?.active ? '●' : '○') },
]

export default function Compare() {
  const { t } = useTranslation()
  const lang = useUI((s) => s.lang)
  const compare = useUI((s) => s.compare)
  const removeCompare = useUI((s) => s.removeCompare)
  const clearCompare = useUI((s) => s.clearCompare)

  const kinds = [...new Set(compare.map((c) => c.kind))]
  const mixed = kinds.length > 1
  const rows = mixed ? [] : kinds[0] === 'aircraft' ? AIRCRAFT_ROWS : kinds[0] === 'airline' ? AIRLINE_ROWS : []

  if (compare.length === 0) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-24 text-center">
        <div className="text-5xl mb-4">⚖️</div>
        <h1 className="text-xl font-bold">{t('compare.title')}</h1>
        <p className="text-runway-400 mt-2 text-sm">{t('compare.empty')}</p>
      </div>
    )
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">{t('compare.title')}</h1>
          <p className="text-sm text-runway-500 dark:text-runway-400 mt-1">
            {mixed ? t('compare.addPrompt') : t('compare.subtitle')}
          </p>
        </div>
        <button onClick={clearCompare} className="text-sm text-runway-400 hover:text-red-500">
          {t('compare.clearAll')}
        </button>
      </div>

      {mixed ? (
        <div className="mt-10 bg-white dark:bg-runway-900 border border-runway-200 dark:border-runway-700 rounded-2xl p-6 text-center text-runway-400 text-sm">
          {t('compare.addPrompt')}
        </div>
      ) : (
        <div className="mt-6 bg-white dark:bg-runway-900 border border-runway-200 dark:border-runway-700 rounded-2xl overflow-x-auto nice-scroll">
          <table className="w-full text-sm min-w-[520px]">
            <thead>
              <tr className="border-b border-runway-200 dark:border-runway-700">
                <th className="text-left px-4 py-3 text-runway-400 font-normal text-xs w-36">{t('compare.field')}</th>
                {compare.map((c) => {
                  const obj = c.kind === 'aircraft' ? getAircraft(c.id) : getAirline(c.id)
                  const name = obj ? displayName(obj.en, obj.zh, lang) : c.id
                  const img = c.kind === 'aircraft' && obj && 'images' in obj ? (obj as { images: string[] }).images?.[0] : null
                  return (
                    <th key={compareKey(c)} className="text-left px-4 py-3 align-top">
                      <div className="flex items-center gap-2">
                        {img && (
                          <div className="w-10 h-8 rounded overflow-hidden shrink-0">
                            <ImageWithFallback name={img} alt="" className="w-full h-full object-cover" width={100} />
                          </div>
                        )}
                        <div>
                          <div className="font-semibold">{name}</div>
                          <button onClick={() => removeCompare(compareKey(c))} className="text-[11px] text-runway-400 hover:text-red-500 mt-0.5">
                            {t('compare.remove')}
                          </button>
                        </div>
                      </div>
                    </th>
                  )
                })}
              </tr>
            </thead>
            <tbody className="divide-y divide-runway-100 dark:divide-runway-800">
              {rows.map((r) => (
                <tr key={r.key}>
                  <td className="px-4 py-2.5 text-runway-500 dark:text-runway-400 text-xs">{t(r.key)}</td>
                  {compare.map((c) => (
                    <td key={compareKey(c)} className="px-4 py-2.5 font-medium">{r.get(c.id) ?? t('aircraft.notAvailable')}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div className="mt-4 text-xs text-runway-400">
        {t('compare.addPrompt')} ·{' '}
        <Link to="/aircraft" className="underline">{t('nav.aircraft')}</Link> ·{' '}
        <Link to="/airlines" className="underline">{t('nav.airlines')}</Link>
      </div>
    </div>
  )
}
