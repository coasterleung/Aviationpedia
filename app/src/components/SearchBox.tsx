import { useMemo, useRef, useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import { searchAircraft, searchAirlines, displayName, refLabel } from '../data'
import { useUI } from '../store/ui'

export default function SearchBox() {
  const { t } = useTranslation()
  const lang = useUI((s) => s.lang)
  const navigate = useNavigate()
  const [q, setQ] = useState('')
  const [open, setOpen] = useState(false)
  const boxRef = useRef<HTMLDivElement>(null)

  const results = useMemo(() => {
    if (q.trim().length < 1) return null
    const a = searchAircraft(q, 4)
    const l = searchAirlines(q, 4)
    return { aircraft: a, airlines: l }
  }, [q])

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (boxRef.current && !boxRef.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', onClick)
    return () => document.removeEventListener('mousedown', onClick)
  }, [])

  const go = (kind: 'aircraft' | 'airline', id: string) => {
    setOpen(false)
    setQ('')
    navigate(kind === 'aircraft' ? `/aircraft/${id}` : `/airlines/${id}`)
  }

  return (
    <div ref={boxRef} className="relative w-full">
      <div className="relative">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-runway-400">
          <circle cx="11" cy="11" r="7" />
          <path d="m21 21-4.3-4.3" strokeLinecap="round" />
        </svg>
        <input
          value={q}
          onChange={(e) => {
            setQ(e.target.value)
            setOpen(true)
          }}
          onFocus={() => setOpen(true)}
          placeholder={t('home.searchPlaceholder')}
          className="w-full pl-8 pr-3 py-1.5 text-sm rounded-lg bg-white dark:bg-runway-900 border border-runway-200 dark:border-runway-700 outline-none focus:ring-2 focus:ring-altitude-500/40"
        />
      </div>
      {open && results && (
        <div className="absolute top-full mt-1 left-0 right-0 bg-white dark:bg-runway-900 border border-runway-200 dark:border-runway-700 rounded-lg shadow-xl z-50 text-sm max-h-80 overflow-y-auto nice-scroll">
          {results.aircraft.length === 0 && results.airlines.length === 0 && (
            <div className="px-4 py-3 text-runway-400">{t('search.noResults')}</div>
          )}
          {results.aircraft.length > 0 && (
            <>
              <div className="px-3 pt-2 pb-1 text-[11px] uppercase tracking-wide text-runway-400">{t('nav.aircraft')}</div>
              {results.aircraft.map(({ item }) => (
                <button
                  key={item.id}
                  onClick={() => go('aircraft', item.id)}
                  className="w-full text-left px-3 py-1.5 hover:bg-runway-50 dark:hover:bg-runway-800 flex items-center gap-2"
                >
                  <span className="font-medium truncate">{displayName(item.en, item.zh, lang)}</span>
                  {item.manufacturer && (
                    <span className="text-xs text-runway-400 truncate">{displayNameFromMfr(item.manufacturer, lang)}</span>
                  )}
                </button>
              ))}
            </>
          )}
          {results.airlines.length > 0 && (
            <>
              <div className="px-3 pt-2 pb-1 text-[11px] uppercase tracking-wide text-runway-400">{t('nav.airlines')}</div>
              {results.airlines.map(({ item }) => (
                <button
                  key={item.id}
                  onClick={() => go('airline', item.id)}
                  className="w-full text-left px-3 py-1.5 hover:bg-runway-50 dark:hover:bg-runway-800 flex items-center gap-2"
                >
                  <span className="font-medium truncate">{displayName(item.en, item.zh, lang)}</span>
                  <span className="text-xs text-runway-400 shrink-0">
                    {[item.iata, item.icao].filter(Boolean).join(' / ')}
                  </span>
                </button>
              ))}
            </>
          )}
        </div>
      )}
    </div>
  )
}

function displayNameFromMfr(id: string, lang: string) {
  return refLabel(id, lang) ?? id
}
