#!/usr/bin/env bash
# ---------------------------------------------------------------------------
# test-no-spotify-refs.sh — Static check that Spotify API code is fully removed.
#
# Verifies that no Spotify Web API references remain in source code,
# while allowing legitimate references (ProviderName type, CSV import,
# Songlink enrichment, spotifyId/spotifyUrl fields, About page copy).
#
# Usage:  bash scripts/test-no-spotify-refs.sh
# ---------------------------------------------------------------------------

set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
PASS=0
FAIL=0

ok()   { PASS=$((PASS + 1)); printf "  \033[32m✓\033[0m %s\n" "$1"; }
fail() { FAIL=$((FAIL + 1)); printf "  \033[31m✗\033[0m %s\n" "$1"; }

echo ""
echo "=== Static checks: Spotify API removal ==="
echo ""

# --- Check 1: No Spotify API URLs in source ---

echo "Check 1: No Spotify API URLs in source files"

SPOTIFY_API_REFS=$(grep -rn "api.spotify.com\|accounts.spotify.com" \
    "$ROOT/src" "$ROOT/app" 2>/dev/null || true)

if [[ -z "$SPOTIFY_API_REFS" ]]; then
    ok "No Spotify API URLs found"
else
    fail "Found Spotify API URLs:"
    echo "$SPOTIFY_API_REFS" | sed 's/^/    /'
fi

echo ""

# --- Check 2: No SpotifyImage/SpotifyArtist/etc. interfaces ---

echo "Check 2: No Spotify interfaces remain"

SPOTIFY_IFACES=$(grep -rn "interface Spotify\|SpotifyAlbumFull\|SpotifySearchPayload\|SpotifyAlbumSimplified" \
    "$ROOT/src" "$ROOT/app" 2>/dev/null || true)

if [[ -z "$SPOTIFY_IFACES" ]]; then
    ok "No Spotify interfaces found"
else
    fail "Found Spotify interfaces:"
    echo "$SPOTIFY_IFACES" | sed 's/^/    /'
fi

echo ""

# --- Check 3: No Spotify token management ---

echo "Check 3: No Spotify token management code"

SPOTIFY_TOKEN=$(grep -rn "spotifyToken\b\|spotifyTokenExpiry\|getSpotifyToken\|SPOTIFY_CLIENT_ID\|SPOTIFY_CLIENT_SECRET" \
    "$ROOT/src" "$ROOT/app" 2>/dev/null || true)

if [[ -z "$SPOTIFY_TOKEN" ]]; then
    ok "No Spotify token/credential references found"
else
    fail "Found Spotify token/credential references:"
    echo "$SPOTIFY_TOKEN" | sed 's/^/    /'
fi

echo ""

# --- Check 4: No Spotify search/fetch functions ---

echo "Check 4: No Spotify search/fetch functions"

SPOTIFY_FUNCS=$(grep -rn "searchSpotifyAlbums\|fetchSpotifyAlbumById\|fetchSpotifyAlbumByTitleArtist\|toSpotifyAlbumDetail\|formatSpotifyArtists\|bestSpotifyImage" \
    "$ROOT/src" "$ROOT/app" 2>/dev/null || true)

if [[ -z "$SPOTIFY_FUNCS" ]]; then
    ok "No Spotify functions found"
else
    fail "Found Spotify functions:"
    echo "$SPOTIFY_FUNCS" | sed 's/^/    /'
fi

echo ""

# --- Check 5: No "spotify" in provider selector options ---

echo "Check 5: No Spotify in provider selector options"

SPOTIFY_OPTION=$(grep -n '"spotify".*label\|label.*"Spotify"' \
    "$ROOT/app/components/SearchBar.tsx" \
    "$ROOT/app/components/print/PrintSearch.tsx" 2>/dev/null || true)

if [[ -z "$SPOTIFY_OPTION" ]]; then
    ok "No Spotify provider option in search bars"
else
    fail "Found Spotify in provider options:"
    echo "$SPOTIFY_OPTION" | sed 's/^/    /'
fi

echo ""

# --- Check 6: .dev.vars.example is deleted ---

echo "Check 6: .dev.vars.example is deleted"

if [[ ! -f "$ROOT/.dev.vars.example" ]]; then
    ok ".dev.vars.example does not exist"
else
    fail ".dev.vars.example still exists"
fi

echo ""

# --- Check 7: Legitimate references still present (sanity check) ---

echo "Check 7: Legitimate spotifyId/spotifyUrl fields still exist"

SPOTIFY_FIELDS=$(grep -rn "spotifyId\|spotifyUrl" \
    "$ROOT/src/index.ts" "$ROOT/app/lib/types.ts" 2>/dev/null || true)

if [[ -n "$SPOTIFY_FIELDS" ]]; then
    ok "spotifyId/spotifyUrl fields still present in types (expected)"
else
    fail "spotifyId/spotifyUrl fields are missing — these should be kept!"
fi

echo ""

# --- Check 8: Songlink enrichment function exists ---

echo "Check 8: Songlink enrichment code exists"

SONGLINK=$(grep -rn "fetchSpotifyIdViaSonglink\|enrich-spotify\|song\.link" \
    "$ROOT/src/index.ts" 2>/dev/null || true)

if [[ -n "$SONGLINK" ]]; then
    ok "Songlink enrichment code found in Worker"
else
    fail "Songlink enrichment code missing from Worker"
fi

FRONTEND_ENRICH=$(grep -rn "enrichWithSpotifyId" \
    "$ROOT/app/lib/api.ts" 2>/dev/null || true)

if [[ -n "$FRONTEND_ENRICH" ]]; then
    ok "enrichWithSpotifyId function found in frontend"
else
    fail "enrichWithSpotifyId function missing from frontend"
fi

echo ""

# --- Check 9: ProviderName still includes "spotify" (for CSV import) ---

echo "Check 9: ProviderName type still includes 'spotify' (for CSV source)"

PROVIDER_TYPE=$(grep -n '"spotify"' "$ROOT/app/lib/types.ts" 2>/dev/null || true)

if [[ -n "$PROVIDER_TYPE" ]]; then
    ok "'spotify' still in ProviderName type (needed for CSV imports)"
else
    fail "'spotify' missing from ProviderName type — CSV imports may break"
fi

echo ""

# --- Summary -------------------------------------------------------------

echo "=== Results: $PASS passed, $FAIL failed ==="
echo ""
if [[ $FAIL -gt 0 ]]; then
    exit 1
fi
