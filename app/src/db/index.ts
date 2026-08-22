import Dexie, { type Table } from 'dexie'
import type { EntityKind } from '../data/types'

export interface Favorite {
  key: string // "aircraft:Q6387" | "airline:Q32245"
  kind: EntityKind
  id: string
  addedAt: number
}

/** Cached image blob (Wikimedia Commons) for offline viewing. */
export interface CachedImage {
  key: string // URL-safe cache key (the resolved Commons FilePath URL)
  url: string // original Commons FilePath URL
  blob: Blob
  type: string // mime type
  cachedAt: number
}

class EncyclopediaDB extends Dexie {
  favorites!: Table<Favorite, string>
  imageCache!: Table<CachedImage, string>

  constructor() {
    super('aviation-encyclopedia')
    this.version(2).stores({
      favorites: 'key, kind, addedAt',
      imageCache: 'key, cachedAt',
    })
  }
}

export const db = new EncyclopediaDB()
