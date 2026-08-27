import { writeFileSync, readFileSync, statSync } from 'node:fs'

// args: <states-json> <output-json> [aircraft-db-csv] [source-id]
const statesRaw = JSON.parse(readFileSync(process.argv[2], 'utf8'))
const outPath = process.argv[3]
const csvPath = process.argv[4]
const source = process.argv[5] || 'opensky'

// Build icao24 -> [typeCode, registration] lookup from OpenSky aircraft database
const lookup = new Map()
if (csvPath) {
  const csv = readFileSync(csvPath, 'utf8')
  let i = 0
  let line = 0
  while (i < csv.length) {
    let j = i
    let inQuotes = false
    while (j < csv.length) {
      const c = csv[j]
      if (c === '"') inQuotes = !inQuotes
      else if (c === '\n' && !inQuotes) break
      j++
    }
    const row = csv.slice(i, j)
    i = j + 1
    line++
    if (line === 1) continue
    const fields = []
    let k = 0
    while (k < row.length) {
      if (row[k] === '"') {
        let end = k + 1
        let val = ''
        while (end < row.length) {
          if (row[end] === '"') {
            if (row[end + 1] === '"') { val += '"'; end += 2; continue }
            break
          }
          val += row[end]
          end++
        }
        fields.push(val)
        k = end + 1
        if (row[k] === ',') k++
      } else {
        let end = k
        while (end < row.length && row[end] !== ',') end++
        fields.push(row.slice(k, end))
        k = end + 1
      }
    }
    const icao24 = fields[0]
    if (!icao24) continue
    const reg = fields[1]
    const type = fields[5]
    if (type || reg) lookup.set(icao24.toLowerCase(), [type || '', reg || ''])
  }
  console.log('aircraft db rows:', line - 1, '| lookup entries:', lookup.size)
}

const states = (statesRaw.states ?? []).map((s) => {
  const meta = lookup.get(String(s[0]).toLowerCase())
  return [
    s[0], (s[1] ?? '').trim(), s[2] ?? '', s[5], s[6], s[7],
    s[8] === true ? 1 : 0, s[9] ?? null, s[10] ?? null, s[11] ?? null, s[13] ?? null,
    meta?.[0] ?? null, meta?.[1] ?? null,
  ]
})
const out = {
  fetchedAt: Date.now(),
  time: statesRaw.time,
  count: states.length,
  source,
  sourceLabel: source === 'opensky' ? 'OpenSky Network (ADS-B)' : source,
  stale: false,
  states,
}
writeFileSync(outPath, JSON.stringify(out))
console.log('compacted states:', states.length, '| size:', (statSync(outPath).size / 1024).toFixed(1), 'KB')

// Also emit a small icao24 -> [type, reg] lookup for the current airborne set (for the Worker)
if (process.argv[5]) {
  const lookupOut = {}
  for (const s of states) {
    if (s[11] || s[12]) lookupOut[String(s[0]).toLowerCase()] = [s[11], s[12]]
  }
  writeFileSync(process.argv[5], JSON.stringify(lookupOut))
  console.log('lookup.json:', Object.keys(lookupOut).length, 'entries')
}
