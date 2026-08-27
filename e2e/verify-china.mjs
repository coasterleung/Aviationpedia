import { chromium } from 'playwright'
const b = await chromium.launch()
const p = await b.newPage({ viewport: { width: 1440, height: 900 } })
await p.goto('http://localhost:5173/manufacturers', { waitUntil: 'networkidle' })
await p.waitForTimeout(2000)

const main = p.locator('main')
await main.locator('select').selectOption('Q148')
await p.waitForTimeout(800)
const count = await main.locator('a[href*="mfr="]').count()
const names = await main.locator('a[href*="mfr="] span.font-medium').allTextContents()
console.log('筛选中国后:', count, JSON.stringify(names))

// header count text check
const header = await main.locator('p').first().textContent()
console.log('统计文本:', header.trim())
await b.close()
