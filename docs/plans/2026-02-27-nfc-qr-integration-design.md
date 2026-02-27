# NFC & QR Integration Design

## Overview

Transform the album card generator into a complete physical music card system:
print cards with QR codes, attach NFC stickers, and scan to play albums on
a home speaker via Home Assistant.

## Core Architecture: Spotify-ID-as-Tag-ID

The Spotify Album ID is used as the NFC tag identifier. No lookup tables,
no per-album automations, no external state.

**Tag ID format:** `album-spotify-{spotify_album_id}`

Example: `album-spotify-1Ugdi2OTxKopVVqsprp5pb` (Led Zeppelin IV)

The `album-spotify-` prefix namespaces tags by source, allowing future
expansion to other providers (`album-nas-`, `album-amazon-`, etc.).

### Single HA Automation

One automation handles all albums. It extracts the Spotify ID from the tag
and constructs the playback URL dynamically:

```yaml
alias: "NFC – Play Album on Sonos"
description: "Scan any album NFC card to play on Sonos"
triggers:
  - trigger: tag
conditions:
  - condition: template
    value_template: "{{ trigger.tag_id.startswith('album-spotify-') }}"
actions:
  - action: media_player.volume_set
    target:
      entity_id: media_player.salon
    data:
      volume_level: 0.3
  - action: media_player.play_media
    target:
      entity_id: media_player.salon
    data:
      media_content_id: >-
        https://open.spotify.com/album/{{ trigger.tag_id.replace('album-spotify-', '') }}
      media_content_type: music
mode: single
```

Adding a new album: write an NFC tag with the appropriate tag ID. No
automation changes ever.

## QR Code Content Modes

Configurable per-album with a global default.

| Mode           | QR Encodes                                              | Purpose                        |
|----------------|--------------------------------------------------------|--------------------------------|
| `spotify-link` | `https://open.spotify.com/album/{spotify_id}`          | Guest plays on their phone     |
| `ha-tag`       | `https://www.home-assistant.io/tag/album-spotify-{id}` | Trigger HA automation via scan |
| `discogs`      | Discogs URL from album data                            | Album info/marketplace         |
| `title`        | "Title - Artist" (existing)                            | Simple text identification     |
| `custom`       | Free text (existing)                                   | Anything else                  |

Per-album QR override available in the Print page edit modal.

## NFC Tag Writing Workflow

### Write Tags Page

New page in the app alongside Design and Print:

- Shows albums in a checklist with cover art, title, and tag ID
- **Android Chrome:** uses Web NFC API to write tags directly from browser
  (tap "Write" → hold NFC sticker to phone → done)
- **iOS/other:** shows tag ID with copy button for HA Companion app
- Tracks which tags have been written (checkmarks, localStorage)

### Desktop → Phone Handoff

Since cards are designed on desktop but NFC tags are written from a phone:

1. Click "Send to Phone" on the Write Tags page
2. Album list + tag IDs stored in **R2** under a short code (e.g., `x7k9m2`)
3. QR code shown on screen: `https://album-card-generator.domu.workers.dev/write/x7k9m2`
4. Scan with phone → opens Write Tags page with full album list
5. Codes expire after 24 hours, no auth needed

## Data Model Changes

Add to `AlbumDetail`:

```typescript
spotifyId?: string;    // e.g., "1Ugdi2OTxKopVVqsprp5pb"
spotifyUrl?: string;   // e.g., "https://open.spotify.com/album/..."
discogsUrl?: string;   // e.g., "https://www.discogs.com/master/4300"
```

These populate from:
- **CSV import:** extracted from existing `Spotify Album ID` and `Discogs URL` columns
- **Spotify API:** new backend provider for single-album search

## Spotify Web API Integration

Add Spotify as a search/metadata provider in the Worker backend.

- **Auth:** Client Credentials flow (app-level, no user login)
- **Endpoints used:** Search, Album details
- **Returns:** Spotify Album ID, direct URL, track listing
- **Credentials:** stored as Cloudflare Worker secrets

## HA Setup Section

In-app section (settings or dedicated help page):

- Copyable YAML automation template
- Downloadable `.yaml` file
- Customizable fields: speaker entity_id, default volume
- Explanation of the `album-spotify-` prefix convention

## Documentation Updates

- **README:** reframe as a physical music card system with NFC integration
- **About page:** describe the full workflow (design → print → NFC → play)

## Out of Scope

- No HA REST API integration (automation is copy-paste)
- No user accounts or auth
- No non-Spotify sources (prefix convention reserves future space)
- No changes to card visual design or print layout
