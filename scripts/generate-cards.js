/**
 * Generate 53 card SVGs (52 faces + back) into assets/img/cards/
 * Run from repo root: node scripts/generate-cards.js
 */
const fs = require('fs');
const path = require('path');

const OUT_DIR = path.join(__dirname, '..', 'assets', 'img', 'cards');
const SUIT_MAP = { '♠': 's', '♥': 'h', '♦': 'd', '♣': 'c' };
const RANKS = ['2','3','4','5','6','7','8','9','t','j','q','k','a'];
const SUITS = [
  { char: '♠', code: 's', red: false },
  { char: '♥', code: 'h', red: true },
  { char: '♦', code: 'd', red: true },
  { char: '♣', code: 'c', red: false },
];

function cardSvg(rank, suitChar, isRed) {
  const color = isRed ? '#c41e3a' : '#1a1a1a';
  const rankLabel = rank.toUpperCase() === 'T' ? '10' : rank.toUpperCase();
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 80 112" width="80" height="112">
  <rect width="80" height="112" rx="6" ry="6" fill="#fff" stroke="#333" stroke-width="1.5"/>
  <text x="8" y="22" font-family="Georgia, serif" font-size="14" font-weight="bold" fill="${color}">${rankLabel}</text>
  <text x="8" y="38" font-family="Georgia, serif" font-size="18" fill="${color}">${suitChar}</text>
  <text x="40" y="62" font-family="Georgia, serif" font-size="32" fill="${color}" text-anchor="middle">${suitChar}</text>
  <text x="72" y="102" font-family="Georgia, serif" font-size="14" font-weight="bold" fill="${color}" text-anchor="end" transform="rotate(180 72 102)">${rankLabel}</text>
  <text x="72" y="86" font-family="Georgia, serif" font-size="18" fill="${color}" text-anchor="end" transform="rotate(180 72 86)">${suitChar}</text>
</svg>`;
}

function backSvg() {
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 80 112" width="80" height="112">
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#1a365d"/>
      <stop offset="100%" style="stop-color:#2c5282"/>
    </linearGradient>
  </defs>
  <rect width="80" height="112" rx="6" ry="6" fill="url(#bg)" stroke="#1a365d" stroke-width="1.5"/>
  <rect x="12" y="16" width="56" height="80" rx="4" fill="none" stroke="rgba(255,255,255,0.3)" stroke-width="2"/>
  <text x="40" y="58" font-family="Georgia, serif" font-size="24" fill="rgba(255,255,255,0.5)" text-anchor="middle">♠</text>
  <text x="40" y="78" font-family="Georgia, serif" font-size="24" fill="rgba(255,255,255,0.5)" text-anchor="middle">♥</text>
</svg>`;
}

if (!fs.existsSync(OUT_DIR)) fs.mkdirSync(OUT_DIR, { recursive: true });

const rankFiles = ['2','3','4','5','6','7','8','9','t','j','q','k','a'];
const rankDisplay = (r) => r === 't' ? '10' : r.toUpperCase();
SUITS.forEach(({ char: suitChar, code: suitCode, red }) => {
  rankFiles.forEach((r) => {
    const filename = `${r}${suitCode}.svg`;
    const svg = cardSvg(rankDisplay(r), suitChar, red);
    fs.writeFileSync(path.join(OUT_DIR, filename), svg);
  });
});

fs.writeFileSync(path.join(OUT_DIR, 'back.svg'), backSvg());
console.log('Generated 53 card SVGs in ' + OUT_DIR);
