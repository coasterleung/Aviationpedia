import { chromium } from 'playwright'
const b = await chromium.launch()
const p = await b.newPage({ viewport: { width: 1440, height: 900 } })
const errors = []
p.on('pageerror', (e) => errors.push(String(e).slice(0, 120)))

await p.goto('http://localhost:5173/live', { waitUntil: 'networkidle' })
await p.waitForTimeout(8000)

// dark mode
await p.evaluate(() => {
  localStorage.setItem('aviation-encyclopedia-ui', JSON.stringify({ state: { lang: 'zh', theme: 'dark', compare: [] }, version: 0 }))
})
await p.reload({ waitUntil: 'networkidle' })
await p.waitForTimeout(6000)

// click first marker via Playwright
const marker = p.locator('.leaflet-interactive').first()
await marker.click({ force: true }).catch(() => console.log('marker click failed'))
await p.waitForTimeout(1000)
const popupText = await p.evaluate(() => {
  const popup = document.querySelector('.leaflet-popup-content')
  return popup?.textContent?.replace(/\s+/g, ' ').trim().slice(0, 250) ?? null
})
console.log('弹窗内容:', popupText)

// airline rows
await p.goto('http://localhost:5173/airlines/Q291090', { waitUntil: 'networkidle' })
await p.waitForTimeout(8000)
const rows = await p.evaluate(() => {
  const uls = [...document.querySelectorAll('ul')]
  const live = uls.find(u => u.querySelector('li span[class*="rounded-full"]'))
  return live ? [...live.querySelectorAll('li')].slice(0, 3).map(li => li.textContent.replace(/\s+/g, ' ').trim()) : null
})
console.log('南航航班行:', JSON.stringify(rows))
console.log('页面错误:', errors)
await p.screenshot({ path: 'shots/live-dark.png' })
await b.close()
