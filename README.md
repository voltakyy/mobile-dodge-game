# Night Shift — Neon Dodge

[![Play now](https://img.shields.io/badge/play-live-2f7d5a?style=flat-square)](https://voltakyy.github.io/mobile-dodge-game/)
[![HTML5 Canvas](https://img.shields.io/badge/HTML5-Canvas-D9A441?style=flat-square&logo=html5&logoColor=white)](#stack)
[![No build](https://img.shields.io/badge/build-none-197C7A?style=flat-square)](#run-locally)
[![GitHub Pages](https://img.shields.io/badge/deploy-GitHub%20Pages-2f7d5a?style=flat-square&logo=github)](https://voltakyy.github.io/mobile-dodge-game/)

A one-screen endless dodge game set in a quiet neon sky. Slip between falling
sparks, catch light orbs, and keep the run alive as the speed climbs.

Built with plain HTML, CSS, and JavaScript: no framework, no JavaScript
dependencies, and no build step.

**Play:** <https://voltakyy.github.io/mobile-dodge-game/>

## Features

- **Three-lane endless run** with falling hazards and a gradually increasing pace.
- **Light orbs** worth bonus points, plus a distance score that grows over time.
- **Three hull hits** before the run ends.
- **Keyboard, touch, and swipe controls**, including on-screen buttons for phones.
- **Personal best** saved in the browser with `localStorage`.
- **Responsive canvas** that adapts to the viewport, including small phones.
- **Accessible touches**: labelled canvas, live overlay announcements, keyboard
  support, and reduced-motion handling.
- **Zero setup** for players and contributors: open the page and play.

## How to play

| Action | Keyboard | Touch |
| --- | --- | --- |
| Move one lane | `A` / `D` or `←` / `→` | Tap the on-screen arrows, tap the left/right half of the screen, or swipe |
| Start the run | `Enter` or `Space` | **Start the run** |
| Restart after a crash | `Enter` or `Space` | **Run it back** |

Rules:

- Avoid the orange sparks. Each hit costs one hull point.
- Collect green light orbs for **+80 points**.
- Distance adds score continuously; the game gets faster the longer you survive.
- Your best distance is stored locally and shown on the start screen.

## Run locally

No install or build step:

```powershell
start index.html
```

Or serve the folder with any static server:

```bash
npx serve .
# or
python -m http.server 8000
```

The game itself has no backend. The only external request is Google Fonts; if it
is unavailable, the CSS falls back to system fonts and the game still runs.

## Stack

| Part | Technology |
| --- | --- |
| Rendering | HTML5 Canvas 2D |
| Logic | Vanilla JavaScript, `requestAnimationFrame`, delta-time updates |
| Input | Keyboard events + Pointer Events (tap and swipe) |
| Styling | CSS custom properties, responsive layout, reduced-motion query |
| Persistence | `localStorage` key `night-shift-best` |
| Deployment | GitHub Pages via GitHub Actions |

## Structure

```text
index.html                     game shell, HUD, overlay, and controls
style.css                      neon visual system and responsive layout
game.js                        canvas loop, spawning, collisions, input, scoring
.github/workflows/pages.yml    GitHub Pages deployment
```

## Deployment

The workflow in `.github/workflows/pages.yml` publishes the repository root to
GitHub Pages when changes reach `main` (or the game feature branch). The Pages
source must be set to **GitHub Actions**.

Live site: <https://voltakyy.github.io/mobile-dodge-game/>

## Technical notes

- The canvas backing store is capped at 2× device pixel ratio to keep rendering
  sharp without wasting memory on high-DPI phones.
- Layout responds to viewport width and uses `ResizeObserver` to recompute lanes
  when the canvas changes size.
- The best score is optional: if browser storage is blocked, the game remains
  fully playable.
- There is no analytics, account system, or server-side score validation.

## Credits

Game code and visual design by [voltakyy](https://github.com/voltakyy).
Typography uses **Space Grotesk** and **DM Mono** via Google Fonts (SIL Open Font
License).
