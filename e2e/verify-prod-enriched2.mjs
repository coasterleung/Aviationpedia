import { chromium } from 'playwright'
const b = await chromium.launch()
const p = await b.newPage({ viewport: { width: 1440, height: 900 } })
const errors = []
p.on('pageerror', (e) => errors.push(String(e).slice(0, 100)))

await p.goto('https://coasterleung.github.io/Aviationpedia/live', { waitUntil: 'networkidle' })
await p.waitForTimeout(10000)
await p.evaluate(() => {
  localStorage.setItem('aviation-encyclopedia-ui', JSON.stringify({ state: { lang: 'zh', theme: 'dark', compare: [] }, version: 0 }))
})
await p.reload({ waitUntil: 'networkidle' })
await p.waitForTimeout(8000)

// click a few markers to find one with type info
let popupWithType = null
const markers = p.locator('.leaflet-interactive')
const count = await markers.count()
for (let i = 0; i < Math.min(count, 8); i++) {
  await markers.nth(i).click({ force: true }).catch(() => {})
  await p.waitForTimeout(600)
  const text = await p.evaluate(() => document.querySelector('.leaflet-popup-content')?.textContent?.replace(/\s+/g, ' ').trim().slice(0, 250) ?? null)
  if (text && text.includes('机型')) { popupWithType = text; break }
}
console.log('弹窗(带机型):', popupWithType)

// dark tiles check
const dark = await p.evaluate(() => {
  const t = [...document.querySelectorAll('.leaflet-tile')]
  return t[0]?.getAttribute('src')?.includes('dark_all') ?? false
})
console.log('深色瓦片:', dark)

// airline page rows
await p.goto('https://coasterleung.github.io/Aviationpedia/airlines/Q291090', { waitUntil: 'networkidle' })
await p.waitForTimeout(9000)
const rows = await p.evaluate(() => {
  const uls = [...document.querySelectorAll('ul')]
  const live = uls.find(u => u.querySelector('li span[class*="rounded-full"]'))
  return live ? [...live.querySelectorAll('li')].slice(0, 3).map(li => li.textContent.replace(/\s+/g, ' ').trim()) : null
})
console.log('南航航班行:', JSON.stringify(rows))
console.log('错误:', errors)
await p.screenshot({ path: 'shots/prod-live-enriched.png' })
await b.close()
