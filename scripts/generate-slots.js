/**
 * Generate slot symbol SVGs into assets/img/slots/
 * Run from repo root: node scripts/generate-slots.js
 */
const fs = require('fs');
const path = require('path');

const OUT_DIR = path.join(__dirname, '..', 'assets', 'img', 'slots');

const symbols = {
  '7': '<text x="50" y="58" font-family="Georgia, serif" font-size="42" font-weight="bold" fill="#e8b923" text-anchor="middle">7</text>',
  'bar': '<text x="50" y="58" font-family="Georgia, serif" font-size="18" font-weight="bold" fill="#fff" text-anchor="middle">BAR</text>',
  'cherry': '<text x="50" y="52" font-size="36" text-anchor="middle">🍒</text>',
  'lemon': '<text x="50" y="52" font-size="36" text-anchor="middle">🍋</text>',
  'bell': '<text x="50" y="52" font-size="36" text-anchor="middle">🔔</text>',
};

function svg(content) {
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="100" height="100">
  <rect width="100" height="100" rx="8" fill="rgba(0,0,0,0.5)" stroke="#e8b923" stroke-width="2"/>
  ${content}
</svg>`;
}

if (!fs.existsSync(OUT_DIR)) fs.mkdirSync(OUT_DIR, { recursive: true });
Object.entries(symbols).forEach(([name, content]) => {
  fs.writeFileSync(path.join(OUT_DIR, name + '.svg'), svg(content));
});
console.log('Generated slot symbol SVGs in ' + OUT_DIR);
