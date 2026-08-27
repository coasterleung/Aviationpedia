import { chromium } from 'playwright'
const b = await chromium.launch()
const p = await b.newPage({ viewport: { width: 1440, height: 900 } })
await p.goto('https://coasterleung.github.io/Aviationpedia/airlines', { waitUntil: 'networkidle' })
await p.waitForTimeout(2500)
const state = await p.evaluate(() => ({
  h1: document.querySelector('h1')?.textContent,
  avatars: document.querySelectorAll('[role="img"]:not(img)').length,
  imgs: document.querySelectorAll('img').length,
}))
console.log('production airlines page:', JSON.stringify(state))
await b.close()
