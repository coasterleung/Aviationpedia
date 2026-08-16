import { writeFileSync, readFileSync, statSync } from 'node:fs'

const raw = JSON.parse(readFileSync(process.argv[2], 'utf8'))
const states = (raw.states ?? []).map((s) => [
  s[0], (s[1] ?? '').trim(), s[2] ?? '', s[5], s[6], s[7],
  s[8] === true ? 1 : 0, s[9] ?? null, s[10] ?? null, s[11] ?? null, s[13] ?? null,
])
const out = { fetchedAt: Date.now(), time: raw.time, count: states.length, states }
writeFileSync(process.argv[3], JSON.stringify(out))
console.log('compacted states:', states.length, '| size:', (statSync(process.argv[3]).size / 1024).toFixed(1), 'KB')
