import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { EntityKind } from '../data/types'

export type Lang = 'en' | 'zh'
export type Theme = 'light' | 'dark'

export interface CompareEntry {
  kind: EntityKind
  id: string
}

interface UIState {
  lang: Lang
  theme: Theme
  compare: CompareEntry[]
  setLang: (l: Lang) => void
  toggleTheme: () => void
  toggleCompare: (entry: CompareEntry) => void
  removeCompare: (key: string) => void
  clearCompare: () => void
}

export const compareKey = (e: CompareEntry) => `${e.kind}:${e.id}`

export const useUI = create<UIState>()(
  persist(
    (set) => ({
      lang: 'zh',
      theme: 'light',
      compare: [],
      setLang: (lang) => set({ lang }),
      toggleTheme: () => set((s) => ({ theme: s.theme === 'light' ? 'dark' : 'light' })),
      toggleCompare: (entry) =>
        set((s) => {
          const key = compareKey(entry)
          const exists = s.compare.some((c) => compareKey(c) === key)
          if (exists) {
            return { compare: s.compare.filter((c) => compareKey(c) !== key) }
          }
          if (s.compare.length >= 3) return s
          return { compare: [...s.compare, entry] }
        }),
      removeCompare: (key) =>
        set((s) => ({ compare: s.compare.filter((c) => compareKey(c) !== key) })),
      clearCompare: () => set({ compare: [] }),
    }),
    { name: 'aviation-encyclopedia-ui' }
  )
)
