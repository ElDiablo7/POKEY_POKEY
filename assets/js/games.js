/**
 * GRX PlayChips Poker • Game definitions and switching
 */
const GAMES = [
  { id: 'holdem', name: "Texas Hold'em", icon: '🃏', desc: '2 hole + 5 community', tagline: 'Online multiplayer • 2 hole + 5 community' },
  { id: 'blackjack', name: 'Blackjack', icon: '🂡', desc: 'Beat the dealer to 21', tagline: 'Beat the dealer to 21' },
  { id: 'slots', name: 'Slots', icon: '🎰', desc: '5-reel Vegas slots', tagline: '5-reel Vegas slots' },
  { id: 'omaha', name: 'Omaha', icon: '♦', desc: '4 hole + 5 community', tagline: '4 hole + 5 community • coming soon' },
  { id: 'stud', name: '7-Card Stud', icon: '♠', desc: 'Classic stud poker', tagline: 'Classic stud • coming soon' },
  { id: 'tourney', name: 'Sit & Go', icon: '🏆', desc: 'Single-table tournament', tagline: 'Single-table • coming soon' },
];

let currentGameId = 'holdem';

function renderGameList() {
  const list = document.getElementById('gameList');
  if (!list) return;
  list.innerHTML = GAMES.map(g => `
    <div class="game-item" data-game="${g.id}" role="button" tabindex="0">
      <span class="game-item-icon">${g.icon}</span>
      <div>
        <div class="game-item-name">${g.name}</div>
        <div class="game-item-desc">${g.desc}</div>
      </div>
    </div>
  `).join('');

  list.querySelectorAll('.game-item').forEach(el => {
    el.addEventListener('click', () => switchGame(el.dataset.game));
    el.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') switchGame(el.dataset.game); });
  });
}

function switchGame(gameId) {
  if (currentGameId === gameId) return;
  currentGameId = gameId;
  const game = GAMES.find(g => g.id === gameId);

  // Update game list active state
  document.querySelectorAll('.game-item').forEach(el => {
    el.classList.toggle('active', el.dataset.game === gameId);
  });

  // Update table wrap
  const tableWrap = document.getElementById('tableWrap');
  if (tableWrap) tableWrap.dataset.gameId = gameId;

  // Update banner
  const bannerIcon = document.getElementById('gameBannerIcon');
  const bannerTitle = document.getElementById('gameBannerTitle');
  const bannerTagline = document.getElementById('gameBannerTagline');
  const bannerMeta = document.getElementById('gameBannerMeta');
  if (bannerIcon) bannerIcon.textContent = game.icon;
  if (bannerTitle) bannerTitle.textContent = game.name;
  if (bannerTagline) bannerTagline.textContent = game.tagline;
  if (bannerMeta) bannerMeta.textContent = 'Stakes: Chips';

  // Show/hide game-specific UI
  const pokerTable = document.getElementById('pokerTable');
  const pokerStatus = document.getElementById('pokerStatus');
  const pokerControls = document.getElementById('pokerControls');
  const blackjackMachine = document.getElementById('blackjackMachine');
  const slotsMachine = document.getElementById('slotsMachine');

  const showPoker = ['holdem', 'omaha', 'stud', 'tourney'].includes(gameId);
  const showBlackjack = gameId === 'blackjack';
  const showSlots = gameId === 'slots';

  if (pokerTable) pokerTable.hidden = !showPoker;
  if (pokerStatus) pokerStatus.hidden = !showPoker;
  if (pokerControls) pokerControls.hidden = !showPoker;
  if (blackjackMachine) blackjackMachine.hidden = !showBlackjack;
  if (slotsMachine) slotsMachine.hidden = !showSlots;

  // Initialize game-specific logic
  if (typeof onGameSwitch === 'function') onGameSwitch(gameId);
}

function getCurrentGameId() {
  return currentGameId;
}

function initGames() {
  renderGameList();
  document.querySelector('.game-item[data-game="holdem"]')?.classList.add('active');
  document.querySelectorAll('.module-tile[data-game]').forEach(el => {
    el.addEventListener('click', () => {
      if (!el.classList.contains('module-coming')) switchGame(el.dataset.game);
    });
  });
}

document.addEventListener('DOMContentLoaded', initGames);
