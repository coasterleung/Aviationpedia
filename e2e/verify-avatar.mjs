import { chromium } from 'playwright'
const b = await chromium.launch()
const p = await b.newPage({ viewport: { width: 1440, height: 900 } })

// Airlines list — count avatars vs images
await p.goto('http://localhost:5173/airlines', { waitUntil: 'networkidle' })
await p.waitForTimeout(2500)
const listState = await p.evaluate(() => {
  const imgs = [...document.querySelectorAll('img')]
  const avatars = [...document.querySelectorAll('[role="img"]')].filter(el => !(el instanceof HTMLImageElement))
  return { imgs: imgs.length, avatars: avatars.length, avatarSample: avatars.slice(0, 3).map(a => a.textContent + ' ' + a.className.match(/bg-\w+-\d+/)?.[0]) }
})
console.log('airlines list:', JSON.stringify(listState))

// Airline without image — find one and check its detail page shows avatar
const noImg = await p.evaluate(() => {
  const cards = [...document.querySelectorAll('a[href*="/airlines/"]')]
  const first = cards.find(c => !c.querySelector('img'))
  return first ? first.getAttribute('href') : null
})
console.log('first no-image airline link:', noImg)
if (noImg) {
  await p.goto('http://localhost:5173' + noImg, { waitUntil: 'networkidle' })
  await p.waitForTimeout(2000)
  const detailState = await p.evaluate(() => {
    const h1 = document.querySelector('h1')?.textContent
    const avatars = [...document.querySelectorAll('[role="img"]')].length
    return { h1, avatars }
  })
  console.log('no-image airline detail:', JSON.stringify(detailState))
}
await b.close()
