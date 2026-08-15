import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { manufacturerList, refLabel } from '../data'
import { useUI } from '../store/ui'

export default function ManufacturerList() {
  const { t } = useTranslation()
  const lang = useUI((s) => s.lang)
  const manufacturers = [...manufacturerList].sort((a, b) => b.aircraftCount - a.aircraftCount)

  return (
    <div className="max-w-5xl mx-auto px-4 py-6">
      <h1 className="text-2xl font-bold">{t('manufacturers.title')}</h1>
      <p className="text-sm text-runway-500 dark:text-runway-400 mt-1">
        {t('manufacturers.subtitle')} · {manufacturers.length.toLocaleString()}
      </p>
      <div className="mt-6 grid sm:grid-cols-2 gap-2">
        {manufacturers.map((m) => (
          <Link
            key={m.id}
            to={'/aircraft?mfr=' + m.id}
            className="flex items-center justify-between px-4 py-2.5 bg-white dark:bg-runway-900 border border-runway-200 dark:border-runway-700 rounded-xl hover:border-altitude-500 transition-colors"
          >
            <span className="font-medium text-sm">{refLabel(m.id, lang) ?? m.en}</span>
            <span className="text-xs text-runway-400 shrink-0 ml-3">{m.aircraftCount} {t('manufacturers.aircraftCount')}</span>
          </Link>
        ))}
      </div>
    </div>
  )
}
