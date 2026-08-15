import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import type { Aircraft, Airline } from '../data/types'
import { refLabel, displayName } from '../data'
import { useUI } from '../store/ui'
import ImageWithFallback from './ImageWithFallback'
import Avatar from './Avatar'

export function AircraftCard({ aircraft }: { aircraft: Aircraft }) {
  const { t } = useTranslation()
  const lang = useUI((s) => s.lang)
  const mfr = aircraft.manufacturer ? refLabel(aircraft.manufacturer, lang) : null
  const img = aircraft.images[0]

  return (
    <Link
      to={`/aircraft/${aircraft.id}`}
      className="block bg-white dark:bg-runway-900 border border-runway-200 dark:border-runway-700 rounded-xl overflow-hidden lift"
    >
      <div className="aspect-[16/9] overflow-hidden bg-runway-100 dark:bg-runway-800">
        <ImageWithFallback name={img} alt={displayName(aircraft.en, aircraft.zh, lang)} className="w-full h-full object-cover" width={500} />
      </div>
      <div className="p-3">
        <div className="font-semibold text-sm truncate">{displayName(aircraft.en, aircraft.zh, lang)}</div>
        <div className="text-xs text-runway-500 dark:text-runway-400 mt-0.5 flex items-center justify-between">
          <span className="truncate">{mfr ?? t('aircraft.notAvailable')}</span>
          {aircraft.rangeKm != null && <span className="shrink-0">{Math.round(aircraft.rangeKm).toLocaleString()} km</span>}
        </div>
      </div>
    </Link>
  )
}

export function AirlineCard({ airline }: { airline: Airline }) {
  const lang = useUI((s) => s.lang)
  const country = airline.country ? refLabel(airline.country, lang) : null

  return (
    <Link
      to={`/airlines/${airline.id}`}
      className="block bg-white dark:bg-runway-900 border border-runway-200 dark:border-runway-700 rounded-xl overflow-hidden lift"
    >
      <div className="p-3 flex items-center gap-3">
        {airline.logo || airline.image ? (
          <div className="w-12 h-12 rounded-lg overflow-hidden bg-runway-100 dark:bg-runway-800 shrink-0">
            <ImageWithFallback name={airline.logo ?? airline.image} alt={displayName(airline.en, airline.zh, lang)} className="w-full h-full object-cover" width={120} />
          </div>
        ) : (
          <Avatar seed={airline.id} name={displayName(airline.en, airline.zh, lang)} className="w-12 h-12 rounded-lg shrink-0 text-base" />
        )}
        <div className="min-w-0">
          <div className="font-semibold text-sm truncate">
            {displayName(airline.en, airline.zh, lang)}
          </div>
          <div className="text-xs text-runway-500 dark:text-runway-400 flex items-center gap-1.5 mt-0.5">
            {airline.iata && <span className="px-1.5 rounded bg-altitude-400/20 text-altitude-600 font-mono">{airline.iata}</span>}
            {airline.icao && <span className="px-1.5 rounded bg-runway-200 dark:bg-runway-700 font-mono">{airline.icao}</span>}
            <span className="truncate">{country ?? ''}</span>
          </div>
        </div>
      </div>
    </Link>
  )
}
