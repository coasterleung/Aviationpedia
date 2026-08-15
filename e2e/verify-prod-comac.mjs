import { chromium } from 'playwright'
const b = await chromium.launch()
const p = await b.newPage({ viewport: { width: 1440, height: 900 } })
const errors = []
p.on('pageerror', (e) => errors.push(String(e).slice(0, 100)))

await p.goto('https://coasterleung.github.io/Aviationpedia/aircraft/Q429894', { waitUntil: 'networkidle' })
await p.waitForTimeout(3000)
const state = await p.evaluate(() => {
  const h1 = document.querySelector('h1')?.textContent
  const imgs = [...document.querySelectorAll('img')]
  return { h1, imgs: imgs.length, liveImgs: imgs.filter(i => i.naturalWidth > 0).length }
})
console.log('production C919:', JSON.stringify(state), '| errors:', errors.length)

await p.goto('https://coasterleung.github.io/Aviationpedia/manufacturers', { waitUntil: 'networkidle' })
await p.waitForTimeout(2500)
const mfr = await p.evaluate(() => {
  const links = [...document.querySelectorAll('a[href*="mfr="]')]
  const hit = links.find(a => a.textContent.includes('Comac') || a.textContent.includes('中国商用'))
  return hit ? hit.textContent.trim() : null
})
console.log('production manufacturers Comac:', mfr)
await b.close()
