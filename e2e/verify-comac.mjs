import { chromium } from 'playwright'
const b = await chromium.launch()
const p = await b.newPage({ viewport: { width: 1440, height: 900 } })
const errors = []
p.on('pageerror', (e) => errors.push(String(e).slice(0, 120)))

// 1. C919 detail page
await p.goto('http://localhost:5173/aircraft/Q429894', { waitUntil: 'networkidle' })
await p.waitForTimeout(2500)
const c919 = await p.evaluate(() => {
  const h1 = document.querySelector('h1')?.textContent
  const imgs = [...document.querySelectorAll('img')]
  const specs = [...document.querySelectorAll('dl div')].slice(0, 3).map(d => d.textContent)
  return { h1, imgs: imgs.length, liveImgs: imgs.filter(i => i.naturalWidth > 0).length, specs }
})
console.log('C919 detail:', JSON.stringify(c919))

// 2. Manufacturers page — find Comac
await p.goto('http://localhost:5173/manufacturers', { waitUntil: 'networkidle' })
await p.waitForTimeout(2000)
const comac = await p.evaluate(() => {
  const links = [...document.querySelectorAll('a[href*="mfr="]')]
  const hit = links.find(a => a.textContent.includes('Comac') || a.textContent.includes('中国商用'))
  return hit ? hit.textContent.trim() : null
})
console.log('manufacturers page Comac link:', comac)

// 3. Search "c919"
await p.goto('http://localhost:5173/', { waitUntil: 'networkidle' })
await p.waitForTimeout(1500)
await p.fill('input[placeholder*="搜索"], input[type="text"]', 'c919')
await p.waitForTimeout(1200)
const search = await p.evaluate(() => document.body.innerText.includes('C919'))
console.log('search finds C919:', search)
console.log('page errors:', errors)
await b.close()
