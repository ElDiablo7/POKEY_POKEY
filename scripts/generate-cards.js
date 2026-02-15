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
  <defs>
    <linearGradient id="face" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#fff"/>
      <stop offset="50%" style="stop-color:#fafaf5"/>
      <stop offset="100%" style="stop-color:#f0efe8"/>
    </linearGradient>
    <linearGradient id="goldEdge" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#e8b923"/>
      <stop offset="50%" style="stop-color:#d4a91e"/>
      <stop offset="100%" style="stop-color:#b8901a"/>
    </linearGradient>
    <filter id="shadow" x="-10%" y="-10%" width="120%" height="120%">
      <feDropShadow dx="0" dy="2" stdDeviation="1.5" flood-color="#000" flood-opacity="0.25"/>
    </filter>
  </defs>
  <rect width="80" height="112" rx="12" ry="12" fill="url(#face)" stroke="url(#goldEdge)" stroke-width="2.5" filter="url(#shadow)"/>
  <rect x="4" y="4" width="72" height="104" rx="9" fill="none" stroke="#e8b923" stroke-width="1" opacity="0.5"/>
  <rect x="6" y="6" width="68" height="100" rx="7" fill="none" stroke="rgba(0,0,0,0.08)" stroke-width="0.5"/>
  <text x="10" y="24" font-family="Georgia, serif" font-size="17" font-weight="bold" fill="${color}">${rankLabel}</text>
  <text x="10" y="43" font-family="Georgia, serif" font-size="24" fill="${color}">${suitChar}</text>
  <text x="40" y="70" font-family="Georgia, serif" font-size="40" fill="${color}" text-anchor="middle" font-weight="bold">${suitChar}</text>
  <text x="70" y="106" font-family="Georgia, serif" font-size="17" font-weight="bold" fill="${color}" text-anchor="end" transform="rotate(180 70 106)">${rankLabel}</text>
  <text x="70" y="87" font-family="Georgia, serif" font-size="24" fill="${color}" text-anchor="end" transform="rotate(180 70 87)">${suitChar}</text>
</svg>`;
}

function backSvg() {
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 80 112" width="80" height="112">
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#1a365d"/>
      <stop offset="50%" style="stop-color:#234a75"/>
      <stop offset="100%" style="stop-color:#2c5282"/>
    </linearGradient>
    <linearGradient id="gold" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#e8b923"/>
      <stop offset="50%" style="stop-color:#d4a91e"/>
      <stop offset="100%" style="stop-color:#b8901a"/>
    </linearGradient>
    <filter id="bshadow" x="-10%" y="-10%" width="120%" height="120%">
      <feDropShadow dx="0" dy="2" stdDeviation="2" flood-color="#000" flood-opacity="0.35"/>
    </filter>
  </defs>
  <rect width="80" height="112" rx="12" ry="12" fill="url(#bg)" stroke="url(#gold)" stroke-width="2.5" filter="url(#bshadow)"/>
  <rect x="8" y="12" width="64" height="88" rx="8" fill="none" stroke="rgba(232,185,35,0.4)" stroke-width="2"/>
  <rect x="12" y="16" width="56" height="80" rx="6" fill="none" stroke="rgba(255,255,255,0.08)" stroke-width="1"/>
  <text x="40" y="54" font-family="Georgia, serif" font-size="30" fill="rgba(255,255,255,0.55)" text-anchor="middle">♠</text>
  <text x="40" y="78" font-family="Georgia, serif" font-size="30" fill="rgba(255,255,255,0.55)" text-anchor="middle">♥</text>
  <text x="40" y="102" font-family="Georgia, serif" font-size="18" font-weight="bold" fill="rgba(232,185,35,0.5)" text-anchor="middle">GRX</text>
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
