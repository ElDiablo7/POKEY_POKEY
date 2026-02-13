/**
 * GRX PlayChips Poker • Vegas Edition - Main app
 */

(function () {
  const STORAGE_KEYS = {
    name: 'grx_player_name',
    wallet: 'grx_wallet_chips',
    table: 'grx_table_chips',
    daily: 'grx_daily_claimed',
    theme: 'grx_theme',
  };

  let walletChips = 10000;
  let tableChips = 2000;
  let bankerFriendly = false;
  let pokerDeck = [];
  let playerHand = [];
  let communityCards = [];

  function loadState() {
    const name = localStorage.getItem(STORAGE_KEYS.name);
    if (name) document.getElementById('playerName').textContent = name;
    const w = localStorage.getItem(STORAGE_KEYS.wallet);
    if (w != null) walletChips = parseInt(w, 10);
    const t = localStorage.getItem(STORAGE_KEYS.table);
    if (t != null) tableChips = parseInt(t, 10);
    const theme = localStorage.getItem(STORAGE_KEYS.theme);
    if (theme === 'day') document.body.classList.add('day-theme');
    updateChipDisplays();
  }

  function saveState() {
    localStorage.setItem(STORAGE_KEYS.wallet, String(walletChips));
    localStorage.setItem(STORAGE_KEYS.table, String(tableChips));
  }

  function updateChipDisplays() {
    const chipBalance = document.getElementById('chipBalance');
    const chipValue = chipBalance?.querySelector('.chip-value');
    if (chipValue) {
      chipValue.textContent = walletChips.toLocaleString();
      chipValue.dataset.value = walletChips;
    }
    const youStack = document.getElementById('youStack');
    if (youStack) youStack.textContent = tableChips.toLocaleString();
    const inpWallet = document.getElementById('inpStartChips');
    const inpStack = document.getElementById('inpStack');
    if (inpWallet) inpWallet.value = walletChips;
    if (inpStack) inpStack.value = tableChips;
  }

  function toast(msg) {
    const container = document.getElementById('toastContainer');
    if (!container) return;
    const el = document.createElement('div');
    el.className = 'toast';
    el.textContent = msg;
    container.appendChild(el);
    setTimeout(() => el.remove(), 3000);
  }

  function log(msg) {
    const logEl = document.getElementById('activityLog');
    if (!logEl) return;
    const item = document.createElement('div');
    item.className = 'log-item';
    item.textContent = msg;
    logEl.appendChild(item);
    logEl.scrollTop = logEl.scrollHeight;
  }

  function setBankerLine(text) {
    const el = document.getElementById('bankerLine');
    if (el) el.textContent = `"${text}"`;
  }

  // Boot video
  function initBootVideo() {
    const overlay = document.getElementById('bootVideoOverlay');
    const video = document.getElementById('bootVideo');
    const btnSkip = document.getElementById('btnSkipBoot');
    const btnUnmute = document.getElementById('btnBootUnmute');

    const hideOverlay = () => {
      overlay?.classList.add('hidden');
      overlay?.setAttribute('aria-hidden', 'true');
      setTimeout(() => { overlay.style.display = 'none'; }, 500);
    };

    const fallback = setTimeout(hideOverlay, 2000);
    video?.addEventListener('ended', hideOverlay);
    video?.addEventListener('error', hideOverlay);
    video?.addEventListener('canplay', () => clearTimeout(fallback));
    btnSkip?.addEventListener('click', () => { clearTimeout(fallback); hideOverlay(); });
    btnUnmute?.addEventListener('click', () => {
      if (video) video.muted = false;
      if (btnUnmute) btnUnmute.textContent = '🔊';
    });
  }

  // Modals
  function initModals() {
    const helpModal = document.getElementById('helpModal');
    const settingsModal = document.getElementById('settingsModal');
    document.getElementById('btnHelp')?.addEventListener('click', () => helpModal?.showModal());
    document.getElementById('btnSettings')?.addEventListener('click', () => settingsModal?.showModal());
    document.getElementById('btnCloseHelp')?.addEventListener('click', () => helpModal?.close());
    document.getElementById('btnCloseSettings')?.addEventListener('click', () => settingsModal?.close());
    helpModal?.addEventListener('click', (e) => { if (e.target === helpModal) helpModal.close(); });
    settingsModal?.addEventListener('click', (e) => { if (e.target === settingsModal) settingsModal.close(); });
  }

  // Chip actions
  function initChips() {
    document.getElementById('chipBalance')?.addEventListener('click', () => {
      navigator.clipboard?.writeText(String(walletChips)).then(() => toast('Chips value copied!'));
    });

    document.getElementById('btnRequestChips')?.addEventListener('click', () => {
      const amt = 500 + Math.floor(Math.random() * 500);
      walletChips += amt;
      saveState();
      updateChipDisplays();
      setBankerLine(bankerFriendly ? "Here you go, champ. Enjoy!" : "Fine. Take your chips and go.");
      log(`Banker gave you ${amt} chips.`);
      toast(`+${amt} chips`);
    });

    document.getElementById('btnDailyBonus')?.addEventListener('click', () => {
      const last = localStorage.getItem(STORAGE_KEYS.daily);
      const now = Date.now();
      if (last && now - parseInt(last, 10) < 24 * 60 * 60 * 1000) {
        toast('Daily bonus available in 24h');
        return;
      }
      localStorage.setItem(STORAGE_KEYS.daily, String(now));
      walletChips += 1000;
      saveState();
      updateChipDisplays();
      log('Daily bonus: +1000 chips');
      toast('Daily bonus: +1000 chips');
    });

    document.getElementById('btnToTable')?.addEventListener('click', () => {
      const amt = Math.min(500, walletChips);
      if (amt <= 0) { toast('No chips in wallet'); return; }
      walletChips -= amt;
      tableChips += amt;
      saveState();
      updateChipDisplays();
      toast(`Moved ${amt} to table`);
    });

    document.getElementById('btnToWallet')?.addEventListener('click', () => {
      const amt = Math.min(500, tableChips);
      if (amt <= 0) { toast('No chips on table'); return; }
      tableChips -= amt;
      walletChips += amt;
      saveState();
      updateChipDisplays();
      toast(`Moved ${amt} to wallet`);
    });
  }

  // Banker
  function initBanker() {
    document.getElementById('btnCompliment')?.addEventListener('click', () => {
      setBankerLine(bankerFriendly ? "You're too kind!" : "Flattery won't work. ...Okay, maybe a little.");
      log('You complimented the banker.');
    });

    document.getElementById('btnGrovel')?.addEventListener('click', () => {
      setBankerLine(bankerFriendly ? "No need to grovel. I've got you." : "Pathetic. I love it. Here, take 200.");
      if (!bankerFriendly) {
        walletChips += 200;
        saveState();
        updateChipDisplays();
        log('Banker gave 200 chips (grovel).');
      }
    });

    document.getElementById('btnBankerMode')?.addEventListener('click', () => {
      bankerFriendly = !bankerFriendly;
      setBankerLine(bankerFriendly ? "Hey friend! Need chips? I've got you covered." : "You want chips? Make me laugh.");
      document.getElementById('btnBankerMode').textContent = bankerFriendly ? 'Toggle Banker Mood (Friendly)' : 'Toggle Banker Mood';
    });

    document.getElementById('btnClearLog')?.addEventListener('click', () => {
      const logEl = document.getElementById('activityLog');
      if (logEl) logEl.innerHTML = '';
    });
  }

  // Poker
  function dealPokerHand() {
    if (typeof createDeck === 'undefined' || typeof shuffle === 'undefined') return;
    pokerDeck = shuffle(createDeck());
    playerHand = pokerDeck.splice(0, 5);
    communityCards = [];
    renderPokerHand();
    renderCommunityCards();
    updatePokerStatus();
  }

  function renderPokerHand() {
    const hand = document.getElementById('playerHand');
    if (!hand) return;
    const slots = hand.querySelectorAll('.cardface');
    for (let i = 0; i < 5; i++) {
      const slot = slots[i];
      if (!slot) continue;
      slot.style.display = i < playerHand.length ? 'flex' : 'none';
      slot.classList.remove('card-back');
      const front = slot.querySelector('.card-front');
      if (front && playerHand[i]) {
        front.innerHTML = typeof formatCard === 'function' ? formatCard(playerHand[i]) : playerHand[i].rank + playerHand[i].suit;
      }
    }
    // Hold'em uses 2 hole cards; hide 3–5
    if (typeof getCurrentGameId === 'function' && getCurrentGameId() === 'holdem') {
      slots[2]?.style.setProperty('display', 'none');
      slots[3]?.style.setProperty('display', 'none');
    }
  }

  function renderCommunityCards() {
    for (let i = 1; i <= 5; i++) {
      const slot = document.getElementById('c' + i);
      if (!slot) continue;
      const card = communityCards[i - 1];
      if (card) {
        slot.classList.add('has-card');
        slot.innerHTML = typeof formatCard === 'function' ? formatCard(card) : card.rank + card.suit;
      } else {
        slot.classList.remove('has-card');
        slot.textContent = '';
      }
    }
  }

  function quickDeal() {
    if (typeof createDeck === 'undefined' || typeof shuffle === 'undefined') return;
    pokerDeck = shuffle(createDeck());
    playerHand = pokerDeck.splice(0, 2);
    communityCards = pokerDeck.splice(0, 5);
    renderPokerHand();
    renderCommunityCards();
    updatePokerStatus();
  }

  function updatePokerStatus() {
    const potEl = document.getElementById('pokerPot');
    const betEl = document.getElementById('pokerCurrentBet');
    const roundEl = document.getElementById('pokerRound');
    if (potEl) potEl.textContent = '0';
    if (betEl) betEl.textContent = '0';
    if (roundEl && communityCards.length > 0) {
      const ev = typeof bestHand === 'function' ? bestHand([...playerHand, ...communityCards]) : null;
      roundEl.textContent = ev ? ev.name : '—';
    } else if (roundEl) {
      roundEl.textContent = '—';
    }
  }

  function resetPokerTable() {
    playerHand = [];
    communityCards = [];
    for (let i = 1; i <= 5; i++) {
      const slot = document.getElementById('c' + i);
      if (slot) { slot.classList.remove('has-card'); slot.textContent = ''; }
    }
    const hand = document.getElementById('playerHand');
    hand?.querySelectorAll('.cardface').forEach((s, i) => {
      s.style.display = i < 2 ? 'flex' : 'none';
      s.classList.add('card-back');
      const f = s.querySelector('.card-front');
      if (f) f.textContent = '?';
    });
    const potEl = document.getElementById('pokerPot');
    const betEl = document.getElementById('pokerCurrentBet');
    if (potEl) potEl.textContent = '0';
    if (betEl) betEl.textContent = '0';
    document.getElementById('pokerRound').textContent = '—';
  }

  function initPoker() {
    document.getElementById('btnPokerDeal')?.addEventListener('click', () => {
      if (typeof getCurrentGameId === 'function' && getCurrentGameId() === 'holdem') quickDeal();
      else dealPokerHand();
    });
    document.getElementById('btnResetTable')?.addEventListener('click', resetPokerTable);
    document.getElementById('btnPokerFold')?.addEventListener('click', () => toast('Folded'));
    document.getElementById('btnPokerCheck')?.addEventListener('click', () => toast('Check'));
    document.getElementById('btnPokerCall')?.addEventListener('click', () => toast('Call'));
    document.getElementById('btnPokerRaise')?.addEventListener('click', () => toast('Raise'));
  }

  // Blackjack
  let bjDeck = [];
  let bjPlayerHand = [];
  let bjDealerHand = [];
  let bjBet = 0;
  let bjBalance = 0;
  let bjDealt = false;

  function bjTotal(hand) {
    let total = 0;
    let aces = 0;
    for (const c of hand) {
      if (c.rank === 'A') aces++;
      else if (['K', 'Q', 'J', 'T'].includes(c.rank)) total += 10;
      else total += parseInt(c.rank, 10);
    }
    total += aces;
    while (aces > 0 && total + 10 <= 21) { total += 10; aces--; }
    return total;
  }

  function bjRender() {
    const pH = document.getElementById('bjPlayerHand');
    const dH = document.getElementById('bjDealerHand');
    const pT = document.getElementById('bjPlayerTotal');
    const dT = document.getElementById('bjDealerTotal');
    const bal = document.getElementById('bjBalance');
    if (pH) pH.innerHTML = bjPlayerHand.map(c => `<span class="blackjack-card">${c.rank}${c.suit}</span>`).join('');
    if (dH) dH.innerHTML = bjDealerHand.map((c, i) =>
      `<span class="blackjack-card ${!bjDealt && i === 1 ? 'hidden' : ''}">${c.rank}${c.suit}</span>`
    ).join('');
    if (pT) pT.textContent = bjTotal(bjPlayerHand);
    if (dT) dT.textContent = bjDealt ? bjTotal(bjDealerHand) : (bjDealerHand[0] ? bjTotal([bjDealerHand[0]]) : '');
    if (bal) bal.textContent = bjBalance.toLocaleString();
  }

  function bjDeal() {
    if (bjBet <= 0) { toast('Place a bet first'); return; }
    if (bjBalance < bjBet) { toast('Not enough chips'); return; }
    if (typeof createDeck === 'undefined' || typeof shuffle === 'undefined') return;
    bjDeck = shuffle(createDeck());
    bjPlayerHand = bjDeck.splice(0, 2);
    bjDealerHand = bjDeck.splice(0, 2);
    bjBalance -= bjBet;
    bjDealt = true;
    saveState();
    walletChips = bjBalance;
    document.getElementById('btnBjDeal').disabled = true;
    document.getElementById('btnBjHit').disabled = false;
    document.getElementById('btnBjStand').disabled = false;
    document.getElementById('btnBjDouble').disabled = bjPlayerHand.length !== 2 || bjBalance < bjBet;
    bjRender();
    if (bjTotal(bjPlayerHand) === 21) bjStand();
  }

  function bjHit() {
    if (!bjDealt || bjTotal(bjPlayerHand) >= 21) return;
    bjPlayerHand.push(bjDeck.shift());
    bjRender();
    if (bjTotal(bjPlayerHand) > 21) bjStand();
  }

  function bjStand() {
    if (!bjDealt) return;
    document.getElementById('btnBjHit').disabled = true;
    document.getElementById('btnBjStand').disabled = true;
    document.getElementById('btnBjDouble').disabled = true;
    while (bjTotal(bjDealerHand) < 17) bjDealerHand.push(bjDeck.shift());
    bjDealt = false;
    bjRender();
    const pT = bjTotal(bjPlayerHand);
    const dT = bjTotal(bjDealerHand);
    let result = '';
    if (pT > 21) result = 'Bust! You lose.';
    else if (dT > 21) { result = 'Dealer busts! You win!'; bjBalance += bjBet * 2; }
    else if (pT > dT) { result = 'You win!'; bjBalance += bjBet * 2; }
    else if (dT > pT) result = 'Dealer wins.';
    else { result = 'Push.'; bjBalance += bjBet; }
    document.getElementById('bjResult').textContent = result;
    document.getElementById('btnBjDeal').disabled = false;
    walletChips = bjBalance;
    saveState();
    updateChipDisplays();
    toast(result);
  }

  function initBlackjack() {
    bjBalance = walletChips;
    bjBet = 100;
    document.querySelector('.blackjack-bet-btn[data-bet="100"]')?.classList.add('primary');
    bjRender();
    document.querySelectorAll('.blackjack-bet-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.blackjack-bet-btn').forEach(b => b.classList.remove('primary'));
        btn.classList.add('primary');
        bjBet = parseInt(btn.dataset.bet, 10);
      });
    });
    document.getElementById('btnBjDeal')?.addEventListener('click', bjDeal);
    document.getElementById('btnBjHit')?.addEventListener('click', bjHit);
    document.getElementById('btnBjStand')?.addEventListener('click', bjStand);
    document.getElementById('btnBjDouble')?.addEventListener('click', () => {
      if (bjPlayerHand.length !== 2 || bjBalance < bjBet) return;
      bjBalance -= bjBet;
      bjBet *= 2;
      bjPlayerHand.push(bjDeck.shift());
      bjRender();
      bjStand();
    });
  }

  // Slots
  const SLOT_SYMBOLS = ['7', 'BAR', 'cherry', 'lemon', 'bell'];
  let slotsBalance = 0;
  let slotsBet = 100;
  let slotsSpinning = false;

  function slotsSpin() {
    if (slotsSpinning || slotsBalance < slotsBet) return;
    slotsSpinning = true;
    slotsBalance -= slotsBet;
    document.getElementById('btnSlotsSpin').disabled = true;
    const reels = [1, 2, 3, 4, 5].map(() => SLOT_SYMBOLS[Math.floor(Math.random() * SLOT_SYMBOLS.length)]);
    const disp = { '7': '7', 'BAR': 'BAR', 'cherry': '🍒', 'lemon': '🍋', 'bell': '🔔' };
    [1, 2, 3, 4, 5].forEach((i, idx) => {
      const reel = document.getElementById('slotsReel' + i);
      if (reel) {
        const sym = reel.querySelector('.slots-sym');
        if (sym) {
          sym.textContent = disp[reels[idx]] || reels[idx];
          sym.dataset.sym = reels[idx];
        }
      }
    });
    const allSame = reels.every(s => s === reels[0]);
    const three7 = reels.filter(s => s === '7').length >= 3;
    let win = 0;
    if (allSame) win = slotsBet * 10;
    else if (three7) win = slotsBet * 5;
    else if (reels.filter(s => s === 'cherry').length >= 3) win = slotsBet * 3;
    slotsBalance += win;
    document.getElementById('slotsResult').textContent = win > 0 ? `Win: ${win} chips!` : 'No win';
    walletChips = slotsBalance;
    saveState();
    updateChipDisplays();
    slotsSpinning = false;
    document.getElementById('btnSlotsSpin').disabled = slotsBalance < slotsBet;
  }

  function initSlots() {
    slotsBalance = walletChips;
    slotsBet = 100;
    document.querySelector('.slots-bet-btn[data-bet="100"]')?.classList.add('primary');
    document.getElementById('slotsBalance').textContent = slotsBalance.toLocaleString();
    document.querySelectorAll('.slots-bet-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.slots-bet-btn').forEach(b => b.classList.remove('primary'));
        btn.classList.add('primary');
        slotsBet = parseInt(btn.dataset.bet, 10);
        document.getElementById('btnSlotsSpin').disabled = slotsBalance < slotsBet;
      });
    });
    document.getElementById('btnSlotsSpin')?.addEventListener('click', slotsSpin);
  }

  function onGameSwitch(gameId) {
    if (gameId === 'blackjack') {
      bjBalance = walletChips;
      bjRender();
    } else if (gameId === 'slots') {
      slotsBalance = walletChips;
      document.getElementById('slotsBalance').textContent = slotsBalance.toLocaleString();
      document.getElementById('btnSlotsSpin').disabled = slotsBalance < 50;
    }
  }
  window.onGameSwitch = onGameSwitch;

  // Settings
  function initSettings() {
    const inpName = document.getElementById('inpName');
    if (inpName) inpName.value = localStorage.getItem(STORAGE_KEYS.name) || '';
    const inpWallet = document.getElementById('inpStartChips');
    const inpStack = document.getElementById('inpStack');
    if (inpWallet) inpWallet.value = walletChips;
    if (inpStack) inpStack.value = tableChips;

    document.getElementById('btnSaveSettings')?.addEventListener('click', () => {
      const name = inpName?.value?.trim() || 'Guest';
      const w = parseInt(inpWallet?.value, 10) || 10000;
      const t = parseInt(inpStack?.value, 10) || 2000;
      localStorage.setItem(STORAGE_KEYS.name, name);
      localStorage.setItem(STORAGE_KEYS.wallet, String(w));
      localStorage.setItem(STORAGE_KEYS.table, String(t));
      walletChips = w;
      tableChips = t;
      document.getElementById('playerName').textContent = name;
      saveState();
      updateChipDisplays();
      document.getElementById('youName').textContent = name === 'Guest' ? 'You' : name;
      document.getElementById('settingsModal')?.close();
      toast('Settings saved');
    });

    document.getElementById('btnWipeLocal')?.addEventListener('click', () => {
      localStorage.clear();
      walletChips = 10000;
      tableChips = 2000;
      document.getElementById('playerName').textContent = 'Guest';
      saveState();
      updateChipDisplays();
      document.getElementById('settingsModal')?.close();
      toast('Local data reset');
    });
  }

  // Theme
  document.getElementById('btnTheme')?.addEventListener('click', () => {
    document.body.classList.toggle('day-theme');
    const icon = document.getElementById('themeIcon');
    if (icon) icon.textContent = document.body.classList.contains('day-theme') ? '☀️' : '🌙';
    localStorage.setItem(STORAGE_KEYS.theme, document.body.classList.contains('day-theme') ? 'day' : 'night');
  });

  // Keyboard
  document.addEventListener('keydown', (e) => {
    if (e.key === '?' && !e.ctrlKey && !e.metaKey) {
      e.preventDefault();
      document.getElementById('helpModal')?.showModal();
    }
    if (e.key === 'Escape') document.querySelectorAll('dialog[open]').forEach(d => d.close());
    if (e.key === 'n' || e.key === 'N') {
      if (document.activeElement?.tagName === 'INPUT' || document.activeElement?.tagName === 'TEXTAREA') return;
      if (typeof getCurrentGameId === 'function' && getCurrentGameId() === 'holdem') quickDeal();
    }
    if (e.key === 'r' || e.key === 'R') {
      if (document.activeElement?.tagName === 'INPUT' || document.activeElement?.tagName === 'TEXTAREA') return;
      resetPokerTable();
    }
  });

  function init() {
    loadState();
    initBootVideo();
    initModals();
    initChips();
    initBanker();
    initPoker();
    initBlackjack();
    initSlots();
    initSettings();
  }

  document.addEventListener('DOMContentLoaded', init);
})();
