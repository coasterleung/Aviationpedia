import { useTranslation } from 'react-i18next'
import { getAircraft, getAirline } from '../data'
import { useFavorites } from '../hooks/useFavorites'
import { AircraftCard, AirlineCard } from '../components/EntityCards'

export default function Favorites() {
  const { t } = useTranslation()
  const { favorites } = useFavorites()

  const aircraft = favorites.filter((f) => f.kind === 'aircraft').map((f) => getAircraft(f.id)).filter((x) => !!x)
  const airlines = favorites.filter((f) => f.kind === 'airline').map((f) => getAirline(f.id)).filter((x) => !!x)

  if (favorites.length === 0) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-24 text-center">
        <div className="text-5xl mb-4">⭐</div>
        <h1 className="text-xl font-bold">{t('favorites.title')}</h1>
        <p className="text-runway-400 mt-2 text-sm">{t('favorites.empty')}</p>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-6">
      <h1 className="text-2xl font-bold">{t('favorites.title')}</h1>
      <p className="text-sm text-runway-500 dark:text-runway-400 mt-1">{t('favorites.subtitle')}</p>

      {aircraft.length > 0 && (
        <>
          <h2 className="mt-6 mb-3 text-sm font-semibold text-runway-500 dark:text-runway-400">{t('nav.aircraft')}</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
            {aircraft.map((a) => <AircraftCard key={a!.id} aircraft={a!} />)}
          </div>
        </>
      )}
      {airlines.length > 0 && (
        <>
          <h2 className="mt-6 mb-3 text-sm font-semibold text-runway-500 dark:text-runway-400">{t('nav.airlines')}</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {airlines.map((a) => <AirlineCard key={a!.id} airline={a!} />)}
          </div>
        </>
      )}
    </div>
  )
}
