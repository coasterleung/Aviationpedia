import Dexie, { type Table } from 'dexie'
import type { EntityKind } from '../data/types'

export interface Favorite {
  key: string // "aircraft:Q6387" | "airline:Q32245"
  kind: EntityKind
  id: string
  addedAt: number
}

class EncyclopediaDB extends Dexie {
  favorites!: Table<Favorite, string>

  constructor() {
    super('aviation-encyclopedia')
    this.version(1).stores({
      favorites: 'key, kind, addedAt',
    })
  }
}

export const db = new EncyclopediaDB()
