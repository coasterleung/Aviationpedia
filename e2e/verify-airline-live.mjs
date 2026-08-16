import { chromium } from 'playwright'
const b = await chromium.launch()
const p = await b.newPage({ viewport: { width: 1440, height: 900 } })
const errors = []
p.on('pageerror', (e) => errors.push(String(e).slice(0, 120)))

// China Southern (CSN) — should have live flights
await p.goto('http://localhost:5173/airlines/Q291090', { waitUntil: 'networkidle' })
await p.waitForTimeout(8000)
const cs = await p.evaluate(() => {
  const h1 = document.querySelector('h1')?.textContent
  const body = document.body.innerText
  const liveSection = body.includes('当前航班')
  const count = (body.match(/当前航班\s*·\s*(\d+)/) ?? [])[1] ?? null
  const rows = [...document.querySelectorAll('ul li')].length
  return { h1, liveSection, count, rows }
})
console.log('南航详情页:', JSON.stringify(cs))

// Airline without ICAO (OpenFlights one) — should show noIcao hint
await p.goto('http://localhost:5173/airlines/OF:TEST', { waitUntil: 'networkidle' }).catch(() => {})
// find a real OpenFlights airline
const noIcao = await p.evaluate(async () => {
  const r = await fetch('/airlines/Q407402') // Air Jamaica — check its page
  return r.status
})
console.log('页面错误:', errors)
await b.close()
