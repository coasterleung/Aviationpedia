import { chromium } from 'playwright'
const b = await chromium.launch()
const p = await b.newPage({ viewport: { width: 1440, height: 900 } })
await p.goto('http://localhost:5173/airlines/Q291090', { waitUntil: 'networkidle' })
await p.waitForTimeout(8000)
const rows = await p.evaluate(() => {
  const uls = [...document.querySelectorAll('ul')]
  const live = uls.find(u => u.querySelector('li span[class*="rounded-full"]'))
  return live ? [...live.querySelectorAll('li')].slice(0, 3).map(li => li.textContent.replace(/\s+/g, ' ').trim()) : null
})
console.log('南航航班列表行:', JSON.stringify(rows))
await b.close()
