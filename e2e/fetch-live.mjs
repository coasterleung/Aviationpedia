/**
 * Live-flight fetch + compact + stateful backoff.
 *
 * Design goals (compliance-friendly):
 *  - Fixed, modest cadence (GHA cron, not a per-minute poll).
 *  - On upstream failure: write a state file (status + nextRetryAt + attempts),
 *    but DO NOT overwrite the previous good flights.json. The front-end keeps
 *    showing the last-known snapshot and flags it stale.
 *  - On the next run, if nextRetryAt is in the future, skip the fetch entirely
 *    (no point hammering the upstream — avoids hitting rate limits).
 *  - State + data live on the `live-data` branch via the caller workflow.
 *
 * Invoked from .github/workflows/live-flights.yml. Run locally:
 *   node e2e/fetch-live.mjs <provider-id> <states-out> <flights-out> [aircraft-db-csv] [state-in] [state-out] [lookup-out]
 */

import { readFileSync, writeFileSync, existsSync } from 'node:fs'
import { fileURLToPath } from 'node:url'

const [, , providerId = 'opensky', statesOut, flightsOut, csvPath, stateIn, stateOut, lookupOut] = process.argv

const BACKOFF_MS = [30 * 60 * 1000, 60 * 60 * 1000, 2 * 60 * 60 * 1000, 4 * 60 * 60 * 1000]

function readJson(path, fallback = null) {
  if (!path || !existsSync(path)) return fallback
  try { return JSON.parse(readFileSync(path, 'utf8')) } catch { return fallback }
}

function writeJson(path, obj) {
  if (path) writeFileSync(path, JSON.stringify(obj))
}

const prevState = readJson(stateIn, {}) || {}

// 1. Backoff gate: if we're still cooling down after a failure, skip upstream.
const nextRetryAt = prevState.nextRetryAt || 0
const now = Date.now()
if (nextRetryAt && nextRetryAt > now) {
  const minsLeft = Math.ceil((nextRetryAt - now) / 60000)
  console.log(`SKIP: cooling down from a prior failure, retry in ~${minsLeft} min`)
  writeJson(stateOut, { ...prevState, lastCheckedAt: now, skipped: true, nextRetryAt })
  process.exit(0)
}

// 2. Fetch upstream via the provider layer.
const { fetchFromProvider } = await import('./live-data-providers.mjs')
let json
try {
  const { provider, json: data } = await fetchFromProvider(providerId)
  json = data
  console.log(`FETCH OK via ${provider.label}: ${(json.states ?? []).length} states`)
} catch (e) {
  // 3. Failure: record exponential backoff, preserve the previous data file.
  const attempts = (prevState.attempts || 0) + 1
  const backoff = BACKOFF_MS[Math.min(attempts - 1, BACKOFF_MS.length - 1)]
  const state = {
    status: 'degraded',
    lastAttemptAt: now,
    lastSuccessAt: prevState.lastSuccessAt || null,
    attempts,
    nextRetryAt: now + backoff,
    source: providerId,
    error: String(e && e.message ? e.message : e),
  }
  writeJson(stateOut, state)
  // If we already have a good snapshot on disk, mark it stale in an accompanying state file
  // (the workflow copies the previous flights.json unchanged, so we only write STATUS here).
  console.error(`FETCH FAILED: ${state.error} | backoff ${Math.round(backoff / 60000)} min | attempts ${attempts}`)
  // Exit 0 on failure so the workflow still pushes the degraded state (backoff persists).
  // The good news: the previous flights.json was already copied aside and is pushed unchanged.
  process.exit(0)
}

// 4. Persist the fetched states so the compact step can read them.
if (statesOut) writeJson(statesOut, json)

// 5. Compact to the front-end schema (also writes the small lookup for the Worker).
const { spawnSync } = await import('node:child_process')
const r = spawnSync(process.execPath, [fileURLToPath(new URL('./compact-flights.mjs', import.meta.url)), statesOut, flightsOut, csvPath || '', providerId], { stdio: 'inherit' })
// compact expects <states-json> <out-json> [csv] [source]; it writes flights.json incl. source.
if (r.status !== 0) {
  console.error('compact step failed')
  process.exit(r.status || 1)
}

// 6. Success: reset the backoff, update state with freshness metadata.
const successState = {
  status: 'ok',
  lastAttemptAt: now,
  lastSuccessAt: now,
  attempted: 0,
  nextRetryAt: 0,
  source: providerId,
  error: null,
  count: json.states?.length ?? 0,
}
writeJson(stateOut, successState)
console.log('state updated: ok, nextRetryAt cleared')

// 6. Emit the compacted files into the branch dir as required by the workflow.
// (The workflow copies flights.json/lookup.json from the runner temp to the branch.)
