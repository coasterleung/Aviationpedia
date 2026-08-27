import { chromium } from 'playwright'
const b = await chromium.launch()
const errors = []
const p = await b.newPage({ viewport: { width: 1440, height: 900 } })
p.on('pageerror', (e) => errors.push(String(e).slice(0, 120)))

// 1. Live map: dark theme tiles + enriched popup
await p.goto('http://localhost:5173/live', { waitUntil: 'networkidle' })
await p.waitForTimeout(8000)
// switch to dark
await p.evaluate(() => {
  localStorage.setItem('aviation-encyclopedia-ui', JSON.stringify({ state: { lang: 'zh', theme: 'dark', compare: [] }, version: 0 }))
})
await p.reload({ waitUntil: 'networkidle' })
await p.waitForTimeout(6000)
const dark = await p.evaluate(() => {
  const tiles = [...document.querySelectorAll('.leaflet-tile')]
  // check tile URL host
  const firstTile = tiles[0]?.getAttribute('src') ?? ''
  return { tileHost: firstTile.includes('cartocdn') ? 'carto' : firstTile.slice(0, 60), tileCount: tiles.length }
})
console.log('深色地图瓦片:', JSON.stringify(dark))

// click a marker to open popup
const popupState = await p.evaluate(async () => {
  // find a marker (leaflet-interactive) and click it
  const markers = [...document.querySelectorAll('.leaflet-interactive')]
  if (!markers.length) return { clicked: false }
  markers[0].click()
  await new Promise(r => setTimeout(r, 800))
  const popup = document.querySelector('.leaflet-popup-content')
  return { clicked: true, popupText: popup?.textContent?.replace(/\s+/g, ' ').trim().slice(0, 200) }
})
console.log('弹窗内容:', JSON.stringify(popupState))

// 2. Airline page rows with type
await p.goto('http://localhost:5173/airlines/Q291090', { waitUntil: 'networkidle' })
await p.waitForTimeout(8000)
const rows = await p.evaluate(() => {
  const uls = [...document.querySelectorAll('ul')]
  const live = uls.find(u => u.querySelector('li span[class*="rounded-full"]'))
  return live ? [...live.querySelectorAll('li')].slice(0, 3).map(li => li.textContent.replace(/\s+/g, ' ').trim()) : null
})
console.log('南航航班行:', JSON.stringify(rows))
console.log('页面错误:', errors)
await b.close()
