import { chromium } from 'playwright'
const b = await chromium.launch()
const p = await b.newPage({ viewport: { width: 1440, height: 900 } })
const errors = []
p.on('pageerror', (e) => errors.push(String(e).slice(0, 100)))

await p.goto('http://localhost:5173/manufacturers', { waitUntil: 'networkidle' })
await p.waitForTimeout(2000)

// 1. Initial state: how many manufacturers shown
const initial = await p.evaluate(() => document.querySelectorAll('a[href*="mfr="]').length)
console.log('初始显示制造商数:', initial)

// 2. Search "comac"
await p.fill('input[placeholder*="搜索"], input[type="text"]', 'comac')
await p.waitForTimeout(800)
const searchState = await p.evaluate(() => {
  const links = [...document.querySelectorAll('a[href*="mfr="]')]
  return { count: links.length, names: links.map(a => a.textContent.slice(0, 40)) }
})
console.log('搜索 comac:', JSON.stringify(searchState))

// 3. Clear search, select a country (China Q148) from dropdown
await p.fill('input[placeholder*="搜索"], input[type="text"]', '')
await p.waitForTimeout(500)
const countrySelect = await p.$('select')
if (countrySelect) {
  // find the China option
  const options = await p.$$eval('select option', (opts) => opts.map(o => ({ value: o.value, text: o.textContent })))
  const chinaOpt = options.find(o => o.text.includes('China') || o.text.includes('中国') || o.text.includes('Chinese'))
  console.log('中国选项:', chinaOpt)
  if (chinaOpt) {
    await p.selectOption('select', chinaOpt.value)
    await p.waitForTimeout(800)
    const cnState = await p.evaluate(() => {
      const links = [...document.querySelectorAll('a[href*="mfr="]')]
      return { count: links.length, names: links.slice(0, 6).map(a => a.textContent.replace(/\s+/g, ' ').slice(0, 50)) }
    })
    console.log('筛选中国:', JSON.stringify(cnState))
  }
}

// 4. Sort toggle
const sortBtns = await p.$$('button')
if (sortBtns.length >= 2) {
  await sortBtns[1].click()
  await p.waitForTimeout(600)
  const sorted = await p.evaluate(() => {
    const links = [...document.querySelectorAll('a[href*="mfr="]')]
    return links.slice(0, 4).map(a => a.querySelector('.font-medium')?.textContent)
  })
  console.log('按名称排序前几个:', sorted)
}

console.log('页面错误:', errors)
await b.close()
