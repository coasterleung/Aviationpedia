import type { Encyclopedia, Aircraft, Airline, Alliance, Manufacturer, AircraftCode } from './types'
import raw from './encyclopaedia.json'

export const encyclopaedia = raw as unknown as Encyclopedia

export const aircraftList: Aircraft[] = encyclopaedia.aircraft
export const airlineList: Airline[] = encyclopaedia.airlines
export const allianceList: Alliance[] = encyclopaedia.alliances
export const manufacturerList: Manufacturer[] = encyclopaedia.manufacturers
export const aircraftCodeList: AircraftCode[] = encyclopaedia.aircraftCodes ?? []

const aircraftById = new Map(aircraftList.map((a) => [a.id, a]))
const airlineById = new Map(airlineList.map((a) => [a.id, a]))
const manufacturerById = new Map(manufacturerList.map((m) => [m.id, m]))
const allianceById = new Map(allianceList.map((a) => [a.id, a]))

export const getAircraft = (id: string): Aircraft | undefined => aircraftById.get(id)
export const getAirline = (id: string): Airline | undefined => airlineById.get(id)
export const getManufacturer = (id: string): Manufacturer | undefined => manufacturerById.get(id)
export const getAlliance = (id: string): Alliance | undefined => allianceById.get(id)

/** Entity display name preferring current language. */
export function displayName(en: string | null, zh: string | null, lang: string): string {
  if (lang === 'zh' && zh) return zh
  return en ?? zh ?? ''
}

/** Resolve a referenced entity (hub/country/engine/variant) label. */
export function refLabel(id: string | null | undefined, lang: string): string | null {
  if (!id) return null
  const r = encyclopaedia.labels.refs[id] ?? encyclopaedia.labels.ext[id] ?? encyclopaedia.labels.mfr[id]
  if (!r) return null
  if (lang === 'zh' && r[1]) return r[1]
  return r[0] ?? null
}

/** Resolve aircraft name (prefers localized label). */
export function aircraftName(id: string, lang: string): string {
  const a = getAircraft(id)
  if (a) return displayName(a.en, a.zh, lang)
  return refLabel(id, lang) ?? id
}

/** Resolve airline name. */
export function airlineName(id: string, lang: string): string {
  const a = getAirline(id)
  if (a) return displayName(a.en, a.zh, lang)
  return refLabel(id, lang) ?? id
}

/** Alliance members for an alliance, as airline objects. */
export function allianceMembers(allianceId: string): Airline[] {
  const ids = encyclopaedia.allianceMembers[allianceId] ?? []
  return ids.map((id) => (id ? getAirline(id) : undefined)).filter((a): a is Airline => !!a)
}

export interface SearchHit<T> {
  item: T
  score: number
}

function norm(s: string): string {
  return s
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9 ]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

/** Search aircraft by name / codes / description. Returns scored results. */
export function searchAircraft(q: string, limit = 60): SearchHit<Aircraft>[] {
  const query = norm(q)
  if (!query) return []
  const qw = query.split(' ')
  const hits: SearchHit<Aircraft>[] = []
  for (const a of aircraftList) {
    const hay = norm(`${a.en} ${a.zh ?? ''} ${a.desc ?? ''} ${refLabel(a.manufacturer, 'en') ?? ''}`)
    if (!hay) continue
    let score = 0
    if (hay === query) score = 100
    else if (hay.startsWith(query)) score = 80
    else if (hay.includes(query)) score = 60
    else {
      const words = qw.filter((w) => hay.includes(w))
      if (words.length === 0) continue
      score = 20 + words.length * 8
    }
    hits.push({ item: a, score })
  }
  return hits.sort((a, b) => b.score - a.score).slice(0, limit)
}

/** Search airlines by name / IATA / ICAO / callsign / country. */
export function searchAirlines(q: string, limit = 60): SearchHit<Airline>[] {
  const query = norm(q)
  if (!query) return []
  const qUpper = q.trim().toUpperCase()
  const qw = query.split(' ')
  const hits: SearchHit<Airline>[] = []
  for (const a of airlineList) {
    // Exact code matches rank highest
    if (a.iata && qUpper === a.iata.toUpperCase()) {
      hits.push({ item: a, score: 110 })
      continue
    }
    if (a.icao && qUpper === a.icao.toUpperCase()) {
      hits.push({ item: a, score: 105 })
      continue
    }
    const hay = norm(`${a.en} ${a.zh ?? ''} ${a.callsign ?? ''}`)
    if (!hay) continue
    let score = 0
    if (hay === query) score = 100
    else if (hay.startsWith(query)) score = 75
    else if (hay.includes(query)) score = 55
    else {
      const words = qw.filter((w) => hay.includes(w))
      if (words.length === 0) continue
      score = 15 + words.length * 7
    }
    hits.push({ item: a, score })
  }
  return hits.sort((a, b) => b.score - a.score).slice(0, limit)
}
