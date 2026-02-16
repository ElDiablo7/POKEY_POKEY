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
    sound: 'grx_sound',
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
    if (typeof window.sounds !== 'undefined') window.sounds.setEnabled(localStorage.getItem(STORAGE_KEYS.sound) !== 'off');
    var sb = document.getElementById('btnSoundToggle');
    if (sb) sb.textContent = 'Sound: ' + (localStorage.getItem(STORAGE_KEYS.sound) !== 'off' ? 'On' : 'Off');
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
    if (typeof window.sounds !== 'undefined') window.sounds.toast();
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
    video?.addEventListener('canplay', function () {
      clearTimeout(fallback);
      video.play().catch(function () {});
    });
    video?.addEventListener('timeupdate', () => {
      if (video.duration && !isNaN(video.duration) && video.currentTime >= video.duration - BOOT_VIDEO_TRIM_END) {
        video.pause();
        hideOverlay();
      }
    });
    btnSkip?.addEventListener('click', () => { clearTimeout(fallback); hideOverlay(); });
    btnUnmute?.addEventListener('click', () => {
      if (video) {
        video.muted = false;
        video.play().catch(function () {});
      }
      if (btnUnmute) btnUnmute.textContent = '🔊';
    });

    video?.addEventListener('loadeddata', function () {
      video.play().catch(function () {});
    });
    if (video?.readyState >= 2) video.play().catch(function () {});
  }

  // Modals
  function initModals() {
    const helpModal = document.getElementById('helpModal');
    const settingsModal = document.getElementById('settingsModal');
    const diceRulesModal = document.getElementById('diceRulesModal');
    document.getElementById('btnHelp')?.addEventListener('click', () => helpModal?.showModal());
    document.getElementById('btnSettings')?.addEventListener('click', () => settingsModal?.showModal());
    document.getElementById('btnDiceRules')?.addEventListener('click', () => diceRulesModal?.showModal());
    document.getElementById('btnCloseHelp')?.addEventListener('click', () => helpModal?.close());
    document.getElementById('btnCloseSettings')?.addEventListener('click', () => settingsModal?.close());
    document.getElementById('btnCloseDiceRules')?.addEventListener('click', () => diceRulesModal?.close());
    helpModal?.addEventListener('click', (e) => { if (e.target === helpModal) helpModal.close(); });
    settingsModal?.addEventListener('click', (e) => { if (e.target === settingsModal) settingsModal.close(); });
    diceRulesModal?.addEventListener('click', (e) => { if (e.target === diceRulesModal) diceRulesModal.close(); });
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

  // Poker - Texas Hold'em full game loop (4 players: you + 3 AI)
  const SB = 10, BB = 20, MIN_RAISE = 20;
  const NUM_CPU = 3;
  const CPU_NAMES = ['Chip', 'Ace', 'Bluff'];
  let pokerState = {
    phase: 'idle',
    pot: 0,
    currentBet: 0,
    playerBet: 0,
    playerFolded: false,
    cpuPlayers: [],
    communityRevealed: 0,
    currentTurn: 0,
    dealerSeat: 0,
    cpuBets: [],
  };

  function pokerDeal() {
    if (typeof createDeck === 'undefined' || typeof shuffle === 'undefined') return;
    if (tableChips < BB) { toast('Not enough chips on table'); return; }
    pokerDeck = shuffle(createDeck());
    playerHand = pokerDeck.splice(0, 2);
    pokerState.cpuPlayers = [];
    pokerState.cpuBets = [];
    for (var i = 0; i < NUM_CPU; i++) {
      pokerState.cpuPlayers.push({ hand: pokerDeck.splice(0, 2), folded: false });
      pokerState.cpuBets.push(0);
    }
    pokerState.communityRevealed = 0;
    communityCards = [];
    pokerState.dealerSeat = ((pokerState.dealerSeat ?? -1) + 1) % 4;
    var dealer = pokerState.dealerSeat;
    var sbSeat = (dealer + 1) % 4;
    var bbSeat = (dealer + 2) % 4;
    var utgSeat = (dealer + 3) % 4;
    pokerState.pot = SB + BB;
    pokerState.currentBet = BB;
    pokerState.playerBet = (bbSeat === 0 ? BB : (sbSeat === 0 ? SB : 0));
    pokerState.cpuBets = [0, 0, 0];
    if (sbSeat > 0) pokerState.cpuBets[sbSeat - 1] = SB;
    if (bbSeat > 0) pokerState.cpuBets[bbSeat - 1] = BB;
    if (sbSeat === 0) tableChips -= SB;
    if (bbSeat === 0) tableChips -= BB;
    pokerState.playerFolded = false;
    pokerState.currentTurn = utgSeat;
    pokerState.phase = 'preflop';
    saveState();
    if (typeof window.sounds !== 'undefined') window.sounds.deal();
    renderPokerHand();
    renderCommunityCards();
    renderCpuOpponents();
    updatePokerUI();
    var oppEl = document.getElementById('pokerCpuOpponents');
    var mpEl = document.getElementById('multiplayerOpponents');
    if (oppEl) oppEl.hidden = false;
    if (mpEl) mpEl.hidden = true;
    runCpuTurns();
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

  function renderCpuOpponents() {
    var el = document.getElementById('pokerCpuOpponents');
    if (!el || typeof window.multiplayer !== 'undefined' && window.multiplayer.isInTable()) return;
    if (pokerState.phase === 'idle' || !pokerState.cpuPlayers || pokerState.cpuPlayers.length === 0) {
      el.hidden = true;
      return;
    }
    el.hidden = false;
    var cardBack = typeof formatCardBack === 'function' ? formatCardBack() : '';
    el.innerHTML = pokerState.cpuPlayers.map(function (cpu, i) {
      var folded = cpu.folded ? ' folded' : '';
      return '<div class="multiplayer-seat-at-table' + folded + '">' +
        '<span class="multiplayer-seat-name">' + CPU_NAMES[i] + '</span>' +
        (cpu.folded ? '<span class="multiplayer-seat-folded">Folded</span>' :
          '<div class="multiplayer-seat-cards">' + cardBack + cardBack + '</div>') +
        '</div>';
    }).join('');
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
    pokerState.currentBet = 0;
    pokerState.playerBet = 0;
    pokerState.cpuBets = [0, 0, 0];
    var dealer = pokerState.dealerSeat;
    for (var i = 1; i <= 4; i++) {
      var seat = (dealer + i) % 4;
      if (seat === 0 && !pokerState.playerFolded) { pokerState.currentTurn = 0; break; }
      if (seat > 0 && !pokerState.cpuPlayers[seat - 1].folded) { pokerState.currentTurn = seat; break; }
    }
    if (pokerState.phase === 'preflop') {
      pokerDeck.shift();
      communityCards = pokerDeck.splice(0, 3);
      pokerState.communityRevealed = 3;
      pokerState.phase = 'flop';
    } else if (pokerState.phase === 'flop') {
      pokerDeck.shift();
      communityCards.push(pokerDeck.shift());
      pokerState.communityRevealed = 4;
      pokerState.phase = 'turn';
    } else if (pokerState.phase === 'turn') {
      pokerDeck.shift();
      communityCards.push(pokerDeck.shift());
      pokerState.communityRevealed = 5;
      pokerState.phase = 'river';
    } else if (pokerState.phase === 'river') {
      pokerState.phase = 'showdown';
      endPokerHand();
      return;
    }
    renderCommunityCards();
    renderCpuOpponents();
    updatePokerUI();
  }

  function cpuHandStrength(cpu, seatIdx) {
    var cards = [...(cpu.hand || []), ...communityCards];
    if (cards.length < 5) {
      var h = cpu.hand || [];
      if (h.length < 2) return 0;
      var v0 = (typeof RANKS !== 'undefined' ? RANKS : '23456789TJQKA'.split('')).indexOf(h[0].rank) + 2;
      var v1 = (typeof RANKS !== 'undefined' ? RANKS : '23456789TJQKA'.split('')).indexOf(h[1].rank) + 2;
      var pair = h[0].rank === h[1].rank ? 1 : 0;
      var suited = h[0].suit === h[1].suit ? 0.3 : 0;
      var high = Math.max(v0, v1);
      return (pair ? 2 : 0) + (high >= 12 ? 1.5 : high >= 10 ? 0.8 : 0) + suited;
    }
    var ev = typeof bestHand === 'function' ? bestHand(cards) : null;
    return ev ? ev.rank + (ev.highCards && ev.highCards[0] ? ev.highCards[0] / 20 : 0) : 0;
  }

  function cpuDecide(seatIdx, toCall) {
    var cpu = pokerState.cpuPlayers[seatIdx];
    var name = CPU_NAMES[seatIdx];
    var strength = cpuHandStrength(cpu, seatIdx);
    var potOdds = toCall <= 0 ? 1 : pokerState.pot / (pokerState.pot + toCall);
    var personality = name === 'Chip' ? 'tight' : name === 'Ace' ? 'aggro' : 'loose';
    if (toCall === 0) return 'check';
    var foldChance = 0.15;
    if (strength < 1.5) foldChance = personality === 'tight' ? 0.55 : personality === 'loose' ? 0.35 : 0.45;
    else if (strength < 2.5) foldChance = personality === 'tight' ? 0.35 : 0.2;
    else if (strength < 4) foldChance = personality === 'tight' ? 0.15 : 0.05;
    if (toCall > pokerState.pot && strength < 3) foldChance += 0.2;
    if (Math.random() < foldChance) return 'fold';
    var raiseChance = 0;
    if (strength >= 5 && pokerState.phase !== 'preflop') raiseChance = personality === 'aggro' ? 0.5 : personality === 'loose' ? 0.35 : 0.25;
    else if (strength >= 3.5) raiseChance = personality === 'aggro' ? 0.3 : 0.15;
    if (Math.random() < raiseChance && pokerState.cpuPlayers[seatIdx].hand) return 'raise';
    return 'call';
  }

  function runCpuTurns() {
    if (typeof window.multiplayer !== 'undefined' && window.multiplayer.isInTable()) return;
    var run = function () {
      if (pokerState.phase === 'idle' || pokerState.phase === 'showdown') return;
      var seat = pokerState.currentTurn;
      if (seat === 0) return;
      var cpu = pokerState.cpuPlayers[seat - 1];
      if (!cpu || cpu.folded) { advanceTurn(); setTimeout(run, 200); return; }
      var toCall = pokerState.currentBet - pokerState.cpuBets[seat - 1];
      if (toCall === 0) {
        advanceTurn();
        renderCpuOpponents();
        updatePokerUI();
        if (!allBetsMatched()) { setTimeout(run, 400); return; }
        advanceStreet();
        renderCommunityCards();
        renderCpuOpponents();
        updatePokerUI();
        if (pokerState.currentTurn > 0) setTimeout(run, 400);
        return;
      }
      var decision = cpuDecide(seat - 1, toCall);
      if (decision === 'fold') {
        cpu.folded = true;
        if (typeof window.sounds !== 'undefined') window.sounds.fold();
        toast(CPU_NAMES[seat - 1] + ' folded');
        advanceTurn();
        renderCpuOpponents();
        updatePokerUI();
        if (countActive() <= 1) { endPokerHand(); return; }
        setTimeout(run, 400);
        return;
      }
      if (decision === 'raise') {
        var raiseAmt = MIN_RAISE;
        var totalNeed = toCall + raiseAmt;
        var pay = totalNeed;
        if (pay > 0 && cpu.hand) {
          pokerState.pot += pay;
          pokerState.cpuBets[seat - 1] += pay;
          pokerState.currentBet = pokerState.cpuBets[seat - 1];
          pokerState.cpuPlayers[seat - 1].hand = cpu.hand;
          if (typeof window.sounds !== 'undefined') window.sounds.chip();
          toast(CPU_NAMES[seat - 1] + ' raises');
          advanceTurn();
          renderCpuOpponents();
          updatePokerUI();
          if (!allBetsMatched()) { setTimeout(run, 500); return; }
          advanceStreet();
          renderCommunityCards();
          renderCpuOpponents();
          updatePokerUI();
          if (pokerState.currentTurn > 0) setTimeout(run, 500);
          return;
        }
      }
      pokerState.pot += toCall;
      pokerState.cpuBets[seat - 1] = pokerState.currentBet;
      if (typeof window.sounds !== 'undefined') window.sounds.chip();
      toast(CPU_NAMES[seat - 1] + ' calls');
      advanceTurn();
      if (!allBetsMatched()) { setTimeout(run, 400); return; }
      advanceStreet();
      renderCommunityCards();
      renderCpuOpponents();
      updatePokerUI();
      if (pokerState.currentTurn > 0) setTimeout(run, 400);
    };
    setTimeout(run, 300);
  }

  function advanceTurn() {
    var start = pokerState.currentTurn;
    for (var i = 1; i <= 4; i++) {
      var seat = (start + i) % 4;
      if (seat === 0 && !pokerState.playerFolded) { pokerState.currentTurn = 0; return; }
      if (seat > 0 && !pokerState.cpuPlayers[seat - 1].folded) { pokerState.currentTurn = seat; return; }
    }
    pokerState.currentTurn = 0;
  }

  function countActive() {
    var n = pokerState.playerFolded ? 0 : 1;
    for (var i = 0; i < NUM_CPU; i++) if (!pokerState.cpuPlayers[i].folded) n++;
    return n;
  }

  function allBetsMatched() {
    var target = pokerState.currentBet;
    if (!pokerState.playerFolded && pokerState.playerBet < target) return false;
    for (var i = 0; i < NUM_CPU; i++) {
      if (!pokerState.cpuPlayers[i].folded && pokerState.cpuBets[i] < target) return false;
    }
    return true;
  }

  function cpuAct() {
    if (typeof window.multiplayer !== 'undefined' && window.multiplayer.isInTable()) return;
    advanceTurn();
    if (pokerState.currentTurn === 0) return;
    runCpuTurns();
  }

  function endPokerHand() {
    var hands = [];
    if (!pokerState.playerFolded) {
      var ph = typeof bestHand === 'function' && playerHand.length + communityCards.length >= 5
        ? bestHand([...playerHand, ...communityCards]) : null;
      hands.push({ seat: 0, best: ph });
    }
    for (var i = 0; i < NUM_CPU; i++) {
      if (!pokerState.cpuPlayers[i].folded) {
        var ch = typeof bestHand === 'function' && pokerState.cpuPlayers[i].hand.length + communityCards.length >= 5
          ? bestHand([...pokerState.cpuPlayers[i].hand, ...communityCards]) : null;
        hands.push({ seat: i + 1, best: ch });
      }
    }
    if (hands.length === 0) {
      pokerState.phase = 'idle';
      pokerState.pot = 0;
      updatePokerUI();
      return;
    }
    if (hands.length === 1) {
      if (hands[0].seat === 0) {
        tableChips += pokerState.pot;
        if (typeof window.sounds !== 'undefined') window.sounds.win();
        triggerWinCelebration();
        toast('You win!');
      } else {
        if (typeof window.sounds !== 'undefined') window.sounds.lose();
        toast(CPU_NAMES[hands[0].seat - 1] + ' wins.');
      }
      pokerState.phase = 'idle';
      pokerState.pot = 0;
      saveState();
      updateChipDisplays();
      renderCpuOpponents();
      updatePokerUI();
      return;
    }
    var best = hands[0];
    for (var j = 1; j < hands.length; j++) {
      var a = best.best;
      var b = hands[j].best;
      if (!b) continue;
      if (!a || b.rank > a.rank || (b.rank === a.rank && typeof highCardsCompare === 'function' && highCardsCompare(b.highCards, a.highCards) > 0)) best = hands[j];
    }
    var winners = hands.filter(function (h) {
      return h.best && best.best && h.best.rank === best.best.rank && (typeof highCardsCompare !== 'function' || highCardsCompare(h.best.highCards, best.best.highCards) === 0);
    });
    var winAmount = Math.floor(pokerState.pot / winners.length);
    if (winners.some(function (w) { return w.seat === 0; })) {
      tableChips += winAmount;
      if (typeof window.sounds !== 'undefined') window.sounds.win();
      triggerWinCelebration();
      toast('You win! ' + (best.best ? best.best.name : '') + (winners.length > 1 ? ' (split)' : ''));
    } else {
      if (typeof window.sounds !== 'undefined') window.sounds.lose();
      toast(winners.map(function (w) { return CPU_NAMES[w.seat - 1]; }).join(', ') + ' win' + (winners.length > 1 ? '' : 's') + '.');
    }
    pokerState.phase = 'idle';
    pokerState.pot = 0;
    saveState();
    updateChipDisplays();
    renderCpuOpponents();
    updatePokerUI();
  }

  var lastRenderedPot = 0;
  var lastCanAct = false;

  function triggerPotPop() {
    const potWrap = document.querySelector('.poker-pot');
    if (potWrap) {
      potWrap.classList.remove('pot-pop');
      potWrap.offsetHeight;
      potWrap.classList.add('pot-pop');
      setTimeout(function () { potWrap.classList.remove('pot-pop'); }, 500);
    }
  }

  function triggerWinCelebration() {
    const el = document.getElementById('winCelebration');
    if (!el) return;
    el.classList.remove('celebrate');
    el.offsetHeight;
    el.classList.add('celebrate');
    setTimeout(function () { el.classList.remove('celebrate'); }, 2200);
  }

  function updatePokerUI() {
    const potEl = document.getElementById('pokerPot');
    const betEl = document.getElementById('pokerCurrentBet');
    const roundEl = document.getElementById('pokerRound');
    const callAmtEl = document.getElementById('callAmt');
    if (pokerState.pot > lastRenderedPot && pokerState.pot > 0) triggerPotPop();
    lastRenderedPot = pokerState.pot;
    if (potEl) potEl.textContent = pokerState.pot;
    if (betEl) betEl.textContent = pokerState.currentBet;
    const callAmount = pokerState.currentBet - pokerState.playerBet;
    if (callAmtEl) callAmtEl.textContent = callAmount > 0 ? callAmount : '';
    if (roundEl) roundEl.textContent = pokerState.phase === 'idle' ? '—' : pokerState.phase;
    const isMultiplayer = typeof window.multiplayer !== 'undefined' && window.multiplayer.isInTable();
    const canAct = isMultiplayer
      ? window.multiplayer.isMyTurn() && !window.multiplayer.isFolded()
      : (pokerState.phase !== 'idle' && !pokerState.playerFolded && pokerState.phase !== 'showdown');
    const dealBtn = document.getElementById('btnPokerDeal');
    const foldBtn = document.getElementById('btnPokerFold');
    const checkBtn = document.getElementById('btnPokerCheck');
    const callBtn = document.getElementById('btnPokerCall');
    const raiseBtn = document.getElementById('btnPokerRaise');
    if (dealBtn) dealBtn.disabled = isMultiplayer ? true : pokerState.phase !== 'idle';
    if (foldBtn) foldBtn.disabled = !canAct;
    if (checkBtn) checkBtn.disabled = !canAct || callAmount > 0;
    if (callBtn) callBtn.disabled = !canAct || callAmount <= 0;
    if (raiseBtn) raiseBtn.disabled = !canAct || tableChips < MIN_RAISE;
    const controlsEl = document.getElementById('pokerControls');
    const youEl = document.querySelector('.you');
    if (controlsEl) controlsEl.classList.toggle('your-turn', canAct);
    if (youEl) youEl.classList.toggle('your-turn', canAct);
    if (canAct && !lastCanAct) toast('Your turn!');
    lastCanAct = canAct;
  }

  function applyMultiplayerState(data) {
    if (!data) return;
    pokerState.phase = data.phase || 'idle';
    pokerState.pot = data.pot || 0;
    pokerState.currentBet = data.currentBet || 0;
    pokerState.communityRevealed = data.communityRevealed ?? 0;
    communityCards = data.communityCards || [];
    playerHand = data.myHoleCards || [];
    const mySeat = data.seats && data.mySeatIndex != null
      ? data.seats.find(function (s) { return s.seatIndex === data.mySeatIndex; })
      : null;
    if (mySeat) {
      pokerState.playerBet = mySeat.betThisRound || 0;
      pokerState.playerFolded = mySeat.folded || false;
      tableChips = mySeat.stack ?? tableChips;
    }
    var opponentsEl = document.getElementById('multiplayerOpponents');
    if (opponentsEl && data.mySeatIndex != null && data.seats && data.seats.length) {
      var others = data.seats.filter(function (s) { return s.playerName && s.seatIndex !== data.mySeatIndex; });
      if (others.length) {
        opponentsEl.hidden = false;
        var cardBack = typeof formatCardBack === 'function' ? formatCardBack() : '';
        opponentsEl.innerHTML = others.map(function (s) {
          var folded = s.folded ? ' folded' : '';
          return '<div class="multiplayer-seat-at-table' + folded + '">' +
            '<span class="multiplayer-seat-name">' + s.playerName + '</span>' +
            '<span class="multiplayer-seat-stack">' + (s.stack || 0) + '</span>' +
            (s.folded ? '<span class="multiplayer-seat-folded">Folded</span>' :
              '<div class="multiplayer-seat-cards">' + cardBack + cardBack + '</div>') +
            '</div>';
        }).join('');
      } else {
        opponentsEl.hidden = true;
      }
    } else if (opponentsEl && (!window.multiplayer || !window.multiplayer.isInTable())) {
      opponentsEl.hidden = true;
    }
    var cpuOpp = document.getElementById('pokerCpuOpponents');
    if (cpuOpp) cpuOpp.hidden = true;
    saveState();
    renderPokerHand();
    renderCommunityCards();
    updateChipDisplays();
    updatePokerUI();
  }

  function pokerFold() {
    if (typeof window.multiplayer !== 'undefined' && window.multiplayer.isInTable() && window.multiplayer.sendAction('fold')) return;
    if (pokerState.phase === 'idle' || pokerState.playerFolded) return;
    pokerState.playerFolded = true;
    if (typeof window.sounds !== 'undefined') window.sounds.fold();
    toast('Folded');
    pokerState.phase = 'showdown';
    endPokerHand();
  }

  function pokerCheck() {
    if (typeof window.multiplayer !== 'undefined' && window.multiplayer.isInTable() && window.multiplayer.sendAction('check')) return;
    if (pokerState.phase === 'idle' || pokerState.playerFolded) return;
    const callAmount = pokerState.currentBet - pokerState.playerBet;
    if (callAmount !== 0) return;
    if (typeof window.sounds !== 'undefined') window.sounds.chip();
    toast('Check');
    cpuAct();
  }

  function pokerCall() {
    if (typeof window.multiplayer !== 'undefined' && window.multiplayer.isInTable() && window.multiplayer.sendAction('call')) return;
    if (pokerState.phase === 'idle' || pokerState.playerFolded) return;
    const callAmount = pokerState.currentBet - pokerState.playerBet;
    if (callAmount <= 0) return;
    const pay = Math.min(callAmount, tableChips);
    tableChips -= pay;
    pokerState.playerBet += pay;
    pokerState.pot += pay;
    if (typeof window.sounds !== 'undefined') window.sounds.chip();
    toast('Call ' + pay);
    saveState();
    updateChipDisplays();
    if (pokerState.playerBet >= pokerState.currentBet) {
      cpuAct();
    }
    updatePokerUI();
  }

  function pokerRaise() {
    if (typeof window.multiplayer !== 'undefined' && window.multiplayer.isInTable() && window.multiplayer.sendAction('raise', MIN_RAISE)) return;
    if (pokerState.phase === 'idle' || pokerState.playerFolded) return;
    const raiseAmount = MIN_RAISE;
    const totalNeed = pokerState.currentBet - pokerState.playerBet + raiseAmount;
    const pay = Math.min(totalNeed, tableChips);
    if (pay <= 0) return;
    tableChips -= pay;
    pokerState.playerBet += pay;
    pokerState.currentBet = pokerState.playerBet;
    pokerState.pot += pay;
    if (typeof window.sounds !== 'undefined') window.sounds.chip();
    toast('Raise');
    saveState();
    updateChipDisplays();
    cpuAct();
    updatePokerUI();
  }

  function resetPokerTable() {
    playerHand = [];
    communityCards = [];
    pokerState = { phase: 'idle', pot: 0, currentBet: 0, playerBet: 0, playerFolded: false, cpuPlayers: [], communityRevealed: 0, currentTurn: 0, dealerSeat: 0, cpuBets: [] };
    for (let i = 1; i <= 5; i++) {
      const slot = document.getElementById('c' + i);
      if (slot) { slot.classList.remove('has-card'); slot.textContent = ''; }
    }
    var cpuOpp = document.getElementById('pokerCpuOpponents');
    if (cpuOpp) cpuOpp.hidden = true;
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
  let bjPlayerHands = [];
  let bjCurrentHandIndex = 0;
  let bjDealerHand = [];
  let bjBet = 0;
  let bjBetPerHand = [];
  let bjBalance = 0;
  let bjDealt = false;
  let bjSplitMode = false;

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

  function bjRankValue(r) {
    return ['K', 'Q', 'J', 'T'].includes(r) ? 10 : (r === 'A' ? 11 : parseInt(r, 10));
  }

  function bjCanSplit() {
    if (!bjSplitMode && bjPlayerHands.length === 1 && bjPlayerHands[0].length === 2) {
      const h = bjPlayerHands[0];
      const v0 = bjRankValue(h[0].rank);
      const v1 = bjRankValue(h[1].rank);
      return v0 === v1 && bjBalance >= bjBet;
    }
    return false;
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
    const fmt = c => typeof formatCard === 'function' ? formatCard(c) : `<span class="blackjack-card">${c.rank}${c.suit}</span>`;
    if (pH) {
      if (bjSplitMode && bjPlayerHands.length === 2) {
        pH.innerHTML = bjPlayerHands.map((hand, i) => {
          const active = i === bjCurrentHandIndex;
          return `<div class="blackjack-hand-split ${active ? 'active' : ''}"><span class="blackjack-hand-label">Hand ${i + 1}</span><div class="blackjack-hand">${hand.map(fmt).join('')}</div><span class="blackjack-hand-total">${bjTotal(hand)}</span></div>`;
        }).join('');
      } else {
        const hand = bjPlayerHands[0] || [];
        pH.innerHTML = hand.length ? hand.map(fmt).join('') : '';
      }
    }
    if (dH) dH.innerHTML = bjDealerHand.map((c, i) => {
      const hidden = !bjDealt && i === 1;
      if (typeof formatCard === 'function') return formatCard(c, hidden);
      return `<span class="blackjack-card ${hidden ? 'hidden' : ''}">${c.rank}${c.suit}</span>`;
    }).join('');
    const currentHand = bjPlayerHands[bjCurrentHandIndex] || [];
    if (pT) pT.textContent = bjSplitMode ? `Hand ${bjCurrentHandIndex + 1}: ${bjTotal(currentHand)}` : bjTotal(currentHand);
    if (dT) dT.textContent = bjDealt ? bjTotal(bjDealerHand) : (bjDealerHand[0] ? bjTotal([bjDealerHand[0]]) : '');
    if (bal) bal.textContent = bjBalance.toLocaleString();
    const btnSplit = document.getElementById('btnBjSplit');
    const btnHit = document.getElementById('btnBjHit');
    const btnStand = document.getElementById('btnBjStand');
    const btnDouble = document.getElementById('btnBjDouble');
    if (btnSplit) btnSplit.disabled = !bjCanSplit();
    if (btnHit) btnHit.disabled = !bjDealt || bjTotal(currentHand) >= 21;
    if (btnDouble) btnDouble.disabled = !bjDealt || currentHand.length !== 2 || bjBalance < bjBet || bjTotal(currentHand) >= 21;
  }

  function bjDeal() {
    if (bjBet <= 0) { toast('Place a bet first'); return; }
    if (bjBalance < bjBet) { toast('Not enough chips'); return; }
    if (typeof createDeck === 'undefined' || typeof shuffle === 'undefined') return;
    bjDeck = shuffle(createDeck());
    bjPlayerHands = [bjDeck.splice(0, 2)];
    bjBetPerHand = [bjBet];
    bjCurrentHandIndex = 0;
    bjSplitMode = false;
    bjDealerHand = bjDeck.splice(0, 2);
    bjBalance -= bjBet;
    bjDealt = true;
    if (typeof window.sounds !== 'undefined') window.sounds.deal();
    saveState();
    walletChips = bjBalance;
    document.getElementById('btnBjDeal').disabled = true;
    document.getElementById('btnBjHit').disabled = false;
    document.getElementById('btnBjStand').disabled = false;
    document.getElementById('btnBjDouble').disabled = bjPlayerHands[0].length !== 2 || bjBalance < bjBet;
    bjRender();
    if (bjTotal(bjPlayerHands[0]) === 21) bjStand();
  }

  function bjSplit() {
    if (!bjCanSplit()) return;
    const hand = bjPlayerHands[0];
    bjPlayerHands = [[hand[0]], [hand[1]]];
    bjBetPerHand = [bjBet, bjBet];
    bjPlayerHands[0].push(bjDeck.shift());
    if (typeof window.sounds !== 'undefined') window.sounds.card();
    bjPlayerHands[1].push(bjDeck.shift());
    if (typeof window.sounds !== 'undefined') window.sounds.card();
    bjBalance -= bjBet;
    bjCurrentHandIndex = 0;
    bjSplitMode = true;
    saveState();
    document.getElementById('btnBjSplit').disabled = true;
    bjRender();
    if (bjTotal(bjPlayerHands[0]) === 21) bjStand();
  }

  function bjHit() {
    if (!bjDealt) return;
    const hand = bjPlayerHands[bjCurrentHandIndex];
    if (!hand || bjTotal(hand) >= 21) return;
    hand.push(bjDeck.shift());
    if (typeof window.sounds !== 'undefined') window.sounds.card();
    bjRender();
    if (bjTotal(hand) > 21) bjStand();
  }

  function bjStand() {
    if (!bjDealt) return;
    if (bjSplitMode && bjCurrentHandIndex === 0 && bjPlayerHands.length === 2) {
      bjCurrentHandIndex = 1;
      bjRender();
      if (bjTotal(bjPlayerHands[1]) >= 21) bjStand();
      return;
    }
    document.getElementById('btnBjHit').disabled = true;
    document.getElementById('btnBjStand').disabled = true;
    document.getElementById('btnBjDouble').disabled = true;
    while (bjTotal(bjDealerHand) < 17) bjDealerHand.push(bjDeck.shift());
    bjDealt = false;
    bjRender();
    const dT = bjTotal(bjDealerHand);
    const dealerNatural = bjIsNatural(bjDealerHand);
    const results = [];
    let totalWin = 0;
    bjPlayerHands.forEach((hand, i) => {
      const bet = bjBetPerHand[i] || bjBet;
      const pT = bjTotal(hand);
      const playerNatural = bjIsNatural(hand);
      if (pT > 21) { results.push(`Hand ${i + 1}: Bust`); }
      else if (playerNatural && !dealerNatural) {
        results.push(`Hand ${i + 1}: Blackjack 3:2!`);
        totalWin += bet + Math.floor(bet * 1.5);
      } else if (dealerNatural && !playerNatural) { results.push(`Hand ${i + 1}: Lose`); }
      else if (playerNatural && dealerNatural) { results.push(`Hand ${i + 1}: Push`); totalWin += bet; }
      else if (dT > 21) { results.push(`Hand ${i + 1}: Win!`); totalWin += bet * 2; }
      else if (pT > dT) { results.push(`Hand ${i + 1}: Win!`); totalWin += bet * 2; }
      else if (dT > pT) { results.push(`Hand ${i + 1}: Lose`); }
      else { results.push(`Hand ${i + 1}: Push`); totalWin += bet; }
    });
    bjBalance += totalWin;
    if (typeof window.sounds !== 'undefined') (totalWin > 0 ? window.sounds.win() : (results.some(function (r) { return r.indexOf('Lose') >= 0 || r.indexOf('Bust') >= 0; }) ? window.sounds.lose() : window.sounds.chip()));
    document.getElementById('bjResult').textContent = results.join(' • ');
    document.getElementById('btnBjDeal').disabled = false;
    walletChips = bjBalance;
    saveState();
    updateChipDisplays();
    toast(results.join(' • '));
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
      const hand = bjPlayerHands[bjCurrentHandIndex];
      if (!hand || hand.length !== 2 || bjBalance < bjBet || bjTotal(hand) >= 21) return;
      bjBalance -= bjBet;
      bjBetPerHand[bjCurrentHandIndex] = bjBet * 2;
      hand.push(bjDeck.shift());
      bjRender();
      bjStand();
    });
    document.getElementById('btnBjSplit')?.addEventListener('click', bjSplit);
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
    if (typeof window.sounds !== 'undefined') window.sounds.slots();
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
      if (typeof window.sounds !== 'undefined') (win > 0 ? window.sounds.win() : window.sounds.chip());
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
    } else if (gameId === 'dice') {
      diceBalance = walletChips;
      document.getElementById('diceBalance').textContent = diceBalance.toLocaleString();
      document.getElementById('btnStreetDiceRoll').disabled = diceBalance < diceBet;
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
    var btnSound = document.getElementById('btnSoundToggle');
    if (btnSound && typeof window.sounds !== 'undefined') {
      btnSound.textContent = 'Sound: ' + (window.sounds.enabled() ? 'On' : 'Off');
      btnSound.addEventListener('click', function () {
        if (typeof window.sounds !== 'undefined') {
          window.sounds.toggle();
          btnSound.textContent = 'Sound: ' + (window.sounds.enabled() ? 'On' : 'Off');
          localStorage.setItem(STORAGE_KEYS.sound, window.sounds.enabled() ? 'on' : 'off');
          if (window.sounds.enabled()) window.sounds.toast();
        }
      });
    }

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

  // Street Dice — Street rules (craps) + Prison rules
  let diceBalance = 0;
  let diceBet = 100;
  let diceMode = 'street';
  let dicePoint = null;
  let dicePhase = 'comeout';

  function initStreetDice() {
    diceBalance = walletChips;
    document.getElementById('diceBalance').textContent = diceBalance.toLocaleString();

    document.querySelectorAll('.dice-mode-btn').forEach(function (btn) {
      btn.addEventListener('click', function () {
        if (dicePhase === 'point') return;
        document.querySelectorAll('.dice-mode-btn').forEach(function (b) { b.classList.remove('primary'); });
        btn.classList.add('primary');
        diceMode = btn.dataset.mode;
        dicePoint = null;
        dicePhase = 'comeout';
        document.getElementById('dicePoint').textContent = '';
        document.getElementById('diceStatus').textContent = diceMode === 'street' ? 'Place bet and roll (come-out)' : 'Place bet and roll';
        document.getElementById('btnStreetDiceRoll').disabled = diceBalance < diceBet;
      });
    });

    document.querySelectorAll('.dice-bet-btn').forEach(function (btn) {
      btn.addEventListener('click', function () {
        if (dicePhase === 'point') return;
        document.querySelectorAll('.dice-bet-btn').forEach(function (b) { b.classList.remove('primary'); });
        btn.classList.add('primary');
        diceBet = parseInt(btn.dataset.bet, 10);
        document.getElementById('btnStreetDiceRoll').disabled = diceBalance < diceBet;
      });
    });

    document.getElementById('btnStreetDiceRoll')?.addEventListener('click', streetDiceRoll);
  }

  function streetDiceRoll() {
    if (diceBalance < diceBet) { toast('Not enough chips'); return; }
    var d1 = document.getElementById('streetDice1');
    var d2 = document.getElementById('streetDice2');
    if (!d1 || !d2) return;

    d1.classList.add('rolling');
    d2.classList.add('rolling');
    if (typeof window.sounds !== 'undefined') window.sounds.dice();
    var v1 = 1 + Math.floor(Math.random() * 6);
    var v2 = 1 + Math.floor(Math.random() * 6);
    var total = v1 + v2;
    var diceBase = 'assets/img/dice';

    setTimeout(function () {
      d1.src = diceBase + '/d' + v1 + '.svg';
      d2.src = diceBase + '/d' + v2 + '.svg';
      d1.dataset.value = String(v1);
      d2.dataset.value = String(v2);
      d1.classList.remove('rolling');
      d2.classList.remove('rolling');

      if (diceMode === 'prison') {
        if (total === 7 || total === 11) {
          diceBalance += diceBet;
          if (typeof window.sounds !== 'undefined') window.sounds.win();
          toast('Win! ' + v1 + '+' + v2 + '=' + total);
          document.getElementById('diceStatus').textContent = 'Win!';
        } else if (total === 2 || total === 3 || total === 12) {
          diceBalance -= diceBet;
          if (typeof window.sounds !== 'undefined') window.sounds.lose();
          toast('Craps! ' + v1 + '+' + v2 + '=' + total);
          document.getElementById('diceStatus').textContent = 'Lose (craps)';
        } else {
          toast('Push. ' + v1 + '+' + v2 + '=' + total);
          document.getElementById('diceStatus').textContent = 'Push';
        }
        document.getElementById('dicePoint').textContent = '';
      } else {
        if (dicePhase === 'comeout') {
          if (total === 7 || total === 11) {
            diceBalance += diceBet;
            if (typeof window.sounds !== 'undefined') window.sounds.win();
            toast('Natural! Win!');
            document.getElementById('diceStatus').textContent = 'Win! (natural)';
            document.getElementById('dicePoint').textContent = '';
          } else if (total === 2 || total === 3 || total === 12) {
            diceBalance -= diceBet;
            if (typeof window.sounds !== 'undefined') window.sounds.lose();
            toast('Craps!');
            document.getElementById('diceStatus').textContent = 'Lose (craps)';
            document.getElementById('dicePoint').textContent = '';
          } else {
            dicePoint = total;
            dicePhase = 'point';
            document.getElementById('diceStatus').textContent = 'Point is ' + dicePoint + ' — roll again';
            document.getElementById('dicePoint').textContent = 'Point: ' + dicePoint;
          }
        } else {
          if (total === dicePoint) {
            diceBalance += diceBet;
            if (typeof window.sounds !== 'undefined') window.sounds.win();
            toast('Point! Win!');
            document.getElementById('diceStatus').textContent = 'Win! (hit point)';
            document.getElementById('dicePoint').textContent = '';
            dicePoint = null;
            dicePhase = 'comeout';
          } else if (total === 7) {
            diceBalance -= diceBet;
            if (typeof window.sounds !== 'undefined') window.sounds.lose();
            toast('Seven out');
            document.getElementById('diceStatus').textContent = 'Lose (seven out)';
            document.getElementById('dicePoint').textContent = '';
            dicePoint = null;
            dicePhase = 'comeout';
          } else {
            document.getElementById('diceStatus').textContent = 'Point ' + dicePoint + ' — rolled ' + total + ', roll again';
          }
        }
      }
      walletChips = diceBalance;
      saveState();
      updateChipDisplays();
      document.getElementById('diceBalance').textContent = diceBalance.toLocaleString();
      document.getElementById('btnStreetDiceRoll').disabled = diceBalance < diceBet;
    }, 450);
  }

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
        if (typeof window.sounds !== 'undefined') window.sounds.dice();
        toast('Rolled ' + v1 + ' + ' + v2 + ' = ' + (v1 + v2));
      }, 400);
    });
  }

  function initMultiplayerListeners() {
    window.addEventListener('multiplayerTableState', function (e) { applyMultiplayerState(e.detail); });
    window.addEventListener('multiplayerHandStarted', function (e) {
      applyMultiplayerState(e.detail);
      if (typeof window.sounds !== 'undefined') window.sounds.deal();
    });
    window.addEventListener('multiplayerStateUpdate', function (e) {
      var d = e.detail;
      applyMultiplayerState(d);
      var mySeat = window.multiplayer && window.multiplayer.getMySeatIndex ? window.multiplayer.getMySeatIndex() : null;
      if (d.lastAction && d.lastAction.seatIndex !== mySeat) {
        var seats = d.seats || [];
        var actor = seats.find(function (s) { return s.seatIndex === d.lastAction.seatIndex; });
        var name = actor && actor.playerName ? actor.playerName : 'Opponent';
        var act = d.lastAction.action;
        if (act === 'fold') toast(name + ' folded');
        else if (act === 'check') toast(name + ' checks');
        else if (act === 'call') toast(name + ' calls');
        else if (act === 'raise') toast(name + ' raises');
      }
    });
    window.addEventListener('multiplayerShowdown', function (e) {
      const d = e.detail;
      if (d.stateUpdate) applyMultiplayerState(d.stateUpdate);
      var mySeat = window.multiplayer && window.multiplayer.getMySeatIndex ? window.multiplayer.getMySeatIndex() : null;
      if (d.winners && d.winners.length) {
        const msg = d.winners.map(function (w) { return w.playerName + ' wins ' + w.amount + (w.hand ? ' (' + w.hand.name + ')' : ''); }).join('; ');
        toast(msg);
        if (mySeat != null && d.winners.some(function (w) { return w.seatIndex === mySeat; })) {
          if (typeof window.sounds !== 'undefined') window.sounds.win();
          triggerWinCelebration();
        } else if (mySeat != null && !d.winners.some(function (w) { return w.seatIndex === mySeat; })) {
          if (typeof window.sounds !== 'undefined') window.sounds.lose();
        } else if (typeof window.sounds !== 'undefined') {
          window.sounds.chip();
        }
      }
      var opponentsEl = document.getElementById('multiplayerOpponents');
      if (opponentsEl && d.revealed && d.revealed.length && typeof formatCard === 'function') {
        var mySeat = window.multiplayer && window.multiplayer.getMySeatIndex != null ? window.multiplayer.getMySeatIndex() : null;
        opponentsEl.hidden = false;
        opponentsEl.innerHTML = d.revealed.filter(function (r) { return r.seatIndex !== mySeat; }).map(function (r) {
          var cardsHtml = (r.holeCards || []).map(function (c) { return formatCard(c); }).join('');
          return '<div class="multiplayer-seat-at-table showdown">' +
            '<span class="multiplayer-seat-name">' + (r.playerName || '') + '</span>' +
            (r.hand ? '<span class="multiplayer-seat-hand">' + r.hand.name + '</span>' : '') +
            '<div class="multiplayer-seat-cards">' + cardsHtml + '</div></div>';
        }).join('');
      }
    });
    window.addEventListener('multiplayerError', function (e) { toast(e.detail && e.detail.message ? e.detail.message : 'Multiplayer error'); });
    window.addEventListener('multiplayerLeftTable', function () {
      var opponentsEl = document.getElementById('multiplayerOpponents');
      if (opponentsEl) opponentsEl.hidden = true;
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
    initStreetDice();
    initSlots();
    initDice();
    initSettings();
    initMultiplayerListeners();
  }

  document.addEventListener('DOMContentLoaded', init);
})();


