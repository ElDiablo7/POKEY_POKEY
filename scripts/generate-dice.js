/**
 * Generate 6 dice face SVGs (d1-d6) into assets/img/dice/
 * Run from repo root: node scripts/generate-dice.js
 */
const fs = require('fs');
const path = require('path');

const OUT_DIR = path.join(__dirname, '..', 'assets', 'img', 'dice');
// Pip positions: 1=center, 2=top-left+bottom-right, 3=+center, 4=corners, 5=+center, 6=two columns
const PIPS = {
  1: [[50, 50]],
  2: [[25, 25], [75, 75]],
  3: [[25, 25], [50, 50], [75, 75]],
  4: [[25, 25], [75, 25], [25, 75], [75, 75]],
  5: [[25, 25], [75, 25], [50, 50], [25, 75], [75, 75]],
  6: [[25, 25], [25, 50], [25, 75], [75, 25], [75, 50], [75, 75]],
};

function dieSvg(n) {
  const points = PIPS[n].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="8" fill="#1a1a1a"/>`).join('\n  ');
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="100" height="100">
  <defs>
    <linearGradient id="dice${n}" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#f5f5f5"/>
      <stop offset="100%" style="stop-color:#e0e0e0"/>
    </linearGradient>
    <filter id="shadow">
      <feDropShadow dx="1" dy="1" stdDeviation="1" flood-opacity="0.3"/>
    </filter>
  </defs>
  <rect width="100" height="100" rx="12" ry="12" fill="url(#dice${n})" stroke="#bbb" stroke-width="2" filter="url(#shadow)"/>
  ${points}
</svg>`;
}

if (!fs.existsSync(OUT_DIR)) fs.mkdirSync(OUT_DIR, { recursive: true });
for (let i = 1; i <= 6; i++) {
  fs.writeFileSync(path.join(OUT_DIR, `d${i}.svg`), dieSvg(i));
}
console.log('Generated 6 dice SVGs in ' + OUT_DIR);
