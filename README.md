# Huda — Islamic Companion

A free, offline-first Progressive Web App (PWA) for Muslims. Built with vanilla JS — no frameworks, no build step.

**Live app → [huda-six.vercel.app](https://huda-six.vercel.app)**

---

## Features

- **Quran** — Full Arabic text with English translation, gapless audio playback, auto-scroll, ayah highlighting, bookmarks, tafsir, offline download
- **Prayer Times** — Accurate times based on your location, countdown to next prayer, Qibla compass
- **Dhikr** — Customisable counter with streak tracking
- **Duas** — Categorised collection of authentic duas
- **Reading Plan** — 30-day, 3-month, or 1-year Quran completion plans with progress tracking and streak calendar
- **Learn** — Zakat calculator, Islamic glossary, and more
- **Dark mode** — Full dark theme support
- **Offline** — Works without internet after first load

## Tech Stack

| Layer | Tech |
|---|---|
| Frontend | Vanilla JS, HTML, CSS (no framework) |
| Auth & Database | [Supabase](https://supabase.com) |
| Hosting | [Vercel](https://vercel.com) |
| Audio | [EveryAyah](https://everyayah.com) / [QuranicAudio](https://download.quranicaudio.com) |
| Quran Data | [AlQuran Cloud API](https://alquran.cloud) |
| Prayer Times | [Adhan.js](https://github.com/batoulapps/adhan-js) |

## Getting Started

No build step needed. Clone and open directly in a browser or serve with any static file server.

```bash
git clone https://github.com/Abdurahman936/Huda.git
cd Huda
# open index.html in your browser, or:
npx serve .
```

## Project Structure

```
Huda/
├── index.html          # App shell
├── css/styles.css      # All styles
├── js/
│   ├── app.js          # Global state, routing, shared utilities
│   ├── quran.js        # Quran reader, audio engine, auto-scroll
│   ├── prayer.js       # Prayer times, Qibla compass
│   ├── dhikr.js        # Dhikr counter
│   ├── duas.js         # Duas library
│   ├── plan.js         # Reading plan logic
│   ├── learn.js        # Learn tab (Zakat, glossary)
│   ├── home.js         # Home tab, settings, onboarding
│   ├── auth.js         # Supabase auth
│   └── sync.js         # Cloud sync
├── service-worker.js   # PWA offline caching
└── manifest.json       # PWA manifest
```

## Contributing

Issues and pull requests are welcome.

---

*Built with care. May it be of benefit.*
