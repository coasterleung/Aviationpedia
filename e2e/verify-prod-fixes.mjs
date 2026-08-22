import { chromium } from 'playwright'
const b = await chromium.launch()
const p = await b.newPage({ viewport: { width: 1440, height: 900 } })
const errors = []
p.on('pageerror', (e) => errors.push(String(e).slice(0, 100)))

await p.goto('https://coasterleung.github.io/Aviationpedia/', { waitUntil: 'networkidle' })
await p.waitForTimeout(2500)
// EN toggle
await p.locator('header button', { hasText: 'EN' }).first().click()
await p.waitForTimeout(800)
const enState = await p.evaluate(() => ({
  h1: document.querySelector('h1')?.textContent,
  logo: document.querySelector('header .font-bold')?.textContent,
}))
console.log('生产 EN:', JSON.stringify(enState))

// Dark mode
await p.evaluate(() => {
  localStorage.setItem('aviation-encyclopedia-ui', JSON.stringify({ state: { lang: 'en', theme: 'dark', compare: [] }, version: 0 }))
})
await p.reload({ waitUntil: 'networkidle' })
await p.waitForTimeout(2500)
const darkState = await p.evaluate(() => {
  const card = document.querySelector('a[href*="/aircraft/"]')
  return { cardBg: card ? getComputedStyle(card).backgroundColor : null }
})
console.log('生产 Dark 卡片:', darkState.cardBg)
console.log('页面错误:', errors)
await b.close()
