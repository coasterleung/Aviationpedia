import { chromium } from 'playwright'
const b = await chromium.launch()
const p = await b.newPage({ viewport: { width: 1440, height: 900 } })

const failures = new Map()
p.on('response', (res) => {
  if (res.status() >= 400) {
    const url = res.url()
    failures.set(url, (failures.get(url) ?? 0) + 1)
  }
})
p.on('console', (m) => {
  if (m.type() === 'error') {
    // response status errors don't carry URL; log other console errors
    const t = m.text()
    if (!t.includes('404')) console.log('CONSOLE:', t.slice(0, 150))
  }
})

await p.goto('https://coasterleung.github.io/Aviationpedia/', { waitUntil: 'networkidle' })
await p.waitForTimeout(4000)

console.log('=== 404/error URLs on home page ===')
for (const [url, count] of failures) {
  console.log(`  ${count}x  ${url.slice(0, 110)}`)
}
console.log('total unique failing URLs:', failures.size)

// Navigate to a detail page
await p.goto('https://coasterleung.github.io/Aviationpedia/aircraft/Q5830', { waitUntil: 'networkidle' })
await p.waitForTimeout(4000)
console.log('\n=== after navigating to A380 detail ===')
const extra = new Map()
p.on('response', (res) => {
  if (res.status() >= 400) {
    const url = res.url()
    if (!failures.has(url)) extra.set(url, (extra.get(url) ?? 0) + 1)
  }
})
await p.waitForTimeout(3000)
for (const [url, count] of extra) {
  console.log(`  ${count}x  ${url.slice(0, 110)}`)
}
await b.close()
