import { chromium } from 'playwright'
const b = await chromium.launch()
const p = await b.newPage({ viewport: { width: 1440, height: 900 } })
const errors = []
p.on('pageerror', (e) => errors.push(String(e).slice(0, 150)))

// China Southern (CSN) — busy airline, should show flights
await p.goto('http://localhost:5173/airlines/Q291090', { waitUntil: 'networkidle' })
await p.waitForTimeout(9000)
const cs = await p.evaluate(() => {
  const body = document.body.innerText
  const liveHeading = [...document.querySelectorAll('h2')].find(h => h.textContent.includes('当前航班'))
  const rows = liveHeading ? liveHeading.closest('div')?.querySelectorAll('li').length ?? 0 : 0
  return {
    hasLiveHeading: !!liveHeading,
    headingText: liveHeading?.textContent,
    rows,
    sample: liveHeading ? [...liveHeading.closest('div').querySelectorAll('li')].slice(0, 2).map(li => li.textContent.replace(/\s+/g, ' ').trim()) : [],
  }
})
console.log('南航当前航班:', JSON.stringify(cs, null, 1))

// Singapore Airlines (SQ)
await p.goto('http://localhost:5173/airlines/Q32245', { waitUntil: 'networkidle' })
await p.waitForTimeout(7000)
const sq = await p.evaluate(() => {
  const liveHeading = [...document.querySelectorAll('h2')].find(h => h.textContent.includes('当前航班'))
  const rows = liveHeading ? liveHeading.closest('div')?.querySelectorAll('li').length ?? 0 : 0
  return { has: !!liveHeading, text: liveHeading?.textContent, rows }
})
console.log('新航当前航班:', JSON.stringify(sq))

// An airline without ICAO — OpenFlights source
await p.goto('http://localhost:5173/airlines/Q407402', { waitUntil: 'networkidle' }) // Air Jamaica
await p.waitForTimeout(6000)
const aj = await p.evaluate(() => {
  const body = document.body.innerText
  return {
    hasNoIcao: body.includes('无法匹配') || body.includes('no ICAO') || body.includes('无 ICAO'),
    noFlights: body.includes('无实时航班') || body.includes('No live flights'),
  }
})
console.log('Air Jamaica (无ICAO):', JSON.stringify(aj))
console.log('页面错误:', errors.slice(0, 3))
await b.close()
