import { chromium } from 'playwright'
const b = await chromium.launch()
const p = await b.newPage({ viewport: { width: 1440, height: 900 } })

// === Language toggle ===
await p.goto('http://localhost:5173/', { waitUntil: 'networkidle' })
await p.waitForTimeout(1500)
await p.locator('header button', { hasText: 'EN' }).first().click()
await p.waitForTimeout(800)
const en = await p.evaluate(() => ({
  h1: document.querySelector('h1')?.textContent,
  nav: document.querySelector('header nav')?.textContent?.slice(0, 60),
  logo: document.querySelector('header .font-bold')?.textContent,
  htmlLang: document.documentElement.lang,
}))
console.log('=== EN 模式 ===')
console.log(JSON.stringify(en))

// === Dark mode ===
await p.evaluate(() => {
  localStorage.setItem('aviation-encyclopedia-ui', JSON.stringify({ state: { lang: 'en', theme: 'dark', compare: [] }, version: 0 }))
})
await p.goto('http://localhost:5173/', { waitUntil: 'networkidle' })
await p.waitForTimeout(1500)
const dark = await p.evaluate(() => {
  const cards = [...document.querySelectorAll('a[href*="/aircraft/"]')].slice(0, 3).map(a => getComputedStyle(a).backgroundColor)
  const body = getComputedStyle(document.body).backgroundColor
  const inputBg = getComputedStyle(document.querySelector('input')).backgroundColor
  return { bodyBg: body, cardBgs: cards, inputBg }
})
console.log('\n=== Dark 模式 ===')
console.log('body:', dark.bodyBg, '| 卡片:', dark.cardBgs.join(', '), '| 输入框:', dark.inputBg)

// screenshot dark home
await p.screenshot({ path: 'shots/home-dark.png', fullPage: false })
await p.goto('http://localhost:5173/manufacturers', { waitUntil: 'networkidle' })
await p.waitForTimeout(1200)
await p.screenshot({ path: 'shots/manufacturers-dark.png', fullPage: false })
console.log('screenshots saved')
await b.close()
