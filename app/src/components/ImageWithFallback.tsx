import { useState } from 'react'

interface Props {
  name: string | null | undefined
  alt: string
  className?: string
  width?: number
}

/** Commons Special:FilePath image with graceful fallback. */
export default function ImageWithFallback({ name, alt, className = '', width = 800 }: Props) {
  const [failed, setFailed] = useState(false)
  if (!name || failed) {
    return (
      <div className={`flex items-center justify-center bg-runway-100 dark:bg-runway-800 text-runway-400 ${className}`} role="img" aria-label={alt}>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-1/3 h-1/3">
          <path d="M2 16l4.5-1.5L9 12l-2-3.5L9.5 7 14 12l4-1 2 1.5-1 1.5-4.5.5-4.5 2L9 18l-3-.5L2 16z" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </div>
    )
  }
  // Names from the pipeline are already URL-encoded (Wikidata Special:FilePath form).
  // Decode first so we never double-encode (%20 -> %2520 -> 404).
  let clean = name
  try {
    clean = decodeURIComponent(name)
  } catch {
    // keep as-is if not valid percent-encoding
  }
  const src = `https://commons.wikimedia.org/wiki/Special:FilePath/${encodeURIComponent(clean)}?width=${width}`
  return (
    <img
      src={src}
      alt={alt}
      loading="lazy"
      className={className}
      onError={() => setFailed(true)}
    />
  )
}
