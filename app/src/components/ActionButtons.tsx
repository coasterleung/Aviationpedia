import { useTranslation } from 'react-i18next'
import type { EntityKind } from '../data/types'
import { useUI } from '../store/ui'
import { useFavorites } from '../hooks/useFavorites'

interface Props {
  kind: EntityKind
  id: string
  className?: string
}

/** Star (favorite) + Compare buttons shown on detail pages. */
export function ActionButtons({ kind, id, className = '' }: Props) {
  const { t } = useTranslation()
  const { isFav, toggle } = useFavorites()
  const toggleCompare = useUI((s) => s.toggleCompare)
  const inCompare = useUI((s) => s.compare.some((c) => c.kind === kind && c.id === id))
  const fav = isFav(kind, id)

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <button
        onClick={() => toggle(kind, id)}
        aria-label={t('detail.addFavorite')}
        title={fav ? t('detail.removeFavorite') : t('detail.addFavorite')}
        className={`w-9 h-9 rounded-xl flex items-center justify-center border transition-colors ${
          fav
            ? 'bg-altitude-500 border-altitude-500 text-white'
            : 'border-runway-300 dark:border-runway-700 text-runway-400 hover:text-altitude-500 hover:border-altitude-500'
        }`}
      >
        <svg viewBox="0 0 24 24" fill={fav ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="1.8" className="w-4.5 h-4.5">
          <path d="M12 2.5l2.9 6.2 6.8.8-5 4.6 1.3 6.7L12 17.5l-6 3.3 1.3-6.7-5-4.6 6.8-.8L12 2.5z" strokeLinejoin="round" />
        </svg>
      </button>
      <button
        onClick={() => toggleCompare({ kind, id })}
        title={t('detail.addCompare')}
        className={`px-3 h-9 rounded-xl border text-sm flex items-center gap-1.5 transition-colors ${
          inCompare
            ? 'bg-runway-800 border-runway-800 text-white'
            : 'border-runway-300 dark:border-runway-700 text-runway-600 dark:text-runway-300 hover:border-runway-500'
        }`}
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="w-4 h-4">
          <path d="M8 3v18M16 3v18M3 8h18M3 16h18" strokeLinecap="round" />
        </svg>
        {t('detail.addCompare')}
      </button>
    </div>
  )
}
