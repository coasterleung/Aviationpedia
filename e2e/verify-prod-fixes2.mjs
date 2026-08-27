import { chromium } from 'playwright'
const b = await chromium.launch()
const p = await b.newPage({ viewport: { width: 1440, height: 900 } })
const errors = []
p.on('pageerror', (e) => errors.push(String(e).slice(0, 100)))

await p.goto('https://coasterleung.github.io/Aviationpedia/', { waitUntil: 'networkidle' })
await p.waitForTimeout(3000)
await p.locator('header button', { hasText: 'EN' }).first().click()
await p.waitForTimeout(1000)
const enState = await p.evaluate(() => ({
  h1: document.querySelector('h1')?.textContent,
  logo: document.querySelector('header .font-bold')?.textContent,
  navFirst: document.querySelector('header nav')?.textContent?.slice(0, 30),
}))
console.log('生产 EN:', JSON.stringify(enState))

await p.evaluate(() => {
  localStorage.setItem('aviation-encyclopedia-ui', JSON.stringify({ state: { lang: 'en', theme: 'dark', compare: [] }, version: 0 }))
})
await p.reload({ waitUntil: 'networkidle' })
await p.waitForTimeout(3000)
const darkState = await p.evaluate(() => {
  const card = document.querySelector('a[href*="/aircraft/"]')
  return { cardBg: card ? getComputedStyle(card).backgroundColor : null, bodyBg: getComputedStyle(document.body).backgroundColor }
})
console.log('生产 Dark:', JSON.stringify(darkState))
console.log('页面错误:', errors.length)
await b.close()
