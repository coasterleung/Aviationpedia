import { chromium } from 'playwright'
const b = await chromium.launch()
const targets = [
  { name: 'iPad 768', viewport: { width: 768, height: 1024 } },
  { name: 'iPad Pro 11 834', viewport: { width: 834, height: 1194 } },
  { name: 'iPad Pro 12.9 1024', viewport: { width: 1024, height: 1366 } },
  { name: 'iPad landscape 1024x768', viewport: { width: 1024, height: 768 } },
  { name: 'Desktop 1440', viewport: { width: 1440, height: 900 } },
  { name: 'Mobile 390', viewport: { width: 390, height: 844 } },
]
for (const t of targets) {
  const p = await b.newPage({ viewport: t.viewport })
  await p.goto('http://localhost:5173/', { waitUntil: 'networkidle' })
  await p.waitForTimeout(1500)
  const state = await p.evaluate(() => {
    const header = document.querySelector('header')
    const hd = header.getBoundingClientRect()
    const doc = document.documentElement
    // navs: find visible ones and check they're single-line within header
    const navs = [...header.querySelectorAll('nav')].filter(n => getComputedStyle(n).display !== 'none').map(n => {
      const r = n.getBoundingClientRect()
      return { y: Math.round(r.top), h: Math.round(r.height), overflowX: getComputedStyle(n).overflowX }
    })
    const overflowH = doc.scrollWidth > doc.clientWidth
    return { headerH: Math.round(hd.height), navs, horizontalOverflow: overflowH }
  })
  console.log(`${t.name}: header=${state.headerH}px navs=${JSON.stringify(state.navs)} hOverflow=${state.horizontalOverflow} ${state.navs.some(n => n.h > 40) ? '⚠️ WRAPPED' : '✅'}`)
  await p.screenshot({ path: 'shots/fixed-' + t.name.replace(/[^a-z0-9]/gi, '') + '.png' })
  await p.close()
}
await b.close()
