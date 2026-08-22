import { chromium } from 'playwright'
const b = await chromium.launch()
const errors = []

// Test 1: direct load of a deep route (hard refresh scenario)
const p = await b.newPage({ viewport: { width: 1440, height: 900 } })
p.on('console', (m) => { if (m.type() === 'error') errors.push(m.text().slice(0, 80)) })
await p.goto('https://coasterleung.github.io/Aviationpedia/aircraft/Q5830', { waitUntil: 'networkidle' })
await p.waitForTimeout(3000)
const state1 = await p.evaluate(() => {
  const h1 = document.querySelector('h1')
  const imgs = [...document.querySelectorAll('img')]
  return { h1: h1?.textContent, imgs: imgs.length, liveImgs: imgs.filter(i => i.naturalWidth > 0).length }
})
console.log('deep-link /aircraft/Q5830:', JSON.stringify(state1), '| errors:', errors.length)

// Test 2: deep airline link
errors.length = 0
await p.goto('https://coasterleung.github.io/Aviationpedia/airlines/Q32245', { waitUntil: 'networkidle' })
await p.waitForTimeout(3000)
const state2 = await p.evaluate(() => {
  const h1 = document.querySelector('h1')
  const imgs = [...document.querySelectorAll('img')]
  return { h1: h1?.textContent, imgs: imgs.length, liveImgs: imgs.filter(i => i.naturalWidth > 0).length }
})
console.log('deep-link /airlines/Q32245:', JSON.stringify(state2), '| errors:', errors.length)

// Test 3: home
errors.length = 0
await p.goto('https://coasterleung.github.io/Aviationpedia/', { waitUntil: 'networkidle' })
await p.waitForTimeout(2500)
const state3 = await p.evaluate(() => {
  const h1 = document.querySelector('h1')
  const imgs = [...document.querySelectorAll('img')]
  return { h1: h1?.textContent, imgs: imgs.length, liveImgs: imgs.filter(i => i.naturalWidth > 0).length }
})
console.log('home:', JSON.stringify(state3), '| errors:', errors.length)
await b.close()
