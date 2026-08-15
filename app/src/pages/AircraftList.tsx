import { useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { aircraftList, refLabel } from '../data'
import { useUI } from '../store/ui'
import { AircraftCard } from '../components/EntityCards'

const PAGE_SIZE = 36

export default function AircraftList() {
  const { t } = useTranslation()
  const lang = useUI((s) => s.lang)
  const [params, setParams] = useSearchParams()
  const [q, setQ] = useState('')
  const [mfr, setMfr] = useState<string>(params.get('mfr') ?? 'all')
  const [shown, setShown] = useState(PAGE_SIZE)

  const manufacturers = useMemo(() => {
    const counts = new Map<string, number>()
    for (const a of aircraftList) {
      if (a.manufacturer) counts.set(a.manufacturer, (counts.get(a.manufacturer) ?? 0) + 1)
    }
    return [...counts.entries()]
      .map(([id, count]) => ({ id, name: refLabel(id, lang) ?? id, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 60)
  }, [lang])

  const filtered = useMemo(() => {
    const query = q.trim().toLowerCase()
    let list = aircraftList
    if (mfr !== 'all') list = list.filter((a) => a.manufacturer === mfr)
    if (query) {
      list = list.filter((a) =>
        `${a.en} ${a.zh ?? ''} ${a.desc ?? ''}`.toLowerCase().includes(query)
      )
    }
    return list
  }, [q, mfr])

  const visible = filtered.slice(0, shown)

  return (
    <div className="max-w-7xl mx-auto px-4 py-6">
      <h1 className="text-2xl font-bold">{t('aircraft.title')}</h1>
      <p className="text-sm text-runway-500 dark:text-runway-400 mt-1">
        {t('aircraft.subtitle')} · {filtered.length.toLocaleString()}
      </p>

      <div className="mt-5 flex flex-col md:flex-row gap-3">
        <input
          value={q}
          onChange={(e) => {
            setQ(e.target.value)
            setShown(PAGE_SIZE)
          }}
          placeholder={t('search.placeholder')}
          className="flex-1 px-4 py-2 rounded-xl bg-white dark:bg-runway-900 border border-runway-200 dark:border-runway-700 outline-none focus:ring-2 focus:ring-altitude-500/40"
        />
        <select
          value={mfr}
          onChange={(e) => {
            setMfr(e.target.value)
            setShown(PAGE_SIZE)
            if (e.target.value === 'all') setParams({})
            else setParams({ mfr: e.target.value })
          }}
          className="px-4 py-2 rounded-xl bg-white dark:bg-runway-900 border border-runway-200 dark:border-runway-700 outline-none text-sm max-w-full md:max-w-xs"
        >
          <option value="all">{t('manufacturers.title')}（全部）</option>
          {manufacturers.map((m) => (
            <option key={m.id} value={m.id}>
              {m.name} ({m.count})
            </option>
          ))}
        </select>
      </div>

      {visible.length === 0 ? (
        <div className="mt-16 text-center text-runway-400">{t('search.noResults')}</div>
      ) : (
        <>
          <div className="mt-6 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-3">
            {visible.map((a) => (
              <AircraftCard key={a.id} aircraft={a} />
            ))}
          </div>
          {shown < filtered.length && (
            <div className="mt-8 text-center">
              <button
                onClick={() => setShown((s) => s + PAGE_SIZE)}
                className="px-6 py-2.5 rounded-xl border border-runway-300 dark:border-runway-700 text-sm hover:bg-runway-100 dark:hover:bg-runway-800 transition-colors"
              >
                {t('aircraft.allAircraft')} · {filtered.length - shown}…
              </button>
            </div>
          )}
        </>
      )}
    </div>
  )
}
