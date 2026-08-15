import { chromium } from 'playwright'
import { mkdirSync } from 'node:fs'
import { fileURLToPath } from 'node:url'

const BASE = process.env.BASE_URL ?? 'http://localhost:5173'
const OUT = fileURLToPath(new URL('./shots/', import.meta.url))
mkdirSync(OUT, { recursive: true })

const browser = await chromium.launch()
const results = []

async function testPage(page, name, path, { mobile = false } = {}) {
  const consoleErrors = []
  page.on('console', (msg) => {
    if (msg.type() === 'error') consoleErrors.push(msg.text().slice(0, 200))
  })
  page.on('pageerror', (err) => consoleErrors.push('PAGEERROR: ' + String(err).slice(0, 200)))

  await page.goto(BASE + path, { waitUntil: 'networkidle', timeout: 45000 }).catch(() => {})
  // wait for images to settle
  await page.waitForTimeout(2500)

  // broken image detection
  const broken = await page.evaluate(() => {
    const imgs = [...document.querySelectorAll('img')]
    const brokenImgs = imgs.filter((i) => !i.complete || i.naturalWidth === 0)
    return { total: imgs.length, broken: brokenImgs.length, brokenSrc: brokenImgs.slice(0, 5).map((i) => i.src.slice(0, 90)) }
  })

  const suffix = mobile ? '-mobile' : ''
  const file = OUT + name + suffix + '.png'
  await page.screenshot({ path: file, fullPage: true })

  const entry = {
    name: name + suffix,
    path,
    consoleErrors,
    images: broken,
    screenshot: file,
  }
  results.push(entry)
  console.log(
    `[${entry.name}] imgs=${broken.total} broken=${broken.broken} errors=${consoleErrors.length} -> ${file}`
  )
  if (consoleErrors.length) console.log('   console errors:', consoleErrors.slice(0, 3).join(' | '))
  if (broken.broken) console.log('   broken imgs:', broken.brokenSrc.join(' | '))
}

const context = await browser.newContext({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1 })
const page = await context.newPage()

// --- desktop pages ---
await testPage(page, 'home', '/')
await testPage(page, 'aircraft-list', '/aircraft')
await testPage(page, 'aircraft-a380', '/aircraft/Q5830')
await testPage(page, 'aircraft-737', '/aircraft/Q6387')
await testPage(page, 'airlines-list', '/airlines')
await testPage(page, 'airline-sia', '/airlines/Q32245')
await testPage(page, 'manufacturers', '/manufacturers')
await testPage(page, 'alliances', '/alliances')
await testPage(page, 'codes', '/codes')

// --- favorites flow: star the A380, then check /favorites ---
await page.goto(BASE + '/aircraft/Q5830', { waitUntil: 'networkidle' })
await page.waitForTimeout(800)
const starBtn = page.locator('button[aria-label*="Save"]').first()
if (await starBtn.count()) {
  await starBtn.click()
  await page.waitForTimeout(600)
  await testPage(page, 'favorites', '/favorites')
} else {
  console.log('[favorites] star button not found (aria-label may differ)')
}

// --- compare flow: add 3 aircraft, view /compare ---
for (const id of ['Q6387', 'Q6475', 'Q5830']) {
  await page.goto(BASE + '/aircraft/' + id, { waitUntil: 'networkidle' })
  await page.waitForTimeout(500)
  const cmpBtn = page.locator('button', { hasText: /Compare|对比/ }).first()
  if (await cmpBtn.count()) {
    await cmpBtn.click()
    await page.waitForTimeout(300)
  }
}
await testPage(page, 'compare', '/compare')

// --- mobile pages ---
const mctx = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 })
const mpage = await mctx.newPage()
await testPage(mpage, 'home', '/', { mobile: true })
await testPage(mpage, 'aircraft-list', '/aircraft', { mobile: true })
await testPage(mpage, 'aircraft-a380', '/aircraft/Q5830', { mobile: true })
await testPage(mpage, 'airline-sia', '/airlines/Q32245', { mobile: true })

await browser.close()

// summary
const totalBroken = results.reduce((s, r) => s + r.images.broken, 0)
const totalErrors = results.reduce((s, r) => s + r.consoleErrors.length, 0)
console.log('\n=== SUMMARY ===')
console.log(`pages tested: ${results.length}, broken images: ${totalBroken}, console errors: ${totalErrors}`)
results.forEach((r) => {
  if (r.consoleErrors.length || r.images.broken) {
    console.log(`  ${r.name}: ${r.images.broken} broken imgs, ${r.consoleErrors.length} errors`)
  }
})
