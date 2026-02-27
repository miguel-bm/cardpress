#!/usr/bin/env bash
# ---------------------------------------------------------------------------
# test-songlink.sh — Verify the Songlink/Odesli API returns Spotify data
# for iTunes URLs and correctly rejects unsupported MusicBrainz URLs.
#
# Usage:  bash scripts/test-songlink.sh
# ---------------------------------------------------------------------------

set -euo pipefail

PASS=0
FAIL=0

ok()   { PASS=$((PASS + 1)); printf "  \033[32m✓\033[0m %s\n" "$1"; }
fail() { FAIL=$((FAIL + 1)); printf "  \033[31m✗\033[0m %s\n" "$1"; }

echo ""
echo "=== Songlink API integration tests ==="
echo ""

# --- Test 1: iTunes URL → Spotify link ----------------------------------

ITUNES_URL="https://music.apple.com/album/1440857781"  # Abbey Road - The Beatles
echo "Test 1: iTunes URL → Songlink → Spotify"

RESP=$(curl -s "https://api.song.link/v1-alpha.1/links?url=$(python3 -c "import urllib.parse; print(urllib.parse.quote('$ITUNES_URL'))")")

SPOTIFY_URL=$(echo "$RESP" | python3 -c "
import sys, json
try:
    d = json.load(sys.stdin)
    url = d.get('linksByPlatform', {}).get('spotify', {}).get('url', '')
    print(url)
except:
    print('')
" 2>/dev/null)

if [[ "$SPOTIFY_URL" == *"open.spotify.com/album/"* ]]; then
    ok "Got Spotify URL: $SPOTIFY_URL"
else
    fail "No Spotify URL returned for iTunes link"
    echo "    Response snippet: ${RESP:0:200}"
fi

# Extract album ID
ALBUM_ID=$(echo "$SPOTIFY_URL" | grep -oE 'album/[a-zA-Z0-9]+' | sed 's/album\///')
if [[ -n "$ALBUM_ID" ]]; then
    ok "Extracted Spotify album ID: $ALBUM_ID"
else
    fail "Could not extract album ID from URL"
fi

echo ""

# --- Test 2: MusicBrainz URL → Songlink rejects (not a supported platform)

MB_URL="https://musicbrainz.org/release/b10b28bc-be5b-3f1d-adac-89799e807fb1"  # Abbey Road
echo "Test 2: MusicBrainz URL → Songlink rejects (expected)"

RESP2_STATUS=$(curl -s -o /dev/null -w "%{http_code}" "https://api.song.link/v1-alpha.1/links?url=$(python3 -c "import urllib.parse; print(urllib.parse.quote('$MB_URL'))")")

if [[ "$RESP2_STATUS" == "400" || "$RESP2_STATUS" == "404" ]]; then
    ok "Songlink rejects MusicBrainz URLs ($RESP2_STATUS) — enrichment skips these"
else
    fail "Expected 400/404 for MusicBrainz URL, got $RESP2_STATUS"
fi

echo ""

# --- Test 3: Non-existent URL → graceful null ---------------------------

echo "Test 3: Invalid URL → no Spotify result (graceful failure)"

RESP3=$(curl -s "https://api.song.link/v1-alpha.1/links?url=https://example.com/not-a-real-album")
STATUS3=$(echo "$RESP3" | python3 -c "
import sys, json
try:
    d = json.load(sys.stdin)
    url = d.get('linksByPlatform', {}).get('spotify', {}).get('url', '')
    print('found' if url else 'empty')
except:
    print('error')
" 2>/dev/null)

if [[ "$STATUS3" == "empty" || "$STATUS3" == "error" ]]; then
    ok "No Spotify URL for invalid input (expected)"
else
    fail "Unexpectedly got a Spotify URL for garbage input"
fi

echo ""

# --- Summary -------------------------------------------------------------

echo "=== Results: $PASS passed, $FAIL failed ==="
echo ""
if [[ $FAIL -gt 0 ]]; then
    exit 1
fi
