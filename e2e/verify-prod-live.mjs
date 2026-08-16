import { chromium } from 'playwright'
const b = await chromium.launch()
const p = await b.newPage({ viewport: { width: 1440, height: 900 } })
const errors = []
p.on('pageerror', (e) => errors.push(String(e).slice(0, 120)))
p.on('console', (m) => { if (m.type() === 'error') errors.push(m.text().slice(0, 100)) })

await p.goto('https://coasterleung.github.io/Aviationpedia/live', { waitUntil: 'networkidle', timeout: 45000 })
await p.waitForTimeout(8000)

const state = await p.evaluate(() => {
  const h1 = document.querySelector('h1')?.textContent
  const mapEl = document.querySelector('.leaflet-container')
  const markers = document.querySelectorAll('.leaflet-interactive').length
  const body = document.body.innerText
  return {
    h1,
    hasMap: !!mapEl,
    markers,
    count: (body.match(/飞机数: (\d+)/) ?? [])[1] ?? null,
    errorShown: body.includes('实时数据不可用') || body.includes('Live data unavailable'),
  }
})
console.log('生产 /live:', JSON.stringify(state))
console.log('错误:', errors.slice(0, 4))
await p.screenshot({ path: 'shots/prod-live.png', fullPage: false })
await b.close()
