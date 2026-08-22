import { chromium } from 'playwright'
const b = await chromium.launch()
const p = await b.newPage({ viewport: { width: 1440, height: 900 } })

const errors = []
p.on('console', (m) => {
  if (m.type() === 'error') {
    const loc = m.location()
    errors.push({ text: m.text().slice(0, 120), loc: loc ? loc.url.slice(0, 100) : '?' })
  }
})
p.on('requestfailed', (req) => {
  errors.push({ text: 'REQFAILED: ' + req.url().slice(0, 100), loc: req.failure()?.errorText ?? '?' })
})

await p.goto('https://coasterleung.github.io/Aviationpedia/', { waitUntil: 'networkidle' })
await p.waitForTimeout(5000)

console.log('=== console errors / request failures on HOME (production) ===')
for (const e of errors) console.log(' -', e.text, '| at', e.loc)
console.log('total:', errors.length)

// Now navigate to A380 detail and watch for image loading
await p.goto('https://coasterleung.github.io/Aviationpedia/aircraft/Q5830', { waitUntil: 'networkidle' })
await p.waitForTimeout(5000)
const imgState = await p.evaluate(() => {
  const imgs = [...document.querySelectorAll('img')]
  return { total: imgs.length, states: imgs.map(i => ({ src: i.src.slice(0, 90), complete: i.complete, w: i.naturalWidth })) }
})
console.log('\n=== A380 detail img states ===')
console.log(JSON.stringify(imgState, null, 1))
console.log('\nnew errors after navigation:', errors.length)
for (const e of errors) console.log(' -', e.text, '| at', e.loc)
await b.close()
