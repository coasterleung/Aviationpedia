import { useLiveQuery } from 'dexie-react-hooks'
import { db, type Favorite } from '../db'
import type { EntityKind } from '../data/types'

export const favKey = (kind: EntityKind, id: string) => `${kind}:${id}`

export function useFavorites() {
  const favorites = useLiveQuery(() => db.favorites.orderBy('addedAt').reverse().toArray(), []) ?? []
  const isFav = (kind: EntityKind, id: string) => favorites.some((f) => f.key === favKey(kind, id))
  const toggle = async (kind: EntityKind, id: string) => {
    const key = favKey(kind, id)
    const exists = await db.favorites.get(key)
    if (exists) await db.favorites.delete(key)
    else await db.favorites.add({ key, kind, id, addedAt: Date.now() } satisfies Favorite)
  }
  return { favorites, isFav, toggle }
}
