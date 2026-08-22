import { chromium } from 'playwright'
const b = await chromium.launch()
const p = await b.newPage({ viewport: { width: 1440, height: 900 } })

// === Test 1: Language toggle ===
await p.goto('http://localhost:5173/', { waitUntil: 'networkidle' })
await p.waitForTimeout(2000)
const before = await p.evaluate(() => ({
  h1: document.querySelector('h1')?.textContent,
  nav: document.querySelector('nav')?.textContent?.slice(0, 60),
  logo: document.querySelector('header .font-bold')?.textContent,
}))
// Click the EN button (second button in the lang group)
const enBtn = p.locator('header button', { hasText: 'EN' }).first()
await enBtn.click()
await p.waitForTimeout(1000)
const after = await p.evaluate(() => ({
  h1: document.querySelector('h1')?.textContent,
  nav: document.querySelector('nav')?.textContent?.slice(0, 60),
  logo: document.querySelector('header .font-bold')?.textContent,
  bodyLang: document.documentElement.lang,
}))
console.log('=== 语言切换 ===')
console.log('切换前:', JSON.stringify(before))
console.log('切换后:', JSON.stringify(after))

// === Test 2: Dark mode ===
// Set theme via zustand persisted state then reload
await p.evaluate(() => {
  localStorage.setItem('aviation-encyclopedia-ui', JSON.stringify({ state: { lang: 'en', theme: 'dark', compare: [] }, version: 0 }))
})
await p.goto('http://localhost:5173/', { waitUntil: 'networkidle' })
await p.waitForTimeout(2000)
const darkHome = await p.evaluate(() => {
  const html = getComputedStyle(document.documentElement)
  const body = getComputedStyle(document.body)
  const cards = [...document.querySelectorAll('a[href*="/aircraft/"]')].slice(0, 5).map(a => {
    const cs = getComputedStyle(a)
    return { bg: cs.backgroundColor, text: cs.color }
  })
  // find any element with near-white background in dark mode
  const whiteElements = [...document.querySelectorAll('body *')].filter(el => {
    const cs = getComputedStyle(el)
    const m = cs.backgroundColor.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/)
    if (!m) return false
    const [r, g, bl] = [Number(m[1]), Number(m[2]), Number(m[3])]
    return r > 240 && g > 240 && bl > 240 && el.getBoundingClientRect().width > 50
  }).slice(0, 8).map(el => el.tagName + '.' + String(el.className).slice(0, 30))
  return { htmlClass: html.colorScheme, bodyBg: body.backgroundColor, bodyColor: body.color, cards, whiteElements }
})
console.log('\n=== 夜间模式 ===')
console.log('body背景:', darkHome.bodyBg, '| 文字色:', darkHome.bodyColor)
console.log('卡片:', JSON.stringify(darkHome.cards.slice(0, 3)))
console.log('白色元素:', JSON.stringify(darkHome.whiteElements))
await b.close()
