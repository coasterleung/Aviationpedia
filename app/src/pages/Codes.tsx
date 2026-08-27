import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { aircraftCodeList } from '../data'

export default function Codes() {
  const { t } = useTranslation()
  const [q, setQ] = useState('')

  const filtered = useMemo(() => {
    const query = q.trim().toUpperCase()
    if (!query) return aircraftCodeList
    return aircraftCodeList.filter(
      (c) => c.name.toUpperCase().includes(query) || c.iata.includes(query) || c.icao.includes(query)
    )
  }, [q])

  return (
    <div className="max-w-4xl mx-auto px-4 py-6">
      <h1 className="text-2xl font-bold">{t('codes.title')}</h1>
      <p className="text-sm text-runway-500 dark:text-runway-400 mt-1">
        {t('codes.subtitle')} · {aircraftCodeList.length} {t('codes.count')}
      </p>

      <input
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder={t('codes.searchPlaceholder')}
        className="mt-5 w-full px-4 py-2 rounded-xl bg-white dark:bg-runway-900 border border-runway-200 dark:border-runway-700 outline-none focus:ring-2 focus:ring-altitude-500/40"
      />

      <div className="mt-6 bg-white dark:bg-runway-900 border border-runway-200 dark:border-runway-700 rounded-2xl overflow-hidden">
        <div className="overflow-x-auto nice-scroll">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-runway-200 dark:border-runway-700 text-left text-xs text-runway-400">
                <th className="px-4 py-2.5 font-normal">{t('codes.icao')}</th>
                <th className="px-4 py-2.5 font-normal">{t('codes.iata')}</th>
                <th className="px-4 py-2.5 font-normal">{t('codes.name')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-runway-100 dark:divide-runway-800">
              {filtered.map((c) => (
                <tr key={c.icao + c.iata} className="hover:bg-runway-50 dark:hover:bg-runway-800">
                  <td className="px-4 py-2 font-mono font-semibold">{c.icao}</td>
                  <td className="px-4 py-2 font-mono">{c.iata}</td>
                  <td className="px-4 py-2">{c.name}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
