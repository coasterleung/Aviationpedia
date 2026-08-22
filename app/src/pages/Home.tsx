import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { encyclopaedia, aircraftList } from '../data'
import { AircraftCard } from '../components/EntityCards'

const FEATURED = ['Q6387', 'Q5830', 'Q6475', 'Q6425', 'Q179', 'Q6428']

export default function Home() {
  const { t } = useTranslation()
  const m = encyclopaedia.meta

  const featured = FEATURED.map((id) => aircraftList.find((a) => a.id === id)).filter((a) => !!a).slice(0, 6)

  const stats = [
    { label: t('home.statsAircraft'), value: m.aircraftCount },
    { label: t('home.statsAirlines'), value: m.airlineCount },
    { label: t('home.statsManufacturers'), value: m.manufacturerCount },
    { label: t('home.statsAlliances'), value: m.allianceCount },
  ]

  return (
    <div>
      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-runway-900 via-runway-800 to-runway-950" />
        <div className="absolute inset-0 opacity-[0.07]" style={{ backgroundImage: 'radial-gradient(circle at 20% 30%, white 1px, transparent 1px)', backgroundSize: '28px 28px' }} />
        <div className="relative max-w-5xl mx-auto px-4 py-16 md:py-24 text-center text-white">
          <h1 className="text-3xl md:text-5xl font-bold tracking-tight">{t('home.heroTitle')}</h1>
          <p className="mt-4 text-runway-200 text-base md:text-lg max-w-2xl mx-auto">{t('home.heroSubtitle')}</p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Link to="/aircraft" className="px-6 py-3 rounded-xl bg-altitude-500 hover:bg-altitude-600 text-white font-semibold text-sm transition-colors">
              {t('home.browseAircraft')}
            </Link>
            <Link to="/airlines" className="px-6 py-3 rounded-xl bg-white/10 hover:bg-white/20 text-white font-semibold text-sm transition-colors">
              {t('home.browseAirlines')}
            </Link>
          </div>
          <div className="mt-12 grid grid-cols-2 md:grid-cols-4 gap-4 max-w-2xl mx-auto">
            {stats.map((s) => (
              <div key={s.label} className="bg-white/5 rounded-xl p-4 backdrop-blur">
                <div className="text-2xl md:text-3xl font-bold text-altitude-400">{s.value.toLocaleString()}</div>
                <div className="text-xs text-runway-300 mt-1">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Featured */}
      <section className="max-w-7xl mx-auto px-4 py-10">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">{t('home.featuredTitle')}</h2>
          <Link to="/aircraft" className="text-sm text-runway-500 hover:text-runway-700 dark:text-runway-400">
            {t('aircraft.allAircraft')} →
          </Link>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          {featured.map((a) => (
            <AircraftCard key={a!.id} aircraft={a!} />
          ))}
        </div>
        <p className="mt-6 text-xs text-runway-400">
          {t('detail.dataCredit')} ·{' '}
          <Link to="/manufacturers" className="underline">{t('nav.manufacturers')}</Link> ·{' '}
          <Link to="/alliances" className="underline">{t('nav.alliances')}</Link>
        </p>
      </section>
    </div>
  )
}
