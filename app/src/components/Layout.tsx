import { NavLink, Outlet, useLocation } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useEffect } from 'react'
import { useUI } from '../store/ui'
import SearchBox from './SearchBox'

const navItems = [
  { to: '/', key: 'nav.home', end: true },
  { to: '/aircraft', key: 'nav.aircraft' },
  { to: '/airlines', key: 'nav.airlines' },
  { to: '/manufacturers', key: 'nav.manufacturers' },
  { to: '/codes', key: 'nav.codes' },
  { to: '/live', key: 'nav.live' },
  { to: '/alliances', key: 'nav.alliances' },
] as const

export default function Layout() {
  const { t } = useTranslation()
  const { lang, setLang, theme, toggleTheme } = useUI()
  const location = useLocation()

  // Apply theme class to <html>
  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark')
  }, [theme])

  // Scroll to top on route change
  useEffect(() => {
    window.scrollTo({ top: 0 })
  }, [location.pathname])

  return (
    <div className="min-h-screen flex flex-col">
      <header className="sticky top-0 z-40 backdrop-blur bg-runway-50/85 dark:bg-runway-950/85 border-b border-runway-200 dark:border-runway-800">
        <div className="max-w-7xl mx-auto px-4 h-14 flex items-center gap-4">
          <NavLink to="/" className="flex items-center gap-2 shrink-0">
            <span className="w-8 h-8 rounded-lg bg-altitude-500 text-white flex items-center justify-center">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5">
                <path d="M2 16l4.5-1.5L9 12l-2-3.5L9.5 7 14 12l4-1 2 1.5-1 1.5-4.5.5-4.5 2L9 18l-3-.5L2 16z" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </span>
            <span className="font-bold hidden sm:block text-sm">{t('app.name')}</span>
          </NavLink>

          <nav className="hidden lg:flex items-center gap-1 text-sm">
            {navItems.map((n) => (
              <NavLink
                key={n.to}
                to={n.to}
                end={'end' in n && n.end}
                className={({ isActive }) =>
                  `px-3 py-1.5 rounded-lg transition-colors ${
                    isActive
                      ? 'bg-runway-200 dark:bg-runway-800 text-runway-950 dark:text-white font-medium'
                      : 'text-runway-600 dark:text-runway-300 hover:bg-runway-100 dark:hover:bg-runway-800/60'
                  }`
                }
              >
                {t(n.key)}
              </NavLink>
            ))}
          </nav>

          <div className="flex-1 flex justify-end items-center gap-2">
            <div className="hidden lg:block w-64">
              <SearchBox />
            </div>
            <div className="flex items-center gap-1 text-xs border border-runway-200 dark:border-runway-700 rounded-lg p-0.5">
              <button
                onClick={() => setLang('zh')}
                className={`px-2 py-1 rounded-md ${lang === 'zh' ? 'bg-runway-800 text-white' : 'text-runway-500'}`}
              >
                中
              </button>
              <button
                onClick={() => setLang('en')}
                className={`px-2 py-1 rounded-md ${lang === 'en' ? 'bg-runway-800 text-white' : 'text-runway-500'}`}
              >
                EN
              </button>
            </div>
            <button
              onClick={toggleTheme}
              aria-label={t('common.theme')}
              className="w-8 h-8 rounded-lg flex items-center justify-center text-runway-600 dark:text-runway-300 hover:bg-runway-100 dark:hover:bg-runway-800/60"
            >
              {theme === 'light' ? (
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="w-4.5 h-4.5">
                  <path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              ) : (
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="w-4.5 h-4.5">
                  <circle cx="12" cy="12" r="4.5" />
                  <path d="M12 2v2m0 16v2M4.9 4.9l1.4 1.4m11.4 11.4l1.4 1.4M2 12h2m16 0h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" strokeLinecap="round" />
                </svg>
              )}
            </button>
          </div>
        </div>

        {/* Mobile nav */}
        <nav className="lg:hidden flex items-center gap-1 text-xs px-3 pb-2 overflow-x-auto nice-scroll">
          {navItems.map((n) => (
            <NavLink
              key={n.to}
              to={n.to}
              end={'end' in n && n.end}
              className={({ isActive }) =>
                `px-2.5 py-1.5 rounded-lg whitespace-nowrap ${
                  isActive
                    ? 'bg-runway-200 dark:bg-runway-800 text-runway-950 dark:text-white font-medium'
                    : 'text-runway-600 dark:text-runway-300'
                }`
              }
            >
              {t(n.key)}
            </NavLink>
          ))}
        </nav>
      </header>

      <main className="flex-1">
        <Outlet />
      </main>

      <footer className="border-t border-runway-200 dark:border-runway-800 py-6 mt-10 text-center text-xs text-runway-400">
        {t('detail.dataCredit')} ·{' '}
        <a className="underline hover:text-runway-600" href="https://www.wikidata.org/" target="_blank" rel="noreferrer">Wikidata</a> ·{' '}
        <a className="underline hover:text-runway-600" href="https://openflights.org/" target="_blank" rel="noreferrer">OpenFlights</a>
      </footer>
    </div>
  )
}
