import { chromium } from 'playwright'

const BASE = process.env.BASE_URL ?? 'http://localhost:5173'
const browser = await chromium.launch()
const results = []

async function checkPage(page, name, path) {
  const consoleErrors = []
  page.on('console', (m) => { if (m.type() === 'error') consoleErrors.push(m.text().slice(0, 150)) })
  page.on('pageerror', (e) => consoleErrors.push('PAGEERROR: ' + String(e).slice(0, 150)))

  await page.goto(BASE + path, { waitUntil: 'networkidle', timeout: 45000 })
  await page.waitForTimeout(1500)

  const check = await page.evaluate(() => {
    const issues = []
    const doc = document.documentElement

    // 1. horizontal overflow
    if (doc.scrollWidth > doc.clientWidth + 2) {
      issues.push('H-OVERFLOW: page ' + doc.scrollWidth + 'px wide, viewport ' + doc.clientWidth + 'px')
    }

    // 2. elements out of viewport width
    const wide = [...document.querySelectorAll('body *')].filter((el) => {
      const r = el.getBoundingClientRect()
      const style = getComputedStyle(el)
      return r.width > 0 && r.width < 4000 && style.position !== 'fixed' && r.right > doc.clientWidth + 8
    }).slice(0, 4).map((el) => {
      const r = el.getBoundingClientRect()
      return el.tagName + '.' + (el.className || '').toString().slice(0, 30) + ' right=' + Math.round(r.right)
    })
    if (wide.length) issues.push('WIDE-ELEMENTS: ' + wide.join(' | '))

    // 3. images actually rendered with size
    const imgs = [...document.querySelectorAll('img')]
    const deadImgs = imgs.filter((i) => i.naturalWidth === 0 || i.naturalHeight === 0 || i.getBoundingClientRect().width < 2)
    if (deadImgs.length) issues.push('DEAD-IMGS: ' + deadImgs.length + ' (total ' + imgs.length + ')')

    // 4. key content presence
    const text = document.body.innerText
    const h1 = document.querySelector('h1')
    return {
      issues,
      h1: h1 ? h1.textContent.slice(0, 50) : null,
      textLen: text.length,
      imgCount: imgs.length,
      liveImgCount: imgs.filter((i) => i.naturalWidth > 0).length,
      path: location.pathname,
    }
  })

  results.push({ name, ...check, consoleErrors })
  console.log(
    `[${name}] ${check.path} h1=${JSON.stringify(check.h1)} text=${check.textLen} imgs=${check.liveImgCount}/${check.imgCount} issues=${check.issues.length ? check.issues.join(' ⚠ ') : 'none'}`
  )
  if (consoleErrors.length) console.log('   console:', consoleErrors.slice(0, 2).join(' | '))
}

const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } })
const page = await ctx.newPage()

const routes = [
  ['home', '/'],
  ['aircraft-list', '/aircraft'],
  ['aircraft-a380', '/aircraft/Q5830'],
  ['aircraft-737', '/aircraft/Q6387'],
  ['airlines-list', '/airlines'],
  ['airline-sia', '/airlines/Q32245'],
  ['manufacturers', '/manufacturers'],
  ['alliances', '/alliances'],
  ['codes', '/codes'],
  ['compare', '/compare'],
  ['favorites', '/favorites'],
]
for (const [name, path] of routes) await checkPage(page, name, path)

// favorites flow with actual click (zh aria-label is 收藏)
await page.goto(BASE + '/aircraft/Q5830', { waitUntil: 'networkidle' })
await page.waitForTimeout(800)
const star = page.locator('button[aria-label="收藏"], button[aria-label="Save"], button[title*="收藏"], button[title*="Save"]').first()
if (await star.count()) {
  await star.click()
  await page.waitForTimeout(600)
  await checkPage(page, 'favorites-after-click', '/favorites')
} else {
  console.log('[favorites-flow] star button not found')
}

// compare flow
for (const id of ['Q6387', 'Q6475']) {
  await page.goto(BASE + '/aircraft/' + id, { waitUntil: 'networkidle' })
  await page.waitForTimeout(400)
  const btn = page.locator('button', { hasText: /Compare|对比/ }).first()
  if (await btn.count()) { await btn.click(); await page.waitForTimeout(250) }
}
await checkPage(page, 'compare-2items', '/compare')

await browser.close()

const issueCount = results.reduce((s, r) => s + r.issues.length, 0)
const errCount = results.reduce((s, r) => s + r.consoleErrors.length, 0)
console.log('\n=== LAYOUT SUMMARY: ' + results.length + ' pages, ' + issueCount + ' layout issues, ' + errCount + ' console errors ===')
results.filter((r) => r.issues.length || r.consoleErrors.length).forEach((r) => {
  console.log(r.name + ':')
  r.issues.forEach((i) => console.log('   ⚠ ' + i))
  r.consoleErrors.forEach((e) => console.log('   ❌ ' + e))
})
