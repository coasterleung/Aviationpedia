import { chromium } from 'playwright'
const b = await chromium.launch()
const p = await b.newPage({ viewport: { width: 1440, height: 900 } })
const errors = []
p.on('console', (m) => { if (m.type() === 'error') errors.push(m.text().slice(0, 120)) })
p.on('pageerror', (e) => errors.push('PAGEERROR: ' + String(e).slice(0, 150)))

await p.goto('http://localhost:5173/airlines', { waitUntil: 'networkidle' })
await p.waitForTimeout(3000)

const state = await p.evaluate(() => {
  const h1 = document.querySelector('h1')?.textContent
  const cards = document.querySelectorAll('a[href*="/airlines/"]')
  const firstCard = cards[0]?.outerHTML.slice(0, 400)
  const imgs = document.querySelectorAll('img').length
  const avatars = document.querySelectorAll('[role="img"]:not(img)').length
  return { h1, cards: cards.length, imgs, avatars, firstCard }
})
console.log('state:', JSON.stringify(state, null, 1))
console.log('errors:', errors)
await b.close()
