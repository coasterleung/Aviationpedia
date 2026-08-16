import { chromium, devices } from 'playwright'
const b = await chromium.launch()

const targets = [
  { name: 'iPad (768x1024)', viewport: { width: 768, height: 1024 } },
  { name: 'iPad Pro 11 (834x1194)', viewport: { width: 834, height: 1194 } },
  { name: 'iPad Pro 12.9 (1024x1366)', viewport: { width: 1024, height: 1366 } },
  { name: 'iPad landscape (1024x768)', viewport: { width: 1024, height: 768 } },
]

for (const t of targets) {
  const p = await b.newPage({ viewport: t.viewport })
  await p.goto('http://localhost:5173/', { waitUntil: 'networkidle' })
  await p.waitForTimeout(2000)
  const state = await p.evaluate(() => {
    const header = document.querySelector('header')
    const hd = header.getBoundingClientRect()
    const desktopNav = header.querySelector('nav.hidden')
    const mobileNav = [...header.querySelectorAll('nav')].find(n => !n.classList.contains('hidden') || getComputedStyle(n).display !== 'none')
    // all nav elements and their positions
    const navs = [...header.querySelectorAll('nav')].map(n => {
      const r = n.getBoundingClientRect()
      return { display: getComputedStyle(n).display, y: Math.round(r.top), h: Math.round(r.height), w: Math.round(r.width), text: n.textContent.slice(0, 20) }
    })
    // check horizontal overflow
    const doc = document.documentElement
    const overflow = doc.scrollWidth > doc.clientWidth
    // elements outside viewport
    const outside = [...header.querySelectorAll('*')].filter(el => {
      const r = el.getBoundingClientRect()
      return r.right > doc.clientWidth + 2 && r.width > 0
    }).slice(0, 5).map(el => el.tagName + '.' + String(el.className).slice(0, 30))
    return { headerH: Math.round(hd.height), navs, overflow, outside, scrollWidth: doc.scrollWidth, clientWidth: doc.clientWidth }
  })
  console.log(`\n=== ${t.name} ===`)
  console.log(JSON.stringify(state, null, 1))
  await p.screenshot({ path: 'shots/ipad-' + t.name.replace(/[^a-z0-9]/gi, '') + '.png' })
  await p.close()
}
await b.close()
