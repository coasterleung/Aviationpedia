import { chromium } from 'playwright'
const b = await chromium.launch()
const p = await b.newPage({ viewport: { width: 1440, height: 900 } })
await p.goto('http://localhost:5173/manufacturers', { waitUntil: 'networkidle' })
await p.waitForTimeout(1500)
const h = await p.evaluate(() => document.documentElement.scrollHeight)
await p.screenshot({ path: 'shots/manufacturers-v2.png', fullPage: true })
console.log('manufacturers page height:', h + 'px')
await b.close()
