import { chromium } from 'playwright'
const b = await chromium.launch()
const p = await b.newPage({ viewport: { width: 1440, height: 900 } })
const errors = []
p.on('pageerror', (e) => errors.push(String(e).slice(0, 100)))

// live map + dark theme
await p.goto('https://coasterleung.github.io/Aviationpedia/live', { waitUntil: 'networkidle' })
await p.waitForTimeout(9000)
await p.evaluate(() => {
  localStorage.setItem('aviation-encyclopedia-ui', JSON.stringify({ state: { lang: 'zh', theme: 'dark', compare: [] }, version: 0 }))
})
await p.reload({ waitUntil: 'networkidle' })
await p.waitForTimeout(8000)
const darkState = await p.evaluate(() => {
  const tiles = [...document.querySelectorAll('.leaflet-tile')]
  const firstTile = tiles[0]?.getAttribute('src') ?? ''
  return { isCartoDark: firstTile.includes('dark_all'), tileCount: tiles.length }
})
console.log('深色地图:', JSON.stringify(darkState))

// click a marker, check popup has 机型
const marker = p.locator('.leaflet-interactive').first()
await marker.click({ force: true }).catch(() => {})
await p.waitForTimeout(1200)
const popupText = await p.evaluate(() => {
  const popup = document.querySelector('.leaflet-popup-content')
  return popup?.textContent?.replace(/\s+/g, ' ').trim().slice(0, 250) ?? null
})
console.log('生产弹窗:', popupText)
console.log('错误:', errors)
await b.close()
