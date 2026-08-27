/** Colored initials avatar — shown for entities without images. */

const PALETTE = [
  'bg-blue-600', 'bg-emerald-600', 'bg-amber-600', 'bg-rose-600', 'bg-indigo-600',
  'bg-teal-600', 'bg-orange-600', 'bg-fuchsia-600', 'bg-cyan-700', 'bg-lime-700',
]

/** Stable color from a string (entity id). */
function colorFor(seed: string): string {
  let h = 0
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) >>> 0
  return PALETTE[h % PALETTE.length]
}

/** First letters: for latin take initials of first 2 words; for CJK take first 2 chars. */
export function initialsOf(name: string): string {
  const trimmed = name.trim()
  if (!trimmed) return '?'
  if (/[\u4e00-\u9fff]/.test(trimmed)) return Array.from(trimmed).slice(0, 2).join('')
  const words = trimmed.split(/\s+/).filter(Boolean)
  if (words.length === 1) return words[0].slice(0, 2).toUpperCase()
  return (words[0][0] + words[1][0]).toUpperCase()
}

interface Props {
  seed: string
  name: string
  className?: string
}

export default function Avatar({ seed, name, className = '' }: Props) {
  return (
    <div
      className={`flex items-center justify-center text-white font-bold select-none ${colorFor(seed)} ${className}`}
      role="img"
      aria-label={name}
    >
      {initialsOf(name)}
    </div>
  )
}
