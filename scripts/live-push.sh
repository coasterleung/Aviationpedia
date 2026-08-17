#!/bin/bash
# Aviationpedia live flight data pusher
# Fetches OpenSky China-region states + aircraft type/reg, pushes to the live-data branch.
# Runs every 5 minutes via launchd (com.aviationpedia.live).
set -u

REPO="/Users/coasterleung/Documents/plane_ encyclopaedia"
CACHE_DIR="$REPO/.live-cache"
DB="$CACHE_DIR/aircraftDatabase.csv"
WORK="$CACHE_DIR/work"
UA="aviationpedia-local/0.1"

mkdir -p "$CACHE_DIR" "$WORK"

# 1. Fetch OpenSky states (China region)
curl -sS --max-time 30 -H "User-Agent: $UA" \
  "https://opensky-network.org/api/states/all?lamin=18&lomin=73&lamax=54&lomax=135" \
  -o "$WORK/raw.json" || { echo "[$(date -u +%H:%M:%S)] opensky fetch failed"; exit 1; }
SIZE=$(wc -c < "$WORK/raw.json")
if [ "$SIZE" -lt 1000 ]; then
  echo "[$(date -u +%H:%M:%S)] opensky response too small ($SIZE bytes), skip"
  exit 1
fi

# 2. Refresh aircraft database once per day (cache in ~/.aviationpedia-live)
if [ ! -f "$DB" ]; then
  echo "[$(date -u +%H:%M:%S)] downloading aircraft database (90MB, once)..."
  curl -sSL --max-time 300 -H "User-Agent: $UA" \
    "https://opensky-network.org/datasets/metadata/aircraftDatabase.csv" \
    -o "$DB"
elif [ $(find "$DB" -mmin +1440 2>/dev/null | wc -l) -gt 0 ]; then
  echo "[$(date -u +%H:%M:%S)] refreshing aircraft database (daily)..."
  curl -sSL --max-time 300 -H "User-Agent: $UA" \
    "https://opensky-network.org/datasets/metadata/aircraftDatabase.csv" \
    -o "$DB" || echo "[$(date -u +%H:%M:%S)] db refresh failed, keep old"
fi

# 3. Compact + join type/reg
node "$REPO/e2e/compact-flights.mjs" "$WORK/raw.json" "$WORK/flights.json" "$DB" "$WORK/lookup.json" >> "$CACHE_DIR/live.log" 2>&1 || { echo "compact failed"; exit 1; }

# 4. Push to live-data branch (isolated temp repo, force push)
TMP="$WORK/repo"
rm -rf "$TMP"
mkdir -p "$TMP/data"
cp "$WORK/flights.json" "$TMP/data/flights.json"
cp "$WORK/lookup.json" "$TMP/data/lookup.json"
cd "$TMP"
git init -q
git add -f data/
git -c user.name="Aviationpedia Bot" -c user.email="bot@aviationpedia.local" commit -q -m "live data $(date -u +%Y-%m-%dT%H:%M:%SZ)"
git branch -m live-data
git remote add origin git@github.com:coasterleung/Aviationpedia.git
if git push origin live-data --force >> "$CACHE_DIR/live.log" 2>&1; then
  echo "[$(date -u +%H:%M:%S)] pushed $(cat "$WORK/flights.json" | node -e "let d='';process.stdin.on('data',c=>d+=c).on('end',()=>console.log(JSON.parse(d).count))") flights"
else
  echo "[$(date -u +%H:%M:%S)] git push failed (offline?)"
  exit 1
fi
