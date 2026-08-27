import { chromium } from 'playwright'
const b = await chromium.launch()
const p = await b.newPage()
await p.goto('http://localhost:5173/', { waitUntil: 'networkidle' })
await p.waitForTimeout(1000)
const result = await p.evaluate(async (hex) => {
  try {
    const res = await fetch('https://opensky-network.org/api/metadata/aircraft/icao24/' + hex)
    if (!res.ok) return { ok: false, status: res.status }
    const j = await res.json()
    return { ok: true, status: res.status, type: j.typeDesignator, reg: j.registration }
  } catch (e) {
    return { ok: false, error: String(e).slice(0, 120) }
  }
}, '80163d')
console.log('浏览器内 fetch metadata:', JSON.stringify(result))
await b.close()
