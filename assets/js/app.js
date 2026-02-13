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

  // Boot video — ends 6 seconds before the actual end (last 6 seconds are skipped)
  const BOOT_VIDEO_TRIM_END = 6;

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
    video?.addEventListener('timeupdate', () => {
      if (video.duration && !isNaN(video.duration) && video.currentTime >= video.duration - BOOT_VIDEO_TRIM_END) {
        video.pause();
        hideOverlay();
      }
    });
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

  // Poker - Texas Hold'em full game loop
  const SB = 10, BB = 20, MIN_RAISE = 20;
  let pokerDeck = [];
  let playerHand = [];
  let communityCards = [];
  let pokerState = {
    phase: 'idle',
    pot: 0,
    currentBet: 0,
    playerBet: 0,
    playerFolded: false,
    cpuFolded: false,
    cpuHand: [],
    communityRevealed: 0,
  };

  function pokerDeal() {
    if (typeof createDeck === 'undefined' || typeof shuffle === 'undefined') return;
    if (tableChips < BB) { toast('Not enough chips on table'); return; }
    pokerDeck = shuffle(createDeck());
    playerHand = pokerDeck.splice(0, 2);
    pokerState.cpuHand = pokerDeck.splice(0, 2);
    pokerState.communityRevealed = 0;
    communityCards = [];
    const postBB = Math.min(BB, tableChips);
    const postSB = Math.min(SB, tableChips - postBB);
    tableChips -= (postBB + postSB);
    pokerState.pot = BB + SB;
    pokerState.currentBet = BB;
    pokerState.playerBet = postBB;
    pokerState.playerFolded = false;
    pokerState.cpuFolded = false;
    pokerState.phase = 'preflop';
    saveState();
    renderPokerHand();
    renderCommunityCards();
    updatePokerUI();
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
    if (typeof getCurrentGameId === 'function' && getCurrentGameId() === 'holdem') {
      slots[2]?.style.setProperty('display', 'none');
      slots[3]?.style.setProperty('display', 'none');
    }
  }

  function renderCommunityCards() {
    const toShow = pokerState.communityRevealed;
    for (let i = 1; i <= 5; i++) {
      const slot = document.getElementById('c' + i);
      if (!slot) continue;
      if (i <= toShow && communityCards[i - 1]) {
        slot.classList.add('has-card');
        slot.innerHTML = typeof formatCard === 'function' ? formatCard(communityCards[i - 1]) : communityCards[i - 1].rank + communityCards[i - 1].suit;
      } else {
        slot.classList.remove('has-card');
        slot.textContent = '';
      }
    }
  }

  function advanceStreet() {
    if (pokerState.phase === 'preflop') {
      pokerDeck.shift();
      communityCards = pokerDeck.splice(0, 3);
      pokerState.communityRevealed = 3;
      pokerState.phase = 'flop';
      pokerState.currentBet = 0;
      pokerState.playerBet = 0;
    } else if (pokerState.phase === 'flop') {
      pokerDeck.shift();
      communityCards.push(pokerDeck.shift());
      pokerState.communityRevealed = 4;
      pokerState.phase = 'turn';
      pokerState.currentBet = 0;
      pokerState.playerBet = 0;
    } else if (pokerState.phase === 'turn') {
      pokerDeck.shift();
      communityCards.push(pokerDeck.shift());
      pokerState.communityRevealed = 5;
      pokerState.phase = 'river';
      pokerState.currentBet = 0;
      pokerState.playerBet = 0;
    } else if (pokerState.phase === 'river') {
      pokerState.phase = 'showdown';
      endPokerHand();
      return;
    }
    renderCommunityCards();
    updatePokerUI();
  }

  function cpuAct() {
    if (pokerState.cpuFolded || pokerState.playerFolded) return;
    if (Math.random() < 0.2 && pokerState.phase !== 'preflop') {
      pokerState.cpuFolded = true;
      tableChips += pokerState.pot;
      toast('CPU folded. You win!');
      pokerState.phase = 'idle';
      saveState();
      updateChipDisplays();
      updatePokerUI();
      return;
    }
    const toCall = pokerState.currentBet;
    if (toCall === 0) {
      advanceStreet();
      return;
    }
    pokerState.pot += toCall;
    pokerState.playerBet = 0;
    pokerState.currentBet = 0;
    advanceStreet();
  }

  function endPokerHand() {
    const playerBest = typeof bestHand === 'function' && playerHand.length + communityCards.length >= 5
      ? bestHand([...playerHand, ...communityCards]) : null;
    const cpuBest = typeof bestHand === 'function' && pokerState.cpuHand.length + communityCards.length >= 5
      ? bestHand([...pokerState.cpuHand, ...communityCards]) : null;
    let winner = 'push';
    if (pokerState.playerFolded) winner = 'cpu';
    else if (pokerState.cpuFolded) winner = 'player';
    else if (playerBest && cpuBest) {
      if (playerBest.rank > cpuBest.rank) winner = 'player';
      else if (cpuBest.rank > playerBest.rank) winner = 'cpu';
      else if (playerBest.rank === cpuBest.rank && typeof highCardsCompare === 'function') {
        const c = highCardsCompare(playerBest.highCards, cpuBest.highCards);
        if (c > 0) winner = 'player';
        else if (c < 0) winner = 'cpu';
      }
    }
    if (winner === 'player') {
      tableChips += pokerState.pot;
      toast('You win! ' + (playerBest ? playerBest.name : ''));
    } else if (winner === 'cpu') {
      toast('CPU wins.');
    } else {
      tableChips += Math.floor(pokerState.pot / 2);
      toast('Push.');
    }
    pokerState.phase = 'idle';
    pokerState.pot = 0;
    saveState();
    updateChipDisplays();
    updatePokerUI();
  }

  function updatePokerUI() {
    const potEl = document.getElementById('pokerPot');
    const betEl = document.getElementById('pokerCurrentBet');
    const roundEl = document.getElementById('pokerRound');
    const callAmtEl = document.getElementById('callAmt');
    if (potEl) potEl.textContent = pokerState.pot;
    if (betEl) betEl.textContent = pokerState.currentBet;
    const callAmount = pokerState.currentBet - pokerState.playerBet;
    if (callAmtEl) callAmtEl.textContent = callAmount > 0 ? callAmount : '';
    if (roundEl) roundEl.textContent = pokerState.phase === 'idle' ? '—' : pokerState.phase;
    const canAct = pokerState.phase !== 'idle' && !pokerState.playerFolded && pokerState.phase !== 'showdown';
    const dealBtn = document.getElementById('btnPokerDeal');
    const foldBtn = document.getElementById('btnPokerFold');
    const checkBtn = document.getElementById('btnPokerCheck');
    const callBtn = document.getElementById('btnPokerCall');
    const raiseBtn = document.getElementById('btnPokerRaise');
    if (dealBtn) dealBtn.disabled = pokerState.phase !== 'idle';
    if (foldBtn) foldBtn.disabled = !canAct;
    if (checkBtn) checkBtn.disabled = !canAct || callAmount > 0;
    if (callBtn) callBtn.disabled = !canAct || callAmount <= 0;
    if (raiseBtn) raiseBtn.disabled = !canAct || tableChips < MIN_RAISE;
  }

  function pokerFold() {
    if (pokerState.phase === 'idle' || pokerState.playerFolded) return;
    pokerState.playerFolded = true;
    toast('Folded');
    pokerState.phase = 'showdown';
    endPokerHand();
  }

  function pokerCheck() {
    if (pokerState.phase === 'idle' || pokerState.playerFolded) return;
    const callAmount = pokerState.currentBet - pokerState.playerBet;
    if (callAmount !== 0) return;
    toast('Check');
    cpuAct();
  }

  function pokerCall() {
    if (pokerState.phase === 'idle' || pokerState.playerFolded) return;
    const callAmount = pokerState.currentBet - pokerState.playerBet;
    if (callAmount <= 0) return;
    const pay = Math.min(callAmount, tableChips);
    tableChips -= pay;
    pokerState.playerBet += pay;
    pokerState.pot += pay;
    toast('Call ' + pay);
    saveState();
    updateChipDisplays();
    if (pokerState.playerBet >= pokerState.currentBet) {
      cpuAct();
    }
    updatePokerUI();
  }

  function pokerRaise() {
    if (pokerState.phase === 'idle' || pokerState.playerFolded) return;
    const raiseAmount = MIN_RAISE;
    const totalNeed = pokerState.currentBet - pokerState.playerBet + raiseAmount;
    const pay = Math.min(totalNeed, tableChips);
    if (pay <= 0) return;
    tableChips -= pay;
    pokerState.playerBet += pay;
    pokerState.currentBet = pokerState.playerBet;
    pokerState.pot += pay;
    toast('Raise');
    saveState();
    updateChipDisplays();
    cpuAct();
    updatePokerUI();
  }

  function resetPokerTable() {
    playerHand = [];
    communityCards = [];
    pokerState = { phase: 'idle', pot: 0, currentBet: 0, playerBet: 0, playerFolded: false, cpuFolded: false, cpuHand: [], communityRevealed: 0 };
    for (let i = 1; i <= 5; i++) {
      const slot = document.getElementById('c' + i);
      if (slot) { slot.classList.remove('has-card'); slot.textContent = ''; }
    }
    const hand = document.getElementById('playerHand');
    hand?.querySelectorAll('.cardface').forEach((s, i) => {
      s.style.display = i < 2 ? 'flex' : 'none';
      s.classList.add('card-back');
      const f = s.querySelector('.card-front');
      if (f) f.innerHTML = typeof formatCardBack === 'function' ? formatCardBack() : '?';
    });
    updatePokerUI();
  }

  function initPoker() {
    document.getElementById('btnPokerDeal')?.addEventListener('click', () => {
      if (typeof getCurrentGameId === 'function' && getCurrentGameId() === 'holdem') pokerDeal();
      else {
        pokerDeck = shuffle(createDeck());
        playerHand = pokerDeck.splice(0, 2);
        communityCards = pokerDeck.splice(0, 5);
        pokerState.communityRevealed = 5;
        renderPokerHand();
        renderCommunityCards();
        updatePokerStatus();
      }
    });
    document.getElementById('btnResetTable')?.addEventListener('click', resetPokerTable);
    document.getElementById('btnPokerFold')?.addEventListener('click', pokerFold);
    document.getElementById('btnPokerCheck')?.addEventListener('click', pokerCheck);
    document.getElementById('btnPokerCall')?.addEventListener('click', pokerCall);
    document.getElementById('btnPokerRaise')?.addEventListener('click', pokerRaise);
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
    } else if (roundEl) roundEl.textContent = '—';
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

  function bjIsNatural(hand) {
    return hand.length === 2 && bjTotal(hand) === 21;
  }

  function bjRender() {
    const pH = document.getElementById('bjPlayerHand');
    const dH = document.getElementById('bjDealerHand');
    const pT = document.getElementById('bjPlayerTotal');
    const dT = document.getElementById('bjDealerTotal');
    const bal = document.getElementById('bjBalance');
    if (pH) pH.innerHTML = bjPlayerHand.map(c => typeof formatCard === 'function' ? formatCard(c) : `<span class="blackjack-card">${c.rank}${c.suit}</span>`).join('');
    if (dH) dH.innerHTML = bjDealerHand.map((c, i) => {
      const hidden = !bjDealt && i === 1;
      if (typeof formatCard === 'function') return formatCard(c, hidden);
      return `<span class="blackjack-card ${hidden ? 'hidden' : ''}">${c.rank}${c.suit}</span>`;
    }).join('');
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
    const playerNatural = bjIsNatural(bjPlayerHand);
    const dealerNatural = bjIsNatural(bjDealerHand);
    let result = '';
    if (pT > 21) result = 'Bust! You lose.';
    else if (playerNatural && !dealerNatural) {
      result = 'Blackjack! 3:2 payout!';
      bjBalance += bjBet + Math.floor(bjBet * 1.5);
    } else if (dealerNatural && !playerNatural) result = 'Dealer blackjack. You lose.';
    else if (playerNatural && dealerNatural) { result = 'Push (both blackjack).'; bjBalance += bjBet; }
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
  const SLOTS_IMG_BASE = 'assets/img/slots';
  function slotSymToFile(sym) { return (sym === 'BAR' ? 'bar' : sym) + '.svg'; }
  let slotsBalance = 0;
  let slotsBet = 100;
  let slotsSpinning = false;

  function slotsSpin() {
    if (slotsSpinning || slotsBalance < slotsBet) return;
    slotsSpinning = true;
    slotsBalance -= slotsBet;
    document.getElementById('btnSlotsSpin').disabled = true;
    const reels = [1, 2, 3, 4, 5].map(() => SLOT_SYMBOLS[Math.floor(Math.random() * SLOT_SYMBOLS.length)]);
    [1, 2, 3, 4, 5].forEach((i, idx) => {
      const reel = document.getElementById('slotsReel' + i);
      const img = reel?.querySelector('.slots-sym-img');
      if (reel && img) {
        img.style.animationDelay = (idx * 0.1) + 's';
        reel.classList.add('reel-spinning');
      }
    });
    const spinDuration = 650;
    setTimeout(() => {
      [1, 2, 3, 4, 5].forEach((i, idx) => {
        const reel = document.getElementById('slotsReel' + i);
        if (reel) {
          reel.classList.remove('reel-spinning');
          const sym = reels[idx];
          const img = reel.querySelector('.slots-sym-img');
          if (img) {
            img.src = SLOTS_IMG_BASE + '/' + slotSymToFile(sym);
            img.alt = sym;
            img.dataset.sym = sym;
          }
        }
      });
      const symCounts = {};
      reels.forEach(s => { symCounts[s] = (symCounts[s] || 0) + 1; });
      const maxCount = Math.max(...Object.values(symCounts));
      const symsByCount = Object.entries(symCounts).filter(([, n]) => n === maxCount).map(([s]) => s);
      const symbolValue = (s) => ({ '7': 5, 'BAR': 4, 'bell': 3, 'cherry': 2, 'lemon': 1 }[s] || 0);
      const bestSym = symsByCount.sort((a, b) => symbolValue(b) - symbolValue(a))[0];
      let win = 0;
      if (maxCount >= 5) win = slotsBet * 100;
      else if (maxCount >= 4) win = slotsBet * 25;
      else if (maxCount >= 3) win = slotsBet * 5;
      else if (maxCount >= 2) win = slotsBet * 1;
      slotsBalance += win;
      document.getElementById('slotsResult').textContent = win > 0 ? `Win: ${win} chips!` : 'No win';
      walletChips = slotsBalance;
      saveState();
      updateChipDisplays();
      slotsSpinning = false;
      document.getElementById('btnSlotsSpin').disabled = slotsBalance < slotsBet;
    }, spinDuration);
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
      if (typeof getCurrentGameId === 'function' && getCurrentGameId() === 'holdem' && pokerState.phase === 'idle') pokerDeal();
    }
    if (e.key === 'r' || e.key === 'R') {
      if (document.activeElement?.tagName === 'INPUT' || document.activeElement?.tagName === 'TEXTAREA') return;
      resetPokerTable();
    }
  });

  function initDice() {
    const diceBase = 'assets/img/dice';
    document.getElementById('btnRollDice')?.addEventListener('click', () => {
      const d1 = document.getElementById('dice1');
      const d2 = document.getElementById('dice2');
      if (!d1 || !d2) return;
      d1.classList.add('rolling');
      d2.classList.add('rolling');
      const v1 = 1 + Math.floor(Math.random() * 6);
      const v2 = 1 + Math.floor(Math.random() * 6);
      setTimeout(() => {
        d1.src = diceBase + '/d' + v1 + '.svg';
        d2.src = diceBase + '/d' + v2 + '.svg';
        d1.dataset.value = String(v1);
        d2.dataset.value = String(v2);
        d1.classList.remove('rolling');
        d2.classList.remove('rolling');
        toast('Rolled ' + v1 + ' + ' + v2 + ' = ' + (v1 + v2));
      }, 400);
    });
  }

  function init() {
    loadState();
    initBootVideo();
    initModals();
    initChips();
    initBanker();
    initPoker();
    initBlackjack();
    initSlots();
    initDice();
    initSettings();
  }

  document.addEventListener('DOMContentLoaded', init);
})();
