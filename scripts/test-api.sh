#!/usr/bin/env bash
# ---------------------------------------------------------------------------
# test-api.sh — Test Worker API endpoints against a running dev server.
#
# Prerequisites:  pnpm run dev   (in another terminal, on port 8787)
#
# Usage:  bash scripts/test-api.sh [base_url]
#         default base_url = http://127.0.0.1:8787
# ---------------------------------------------------------------------------

set -euo pipefail

BASE="${1:-http://127.0.0.1:8787}"
PASS=0
FAIL=0

ok()   { PASS=$((PASS + 1)); printf "  \033[32m✓\033[0m %s\n" "$1"; }
fail() { FAIL=$((FAIL + 1)); printf "  \033[31m✗\033[0m %s\n" "$1"; }

echo ""
echo "=== API endpoint tests (against $BASE) ==="
echo ""

# --- Connectivity check --------------------------------------------------

echo "Checking server is running..."
if ! curl -sf "$BASE/api/health" > /dev/null 2>&1; then
    echo ""
    echo "  ERROR: Cannot reach $BASE/api/health"
    echo "  Start the dev server first:  pnpm run dev"
    echo ""
    exit 1
fi
ok "Server is reachable"
echo ""

# --- Test 1: Health endpoint (no Spotify provider) -----------------------

echo "Test 1: /api/health — providers should NOT include spotify"

