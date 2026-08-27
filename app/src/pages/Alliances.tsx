import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { allianceList, allianceMembers, displayName } from '../data'
import { useUI } from '../store/ui'
import ImageWithFallback from '../components/ImageWithFallback'

export default function Alliances() {
  const { t } = useTranslation()
  const lang = useUI((s) => s.lang)

  return (
    <div className="max-w-5xl mx-auto px-4 py-6">
      <h1 className="text-2xl font-bold">{t('alliances.title')}</h1>
      <p className="text-sm text-runway-500 dark:text-runway-400 mt-1">{t('alliances.subtitle')}</p>

      <div className="mt-6 grid md:grid-cols-3 gap-4">
        {allianceList.map((all) => {
          const members = allianceMembers(all.id)
          const founded = all.founded ? all.founded.slice(1, 5) : null
          return (
            <div key={all.id} className="bg-white dark:bg-runway-900 border border-runway-200 dark:border-runway-700 rounded-2xl overflow-hidden">
              <div className="h-28 bg-runway-800 relative">
                {all.image ? (
                  <ImageWithFallback name={all.image} alt={all.en} className="w-full h-full object-cover opacity-50" width={600} />
                ) : (
                  <div className="w-full h-full opacity-20" />
                )}
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-16 h-16 bg-white dark:bg-runway-900 rounded-xl overflow-hidden shadow-lg">
                    <ImageWithFallback name={all.logo} alt={all.en} className="w-full h-full object-contain p-1" width={120} />
                  </div>
                </div>
              </div>
              <div className="p-4">
                <h2 className="font-bold">{displayName(all.en, all.zh ?? null, lang)}</h2>
                <div className="text-xs text-runway-500 dark:text-runway-400 mt-1">
                  {members.length} {t('alliances.members')}
                  {founded ? ' · ' + t('alliances.founded') + ' ' + founded : ''}
                </div>
                {all.website && (
                  <a href={all.website} target="_blank" rel="noreferrer" className="inline-block mt-2 text-xs underline text-runway-500 hover:text-altitude-600">
                    {t('alliances.website')}
                  </a>
                )}
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {members.slice(0, 14).map((m) => (
                    <Link
                      key={m.id}
                      to={'/airlines/' + m.id}
                      className="px-2 py-1 rounded bg-runway-50 dark:bg-runway-800 border border-runway-200 dark:border-runway-700 text-[11px] hover:border-altitude-500"
                    >
                      {displayName(m.en, m.zh, lang)}
                    </Link>
                  ))}
                  {members.length > 14 && (
                    <span className="px-2 py-1 text-[11px] text-runway-400">+{members.length - 14}</span>
                  )}
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
