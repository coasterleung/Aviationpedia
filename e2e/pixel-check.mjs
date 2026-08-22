import { PNG } from 'pngjs'
import { readFileSync, readdirSync } from 'node:fs'
import { fileURLToPath } from 'node:url'

const dir = fileURLToPath(new URL('./shots/', import.meta.url))
const files = readdirSync(dir).filter((f) => f.endsWith('.png'))

function analyzePng(path) {
  const png = PNG.sync.read(readFileSync(path))
  const { width, height, data } = png
  // Sample every 4th pixel
  const colors = new Set()
  let nonBg = 0
  let sampled = 0
  let luminanceSum = 0
  const step = 4
  for (let y = 0; y < height; y += step) {
    for (let x = 0; x < width; x += step) {
      const i = (y * width + x) * 4
      const r = data[i], g = data[i + 1], b = data[i + 2], a = data[i + 3]
      sampled++
      const key = (r >> 4) + ',' + (g >> 4) + ',' + (b >> 4)
      if (colors.size < 5000) colors.add(key)
      const lum = 0.299 * r + 0.587 * g + 0.114 * b
      luminanceSum += lum
      // count "content" pixels: far from pure white AND far from pure black
      if (!(r > 245 && g > 245 && b > 245) && !(r < 12 && g < 12 && b < 12)) nonBg++
    }
  }
  const avgLum = luminanceSum / sampled
  const diversity = colors.size
  const contentRatio = nonBg / sampled
  return { width, height, diversity, contentRatio: Number(contentRatio.toFixed(3)), avgLum: Math.round(avgLum) }
}

const results = []
for (const f of files) {
  const stat = analyzePng(dir + f)
  const flags = []
  if (stat.diversity < 20) flags.push('LOW-DIVERSITY(possible blank)')
  if (stat.contentRatio < 0.02) flags.push('NEARLY-EMPTY')
  if (stat.avgLum > 250) flags.push('ALL-WHITE')
  results.push({ file: f, ...stat, flags: flags.join(' ') || 'OK' })
}
results.sort((a, b) => b.flags.length - a.flags.length)
for (const r of results) {
  console.log(`${r.file.padEnd(26)} ${String(r.width).padStart(4)}x${String(r.height).padStart(4)}  colors=${String(r.diversity).padStart(4)}  content=${String(r.contentRatio).padStart(6)}  lum=${String(r.avgLum).padStart(3)}  ${r.flags}`)
}
