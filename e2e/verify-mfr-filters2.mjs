import { chromium } from 'playwright'
const b = await chromium.launch()
const p = await b.newPage({ viewport: { width: 1440, height: 900 } })
const errors = []
p.on('pageerror', (e) => errors.push(String(e).slice(0, 100)))

await p.goto('http://localhost:5173/manufacturers', { waitUntil: 'networkidle' })
await p.waitForTimeout(2000)

const main = p.locator('main')

// 1. Initial count
console.log('初始:', await main.locator('a[href*="mfr="]').count())

// 2. Search "comac" in the PAGE search box (placeholder 按名称搜索)
await main.locator('input').fill('comac')
await p.waitForTimeout(800)
const searchNames = await main.locator('a[href*="mfr="] span.font-medium').allTextContents()
console.log('搜索 comac:', searchNames.length, JSON.stringify(searchNames))

// 3. Clear + select China country
await main.locator('input').fill('')
await p.waitForTimeout(500)
const options = await main.locator('select option').allTextContents()
console.log('国家选项数:', options.length, '| 含中国的:', options.filter(o => o.includes('中国') || o.includes('China')).slice(0, 3))
// select the China option by matching text
const chinaValue = await main.locator('select option').evaluateAll((opts) => {
  const o = opts.find(x => x.textContent.includes('中国') || x.textContent.includes('China'))
  return o ? o.value : null
})
if (chinaValue) {
  await main.locator('select').selectOption(chinaValue)
  await p.waitForTimeout(800)
  const cnCount = await main.locator('a[href*="mfr="]').count()
  const cnNames = await main.locator('a[href*="mfr="] span.font-medium').allTextContents()
  console.log('筛选中国:', cnCount, JSON.stringify(cnNames.slice(0, 5)))
}

// 4. Sort by name (main 作用域按钮: 第一个是数量, 第二个是名称)
await main.locator('select').selectOption('all').catch(() => {})
await p.waitForTimeout(400)
const sortBtns = main.locator('button')
console.log('sort buttons:', await sortBtns.count())
await sortBtns.nth(1).click() // 按名称
await p.waitForTimeout(600)
const sortedNames = await main.locator('a[href*="mfr="] span.font-medium').allTextContents()
console.log('按名称排序前5:', JSON.stringify(sortedNames.slice(0, 5)))

console.log('页面错误:', errors)
await b.close()
