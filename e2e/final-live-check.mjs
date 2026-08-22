import { chromium } from 'playwright'
const b = await chromium.launch()
const p = await b.newPage({ viewport: { width: 1440, height: 900 } })
const errors = []
p.on('pageerror', (e) => errors.push(String(e).slice(0, 100)))

await p.goto('https://coasterleung.github.io/Aviationpedia/airlines/Q291090', { waitUntil: 'networkidle' })
await p.waitForTimeout(9000)
const state = await p.evaluate(() => {
  const h1 = document.querySelector('h1')?.textContent
  const heading = [...document.querySelectorAll('h2')].find(h => h.textContent.includes('当前航班') || h.textContent.includes('Live flights'))
  return { h1, heading: heading?.textContent ?? null }
})
console.log('线上南航页:', JSON.stringify(state), '| 错误:', errors.length)
await b.close()