HEALTH=$(curl -sf "$BASE/api/health")
HAS_SPOTIFY=$(echo "$HEALTH" | python3 -c "
import sys, json
d = json.load(sys.stdin)
print('yes' if 'spotify' in d.get('providers', []) else 'no')
")

if [[ "$HAS_SPOTIFY" == "no" ]]; then
    ok "Health endpoint does not list spotify provider"
else
    fail "Health endpoint still lists spotify provider"
    echo "    Response: $HEALTH"
fi

HAS_ITUNES=$(echo "$HEALTH" | python3 -c "
import sys, json
d = json.load(sys.stdin)
print('yes' if 'itunes' in d.get('providers', []) else 'no')
")

if [[ "$HAS_ITUNES" == "yes" ]]; then
    ok "Health endpoint lists itunes provider"
else
    fail "Health endpoint missing itunes provider"
fi

echo ""

# --- Test 2: iTunes search still works -----------------------------------

echo "Test 2: /api/search — iTunes search for 'Abbey Road'"

SEARCH=$(curl -sf "$BASE/api/search?q=Abbey+Road&provider=itunes")
RESULT_COUNT=$(echo "$SEARCH" | python3 -c "
import sys, json
d = json.load(sys.stdin)
print(len(d.get('results', [])))
")

if [[ "$RESULT_COUNT" -gt 0 ]]; then
    ok "iTunes search returned $RESULT_COUNT results"
else
    fail "iTunes search returned no results"
fi

echo ""

# --- Test 3: MusicBrainz search still works ------------------------------

echo "Test 3: /api/search — MusicBrainz search for 'Abbey Road'"

MB_SEARCH=$(curl -sf "$BASE/api/search?q=Abbey+Road&provider=musicbrainz")
MB_COUNT=$(echo "$MB_SEARCH" | python3 -c "
import sys, json
d = json.load(sys.stdin)
print(len(d.get('results', [])))
")

if [[ "$MB_COUNT" -gt 0 ]]; then
    ok "MusicBrainz search returned $MB_COUNT results"
else
    fail "MusicBrainz search returned no results"
fi

echo ""

# --- Test 4: Spotify search is gone --------------------------------------

echo "Test 4: /api/search — Spotify provider should fall through to auto"

SP_SEARCH=$(curl -sf "$BASE/api/search?q=Abbey+Road&provider=spotify")
SP_PROVIDER=$(echo "$SP_SEARCH" | python3 -c "
import sys, json
d = json.load(sys.stdin)
print(d.get('provider', ''))
")

# parseProvider no longer recognizes "spotify", so it falls back to "itunes"
if [[ "$SP_PROVIDER" == "itunes" ]]; then
    ok "Spotify provider param falls back to itunes (expected)"
else
    fail "Unexpected provider value: $SP_PROVIDER"
fi

echo ""

# --- Test 5: Album fetch by ID (iTunes) ----------------------------------

echo "Test 5: /api/album — Fetch iTunes album by ID"

# Get the first album ID from our search
ALBUM_ID=$(echo "$SEARCH" | python3 -c "
import sys, json
d = json.load(sys.stdin)
results = d.get('results', [])
print(results[0]['id'] if results else '')
")

if [[ -n "$ALBUM_ID" ]]; then
    ALBUM=$(curl -sf "$BASE/api/album?id=$ALBUM_ID&provider=itunes")
    ALBUM_TITLE=$(echo "$ALBUM" | python3 -c "
import sys, json
d = json.load(sys.stdin)
print(d.get('album', {}).get('title', ''))
")
    if [[ -n "$ALBUM_TITLE" ]]; then
        ok "Fetched album: $ALBUM_TITLE"
    else
        fail "Album fetch returned no title"
    fi
else
    fail "No album ID to test with (search returned empty)"
fi

echo ""

# --- Test 6: Songlink enrichment endpoint --------------------------------

echo "Test 6: /api/enrich-spotify — Enrich iTunes URL via Songlink"

ENRICH_URL="https://music.apple.com/album/1440857781"
ENRICH=$(curl -sf "$BASE/api/enrich-spotify?url=$(python3 -c "import urllib.parse; print(urllib.parse.quote('$ENRICH_URL'))")")

SPOTIFY_ID=$(echo "$ENRICH" | python3 -c "
import sys, json
d = json.load(sys.stdin)
sp = d.get('spotify')
print(sp.get('spotifyId', '') if sp else '')
")

if [[ -n "$SPOTIFY_ID" ]]; then
    ok "Songlink enrichment returned spotifyId: $SPOTIFY_ID"
else
    fail "Songlink enrichment returned no spotifyId"
    echo "    Response: $ENRICH"
fi

SPOTIFY_URL=$(echo "$ENRICH" | python3 -c "
import sys, json
d = json.load(sys.stdin)
sp = d.get('spotify')
print(sp.get('spotifyUrl', '') if sp else '')
")

if [[ "$SPOTIFY_URL" == *"open.spotify.com/album/"* ]]; then
    ok "Songlink enrichment returned spotifyUrl: $SPOTIFY_URL"
else
    fail "Songlink enrichment returned no valid spotifyUrl"
fi

echo ""

# --- Test 6b: Songlink enrichment via title+artist (MusicBrainz path) ----

echo "Test 6b: /api/enrich-spotify — Enrich via title+artist (MusicBrainz path)"

ENRICH_TA=$(curl -sf "$BASE/api/enrich-spotify?title=Abbey+Road&artist=The+Beatles")

SPOTIFY_ID_TA=$(echo "$ENRICH_TA" | python3 -c "
import sys, json
d = json.load(sys.stdin)
sp = d.get('spotify')
print(sp.get('spotifyId', '') if sp else '')
")

if [[ -n "$SPOTIFY_ID_TA" ]]; then
    ok "Title+artist enrichment returned spotifyId: $SPOTIFY_ID_TA"
else
    fail "Title+artist enrichment returned no spotifyId"
    echo "    Response: $ENRICH_TA"
fi

echo ""

# --- Test 7: Songlink enrichment with missing params --------------------

echo "Test 7: /api/enrich-spotify — Missing all params returns 400"

ENRICH_ERR_STATUS=$(curl -s -o /dev/null -w "%{http_code}" "$BASE/api/enrich-spotify")

if [[ "$ENRICH_ERR_STATUS" == "400" ]]; then
    ok "Missing url param returns 400"
else
    fail "Expected 400, got $ENRICH_ERR_STATUS"
fi

echo ""

# --- Test 8: Songlink enrichment with nonsense URL ----------------------

echo "Test 8: /api/enrich-spotify — Unknown URL returns null spotify"

ENRICH_NULL=$(curl -sf "$BASE/api/enrich-spotify?url=$(python3 -c "import urllib.parse; print(urllib.parse.quote('https://example.com/not-an-album'))")")

NULL_RESULT=$(echo "$ENRICH_NULL" | python3 -c "
import sys, json
d = json.load(sys.stdin)
print('null' if d.get('spotify') is None else 'not-null')
")

if [[ "$NULL_RESULT" == "null" ]]; then
    ok "Unknown URL returns { spotify: null }"
else
    fail "Expected null spotify, got: $ENRICH_NULL"
fi

echo ""

# --- Test 9: Share endpoint still works ----------------------------------

echo "Test 9: /api/share — POST still works"

SHARE_RESP=$(curl -sf -X POST "$BASE/api/share" \
    -H "Content-Type: application/json" \
    -d '{"albums":[{"id":"123","title":"Test","artist":"Test","coverUrl":null,"releaseDate":null,"tracks":[],"source":"itunes","spotifyId":"abc123"}]}')

SHARE_CODE=$(echo "$SHARE_RESP" | python3 -c "
import sys, json
d = json.load(sys.stdin)
print(d.get('code', ''))
" 2>/dev/null)

if [[ -n "$SHARE_CODE" ]]; then
    ok "Share POST returned code: $SHARE_CODE"

    # Retrieve it
    SHARE_GET=$(curl -sf "$BASE/api/share/$SHARE_CODE")
    SHARE_TITLE=$(echo "$SHARE_GET" | python3 -c "
import sys, json
d = json.load(sys.stdin)
print(d[0].get('title', '') if isinstance(d, list) and d else '')
")
    if [[ "$SHARE_TITLE" == "Test" ]]; then
        ok "Share GET /api/share/$SHARE_CODE returned correct data"
    else
        fail "Share GET returned unexpected data"
    fi
else
    # Share bucket may not be configured locally — that's OK
    SHARE_STATUS=$(curl -s -o /dev/null -w "%{http_code}" -X POST "$BASE/api/share" \
        -H "Content-Type: application/json" \
        -d '{"albums":[{"id":"1","title":"T","artist":"A","coverUrl":null,"releaseDate":null,"tracks":[],"source":"itunes"}]}')
    if [[ "$SHARE_STATUS" == "503" ]]; then
        ok "Share returns 503 (bucket not configured locally — expected)"
    else
        fail "Share POST returned unexpected status: $SHARE_STATUS"
    fi
fi

echo ""

# --- Summary -------------------------------------------------------------

echo "=== Results: $PASS passed, $FAIL failed ==="
echo ""
if [[ $FAIL -gt 0 ]]; then
    exit 1
fi
