GRX PlayChips Poker • Vegas Edition

- Chips-only. No cash. No wagering. No payouts.
- Fully playable: Texas Hold'em (vs CPU), Blackjack (3:2 natural), Slots (5-reel, paytable).
- Realistic graphics: card images, dice, slot symbols; reel spin animation.
- Deploy as static site (no build step).

Run locally:
  Open index.html in a browser (or use a local server: npx serve .)

Deploy:
  - GitHub Pages: Push to main; in repo Settings > Pages, set source to main branch / root. Add .nojekyll in root (included).
  - Netlify: Connect repo; build settings are in netlify.toml (publish: ".", no build command).
  - Vercel: Import repo; output directory is "." (see vercel.json).

Optional:
  - Boot intro video: add assets/video/boot.mp4 (overlay hides automatically if missing).
  - Favicon: favicon.svg in root; PWA manifest.json for installability.

Files:
  - index.html, assets/css/style.css, assets/js/games.js, poker-engine.js, app.js
  - assets/img/cards/ (SVGs), assets/img/dice/ (SVGs), assets/img/slots/ (SVGs)
  - scripts/generate-cards.js, generate-dice.js, generate-slots.js (run with Node to regenerate assets)
