import { chromium } from 'playwright'
const b = await chromium.launch()
const p = await b.newPage({ viewport: { width: 1440, height: 900 } })
const errors = []
p.on('pageerror', (e) => errors.push(String(e).slice(0, 150)))
p.on('console', (m) => { if (m.type() === 'error') errors.push(m.text().slice(0, 120)) })

await p.goto('http://localhost:5173/live', { waitUntil: 'networkidle', timeout: 45000 })
await p.waitForTimeout(6000)

const state = await p.evaluate(() => {
  const h1 = document.querySelector('h1')?.textContent
  const body = document.body.innerText
  const mapEl = document.querySelector('.leaflet-container')
  // count leaflet markers
  const markers = document.querySelectorAll('.leaflet-marker-icon, .leaflet-interactive').length
  const countMatch = body.match(/飞机数|Aircraft[\s\S]{0,40}?\d+/)
  return {
    h1,
    hasMap: !!mapEl,
    mapSize: mapEl ? { w: mapEl.clientWidth, h: mapEl.clientHeight } : null,
    markerElements: markers,
    errorText: body.includes('实时数据不可用') || body.includes('Live data unavailable'),
    bodySample: body.slice(0, 120),
  }
})
console.log('本地 /live 页面:', JSON.stringify(state, null, 1))
console.log('控制台错误:', errors.slice(0, 5))
await p.screenshot({ path: 'shots/live-local.png', fullPage: false })
await b.close()
