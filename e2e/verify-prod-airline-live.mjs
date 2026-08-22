import { chromium } from 'playwright'
const b = await chromium.launch()
const p = await b.newPage({ viewport: { width: 1440, height: 900 } })
const errors = []
p.on('pageerror', (e) => errors.push(String(e).slice(0, 120)))

await p.goto('https://coasterleung.github.io/Aviationpedia/airlines/Q291090', { waitUntil: 'networkidle' })
await p.waitForTimeout(10000)
const state = await p.evaluate(() => {
  const h1 = document.querySelector('h1')?.textContent
  const heading = [...document.querySelectorAll('h2')].find(h => h.textContent.includes('当前航班') || h.textContent.includes('Live flights'))
  const uls = [...document.querySelectorAll('ul')]
  const liveUl = uls.find(u => u.querySelector('li span[class*="rounded-full"]'))
  return { h1, heading: heading?.textContent, rows: liveUl ? liveUl.querySelectorAll('li').length : 0 }
})
console.log('生产南航页:', JSON.stringify(state))
console.log('错误:', errors)
await b.close()
