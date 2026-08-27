import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { airlineList } from '../data'
import { AirlineCard } from '../components/EntityCards'

const PAGE_SIZE = 48

export default function AirlineList() {
  const { t } = useTranslation()
  const [q, setQ] = useState('')
  const [onlyActive, setOnlyActive] = useState(false)
  const [shown, setShown] = useState(PAGE_SIZE)

  const filtered = useMemo(() => {
    const query = q.trim().toLowerCase()
    const qUpper = q.trim().toUpperCase()
    return airlineList.filter((a) => {
      if (onlyActive && !a.active) return false
      if (!query) return true
      if (qUpper && ((a.iata && a.iata === qUpper) || (a.icao && a.icao === qUpper))) return true
      return `${a.en} ${a.zh ?? ''} ${a.callsign ?? ''}`.toLowerCase().includes(query)
    })
  }, [q, onlyActive])

  const visible = filtered.slice(0, shown)

  return (
    <div className="max-w-7xl mx-auto px-4 py-6">
      <h1 className="text-2xl font-bold">{t('airlines.title')}</h1>
      <p className="text-sm text-runway-500 dark:text-runway-400 mt-1">
        {t('airlines.subtitle')} · {filtered.length.toLocaleString()}
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
        <label className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white dark:bg-runway-900 border border-runway-200 dark:border-runway-700 text-sm cursor-pointer">
          <input
            type="checkbox"
            checked={onlyActive}
            onChange={(e) => {
              setOnlyActive(e.target.checked)
              setShown(PAGE_SIZE)
            }}
            className="accent-altitude-500"
          />
          {t('airlines.active')}
        </label>
      </div>

      {visible.length === 0 ? (
        <div className="mt-16 text-center text-runway-400">{t('search.noResults')}</div>
      ) : (
        <>
          <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
            {visible.map((a) => (
              <AirlineCard key={a.id} airline={a} />
            ))}
          </div>
          {shown < filtered.length && (
            <div className="mt-8 text-center">
              <button
                onClick={() => setShown((s) => s + PAGE_SIZE)}
                className="px-6 py-2.5 rounded-xl border border-runway-300 dark:border-runway-700 text-sm hover:bg-runway-100 dark:hover:bg-runway-800 transition-colors"
              >
                {t('airlines.allAirlines')} · {filtered.length - shown}…
              </button>
            </div>
          )}
        </>
      )}
    </div>
  )
}
