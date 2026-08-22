import { useEffect, useState } from 'react'
import { db, type CachedImage } from '../db'

/** Build a Wikimedia Commons Special:FilePath URL (matches ImageWithFallback). */
export function commonsFileUrl(name: string, width = 800): string {
  let clean = name
  try {
    clean = decodeURIComponent(name)
  } catch {
    // keep as-is
  }
  return `https://commons.wikimedia.org/wiki/Special:FilePath/${encodeURIComponent(clean)}?width=${width}`
}

/** Stable cache key derived from the resolved URL. */
function cacheKeyFor(url: string): string {
  return url.replace(/[^a-zA-Z0-9._-]/g, '_').slice(-180)
}

/**
 * Read a cached image blob from IndexedDB (offline-first).
 * Returns an object URL when available, or null if not cached.
 */
export async function getCachedImage(url: string): Promise<string | null> {
  try {
    const rec = await db.imageCache.get(cacheKeyFor(url))
    if (rec && rec.blob) {
      return URL.createObjectURL(rec.blob)
    }
  } catch {
    // ignore IndexedDB errors — fall back to network
  }
  return null
}

/**
 * Fetch an image and store its blob in IndexedDB so it is available offline.
 * Safe to call repeatedly (dedupes via the cache key). Returns the cached blob URL.
 */
export async function prefetchImage(url: string): Promise<string | null> {
  if (!url) return null
  const key = cacheKeyFor(url)
  try {
    const existing = await db.imageCache.get(key)
    if (existing?.blob) return URL.createObjectURL(existing.blob)

    const res = await fetch(url, { mode: 'cors' })
    if (!res.ok) return null
    const blob = await res.blob()
    if (blob.size === 0) return null
    const rec: CachedImage = { key, url, blob, type: blob.type || 'image/jpeg', cachedAt: Date.now() }
    await db.imageCache.put(rec)
    return URL.createObjectURL(blob)
  } catch {
    return null
  }
}

/** Bulk-prefetch a list of Commons image names (used to warm the offline cache). */
export async function prefetchImages(names: (string | null | undefined)[], width = 800): Promise<void> {
  const urls = Array.from(
    new Set(
      names
        .filter((n): n is string => !!n)
        .map((n) => commonsFileUrl(n, width)),
    ),
  )
  await Promise.all(urls.map((u) => prefetchImage(u).catch(() => null)))
}

/**
 * Hook: returns an offline-capable src for a Commons image.
 * 1) On mount, tries IndexedDB; if found, shows it immediately.
 * 2) Otherwise returns the network URL.
 * 3) Asynchronously prefetches the blob into IndexedDB for future offline use.
 * Returns `null` while resolving the cached blob (caller can show network URL meanwhile).
 */
export function useImageCache(name: string | null | undefined, width = 800): string | null {
  const [cached, setCached] = useState<string | null>(null)

  const url = name ? commonsFileUrl(name, width) : null

  useEffect(() => {
    if (!url) {
      setCached(null)
      return
    }
    let revoked = false
    let objectUrl: string | null = null

    getCachedImage(url).then((obj) => {
      if (revoked) {
        if (obj) URL.revokeObjectURL(obj)
        return
      }
      if (obj) {
        objectUrl = obj
        setCached(obj)
      }
    })

    prefetchImage(url).then((obj) => {
      if (revoked) {
        if (obj) URL.revokeObjectURL(obj)
        return
      }
      if (obj && !cached) {
        if (objectUrl) URL.revokeObjectURL(objectUrl)
        objectUrl = obj
        setCached(obj)
      }
    })

    return () => {
      revoked = true
      if (objectUrl) URL.revokeObjectURL(objectUrl)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [url, width])

  return cached
}
