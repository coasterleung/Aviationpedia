import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { manufacturerList, refLabel } from '../data'
import { useUI } from '../store/ui'

type SortMode = 'count' | 'name'

export default function ManufacturerList() {
  const { t } = useTranslation()
  const lang = useUI((s) => s.lang)
  const [q, setQ] = useState('')
  const [country, setCountry] = useState('all')
  const [sort, setSort] = useState<SortMode>('count')

  // Build country options with counts (localized, most manufacturers first)
  const countries = useMemo(() => {
    const counts = new Map<string, number>()
    for (const m of manufacturerList) {
      if (m.country) counts.set(m.country, (counts.get(m.country) ?? 0) + 1)
    }
    return [...counts.entries()]
      .map(([id, count]) => ({ id, name: refLabel(id, lang) ?? id, count }))
      .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name))
  }, [lang])

  const filtered = useMemo(() => {
    const query = q.trim().toLowerCase()
    let list = manufacturerList
    if (country !== 'all') list = list.filter((m) => m.country === country)
    if (query) {
      list = list.filter((m) =>
        `${m.en} ${m.zh ?? ''}`.toLowerCase().includes(query)
      )
    }
    if (sort === 'count') {
      list = [...list].sort((a, b) => b.aircraftCount - a.aircraftCount || a.en.localeCompare(b.en))
    } else {
      list = [...list].sort((a, b) => a.en.localeCompare(b.en) || b.aircraftCount - a.aircraftCount)
    }
    return list
  }, [q, country, sort])

  return (
    <div className="max-w-5xl mx-auto px-4 py-6">
      <h1 className="text-2xl font-bold">{t('manufacturers.title')}</h1>
      <p className="text-sm text-runway-500 dark:text-runway-400 mt-1">
        {t('manufacturers.subtitle')} · {filtered.length.toLocaleString()} / {manufacturerList.length.toLocaleString()}
      </p>

      {/* Filters */}
      <div className="mt-5 flex flex-col md:flex-row gap-2.5">
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder={t('manufacturers.searchPlaceholder')}
          className="flex-1 px-4 py-2 rounded-xl bg-white dark:bg-runway-900 border border-runway-200 dark:border-runway-700 outline-none focus:ring-2 focus:ring-altitude-500/40 text-sm"
        />
        <select
          value={country}
          onChange={(e) => setCountry(e.target.value)}
          className="px-3 py-2 rounded-xl bg-white dark:bg-runway-900 border border-runway-200 dark:border-runway-700 outline-none text-sm max-w-full md:max-w-[220px]"
        >
          <option value="all">{t('manufacturers.allCountries')} ({manufacturerList.length})</option>
          {countries.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name} ({c.count})
            </option>
          ))}
        </select>
        <div className="flex rounded-xl border border-runway-200 dark:border-runway-700 overflow-hidden text-sm shrink-0">
          <button
            onClick={() => setSort('count')}
            className={`px-3 py-2 transition-colors ${sort === 'count' ? 'bg-runway-800 text-white' : 'bg-white dark:bg-runway-900 text-runway-500'}`}
          >
            {t('manufacturers.sortByCount')}
          </button>
          <button
            onClick={() => setSort('name')}
            className={`px-3 py-2 transition-colors ${sort === 'name' ? 'bg-runway-800 text-white' : 'bg-white dark:bg-runway-900 text-runway-500'}`}
          >
            {t('manufacturers.sortByName')}
          </button>
        </div>
      </div>

      {/* List */}
      {filtered.length === 0 ? (
        <div className="mt-16 text-center text-runway-400 text-sm">{t('search.noResults')}</div>
      ) : (
        <div className="mt-5 grid sm:grid-cols-2 gap-2">
          {filtered.map((m) => (
            <Link
              key={m.id}
              to={'/aircraft?mfr=' + m.id}
              className="flex items-center justify-between gap-3 px-4 py-2.5 bg-white dark:bg-runway-900 border border-runway-200 dark:border-runway-700 rounded-xl hover:border-altitude-500 transition-colors"
            >
              <span className="min-w-0">
                <span className="font-medium text-sm block truncate">{refLabel(m.id, lang) ?? m.en}</span>
                <span className="text-xs text-runway-400 block truncate">
                  {m.country ? refLabel(m.country, lang) : ''}
                </span>
              </span>
              <span className="text-xs text-runway-400 shrink-0 bg-runway-100 dark:bg-runway-800 px-2 py-0.5 rounded-full">
                {m.aircraftCount} {t('manufacturers.aircraftCount')}
              </span>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
