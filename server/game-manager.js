/**
 * Game manager: tables, seats, Hold'em state, actions, broadcast
 */
const { createDeck, shuffle, bestHand, highCardsCompare } = require('./game-logic');

const DEFAULT_SB = 10;
const DEFAULT_BB = 20;
const MIN_RAISE = 20;
const STARTING_STACK = 2000;
const MAX_SEATS = 6;

function generateId() {
  return Math.random().toString(36).slice(2, 10);
}

class Table {
  constructor(name, maxSeats = MAX_SEATS) {
    this.tableId = generateId();
    this.name = name || `Table ${this.tableId.slice(0, 4)}`;
    this.maxSeats = maxSeats;
    this.seats = Array(maxSeats)
      .fill(null)
      .map(() => ({ playerId: null, playerName: null, stack: 0 }));
    this.clients = new Map(); // clientId -> { ws, playerName, seatIndex }
    this.phase = 'idle';
    this.deck = [];
    this.communityCards = [];
    this.communityRevealed = 0;
    this.pot = 0;
    this.currentBet = 0;
    this.dealerSeat = 0;
    this.turnSeat = null;
    this.holeCards = []; // per seat: [card, card] or []
    this.betThisRound = []; // per seat
    this.folded = [];
    this.lastAction = null;
  }

  getSeatedPlayers() {
    return this.seats
      .map((s, i) => (s.playerId ? { ...s, seatIndex: i } : null))
      .filter(Boolean);
  }

  getActivePlayers() {
    return this.getSeatedPlayers().filter(
      (_, i) => !this.folded[i]
    );
  }

  canStartHand() {
    const seated = this.getSeatedPlayers();
    return this.phase === 'idle' && seated.length >= 2;
  }

  startHand() {
    if (!this.canStartHand()) return { ok: false, error: 'Cannot start hand' };
    const seated = this.getSeatedPlayers();
    this.deck = shuffle(createDeck());
    this.communityCards = [];
    this.communityRevealed = 0;
    this.pot = 0;
    this.currentBet = 0;
    this.betThisRound = this.seats.map(() => 0);
    this.folded = this.seats.map(() => false);
    this.holeCards = this.seats.map(() => []);

    const seatIndices = seated.map((p) => p.seatIndex);
    this.dealerSeat = seatIndices[0];
    const sbSeat = seatIndices[1 % seatIndices.length];
    const bbSeat = seatIndices[2 % seatIndices.length];

    for (let i = 0; i < this.maxSeats; i++) {
      if (this.seats[i].playerId) {
        this.holeCards[i] = [this.deck.shift(), this.deck.shift()];
      }
    }

    const sb = Math.min(DEFAULT_SB, this.seats[sbSeat].stack);
    const bb = Math.min(DEFAULT_BB, this.seats[bbSeat].stack);
    this.seats[sbSeat].stack -= sb;
    this.seats[bbSeat].stack -= bb;
    this.betThisRound[sbSeat] = sb;
    this.betThisRound[bbSeat] = bb;
    this.pot = sb + bb;
    this.currentBet = bb;
    this.phase = 'preflop';
    this.turnSeat = seatIndices[3 % seatIndices.length];
    this.lastAction = null;
    return {
      ok: true,
      handStarted: true,
      holeCardsBySeat: this.holeCards.map((cards, i) =>
        this.seats[i].playerId ? cards : null
      ),
      public: this.getPublicState(),
    };
  }

  getPublicState() {
    return {
      tableId: this.tableId,
      name: this.name,
      phase: this.phase,
      pot: this.pot,
      currentBet: this.currentBet,
      communityCards: this.communityCards,
      communityRevealed: this.communityRevealed,
      seats: this.seats.map((s, i) => ({
        seatIndex: i,
        playerName: s.playerName,
        stack: s.stack,
        betThisRound: this.betThisRound[i] ?? 0,
        folded: this.folded[i] ?? false,
        holeCards: null,
      })),
      dealerSeat: this.dealerSeat,
      turnSeat: this.turnSeat,
      lastAction: this.lastAction,
    };
  }

  getStateForClient(clientId, includeHoleCards = true) {
    const publicState = this.getPublicState();
    const client = this.clients.get(clientId);
    if (!client || !includeHoleCards) return publicState;
    const seatIndex = client.seatIndex;
    const holeCards = seatIndex != null ? this.holeCards[seatIndex] || [] : [];
    return { ...publicState, mySeatIndex: seatIndex, myHoleCards: holeCards };
  }

  advanceStreet() {
    if (this.phase === 'preflop') {
      this.deck.shift();
      this.communityCards = this.deck.splice(0, 3);
      this.communityRevealed = 3;
      this.phase = 'flop';
      this.currentBet = 0;
      this.betThisRound = this.seats.map(() => 0);
    } else if (this.phase === 'flop') {
      this.deck.shift();
      this.communityCards.push(this.deck.shift());
      this.communityRevealed = 4;
      this.phase = 'turn';
      this.currentBet = 0;
      this.betThisRound = this.seats.map(() => 0);
    } else if (this.phase === 'turn') {
      this.deck.shift();
      this.communityCards.push(this.deck.shift());
      this.communityRevealed = 5;
      this.phase = 'river';
      this.currentBet = 0;
      this.betThisRound = this.seats.map(() => 0);
    } else if (this.phase === 'river') {
      this.phase = 'showdown';
      return this.runShowdown();
    }
    const seated = this.getSeatedPlayers().map((p) => p.seatIndex);
    const active = seated.filter((i) => !this.folded[i]);
    const firstToAct = (this.dealerSeat + 1) % this.maxSeats;
    let nextTurn = null;
    for (let i = 0; i < this.maxSeats; i++) {
      const idx = (firstToAct + i) % this.maxSeats;
      if (active.includes(idx)) {
        nextTurn = idx;
        break;
      }
    }
    this.turnSeat = nextTurn;
    return { stateUpdate: this.getPublicState() };
  }

  runShowdown() {
    const seated = this.getSeatedPlayers();
    const active = seated.filter((_, i) => !this.folded[seated[i].seatIndex]);
    const activeSeatIndices = active.map((p) => p.seatIndex);
    const allCards = this.communityCards;
    const evaluations = activeSeatIndices.map((seatIndex) => {
      const hand = bestHand([
        ...this.holeCards[seatIndex],
        ...allCards,
      ]);
      return { seatIndex, hand, cards: this.holeCards[seatIndex] };
    });
    let best = evaluations[0];
    for (let i = 1; i < evaluations.length; i++) {
      const a = best.hand;
      const b = evaluations[i].hand;
      if (
        !b ||
        b.rank > a.rank ||
        (b.rank === a.rank && highCardsCompare(b.highCards, a.highCards) > 0)
      ) {
        best = evaluations[i];
      }
    }
    const winners = evaluations.filter(
      (e) =>
        e.hand &&
        best.hand &&
        e.hand.rank === best.hand.rank &&
        highCardsCompare(e.hand.highCards, best.hand.highCards) === 0
    );
    const potToSplit = this.pot;
    this.phase = 'idle';
    this.pot = 0;
    this.currentBet = 0;
    this.turnSeat = null;
    const winAmount = Math.floor(potToSplit / winners.length);
    winners.forEach((w) => {
      this.seats[w.seatIndex].stack += winAmount;
    });
    return {
      showdown: {
        winners: winners.map((w) => ({
          seatIndex: w.seatIndex,
          playerName: this.seats[w.seatIndex].playerName,
          amount: winAmount,
          hand: w.hand,
          holeCards: w.cards,
        })),
        revealed: evaluations.map((e) => ({
          seatIndex: e.seatIndex,
          playerName: this.seats[e.seatIndex].playerName,
          hand: e.hand,
          holeCards: e.cards,
        })),
        stateUpdate: this.getPublicState(),
      },
    };
  }

  applyAction(clientId, action, raiseAmount = 0) {
    const client = this.clients.get(clientId);
    if (!client) return { ok: false, error: 'Not at table' };
    const seatIndex = client.seatIndex;
    if (seatIndex == null) return { ok: false, error: 'Not seated' };
    if (this.turnSeat !== seatIndex)
      return { ok: false, error: 'Not your turn' };
    if (this.folded[seatIndex]) return { ok: false, error: 'Already folded' };

    const seat = this.seats[seatIndex];
    const callAmount = this.currentBet - this.betThisRound[seatIndex];

    if (action === 'fold') {
      this.folded[seatIndex] = true;
      this.lastAction = { seatIndex, action: 'fold' };
    } else if (action === 'check') {
      if (callAmount !== 0) return { ok: false, error: 'Cannot check, must call or fold' };
      this.lastAction = { seatIndex, action: 'check' };
    } else if (action === 'call') {
      if (callAmount <= 0) return { ok: false, error: 'Nothing to call' };
      const pay = Math.min(callAmount, seat.stack);
      seat.stack -= pay;
      this.betThisRound[seatIndex] += pay;
      this.pot += pay;
      this.lastAction = { seatIndex, action: 'call', amount: pay };
    } else if (action === 'raise') {
      const totalNeed = callAmount + (raiseAmount || MIN_RAISE);
      if (totalNeed > seat.stack)
        return { ok: false, error: 'Not enough chips to raise' };
      const pay = Math.min(totalNeed, seat.stack);
      seat.stack -= pay;
      this.betThisRound[seatIndex] += pay;
      this.pot += pay;
      this.currentBet = this.betThisRound[seatIndex];
      this.lastAction = { seatIndex, action: 'raise', amount: pay };
    } else {
      return { ok: false, error: 'Unknown action' };
    }

    const active = this.getSeatedPlayers()
      .map((p) => p.seatIndex)
      .filter((i) => !this.folded[i]);
    if (active.length <= 1) {
      const winnerSeat = active[0];
      if (winnerSeat != null) {
        this.seats[winnerSeat].stack += this.pot;
        this.phase = 'idle';
        this.pot = 0;
        this.turnSeat = null;
        return {
          ok: true,
          showdown: {
            winners: [
              {
                seatIndex: winnerSeat,
                playerName: this.seats[winnerSeat].playerName,
                amount: this.pot,
                hand: null,
                holeCards: null,
              },
            ],
            revealed: [],
            stateUpdate: this.getPublicState(),
          },
        };
      }
    }

    const allMatched = this.getSeatedPlayers()
      .filter((p) => !this.folded[p.seatIndex])
      .every((p) => this.betThisRound[p.seatIndex] >= this.currentBet);
    if (allMatched) {
      const result = this.advanceStreet();
      if (result.showdown) return { ok: true, ...result };
      return { ok: true, stateUpdate: result.stateUpdate };
    }

    let nextTurn = null;
    for (let i = 1; i <= this.maxSeats; i++) {
      const idx = (this.turnSeat + i) % this.maxSeats;
      if (this.seats[idx].playerId && !this.folded[idx]) {
        nextTurn = idx;
        break;
      }
    }
    this.turnSeat = nextTurn;
    return { ok: true, stateUpdate: this.getPublicState() };
  }
}

class GameManager {
  constructor() {
    this.tables = new Map();
    this.clientToTable = new Map();
  }

  createTable(name, maxSeats = MAX_SEATS) {
    const table = new Table(name, maxSeats);
    this.tables.set(table.tableId, table);
    return table;
  }

  getTable(tableId) {
    return this.tables.get(tableId) || null;
  }

  listTables() {
    return Array.from(this.tables.values()).map((t) => ({
      tableId: t.tableId,
      name: t.name,
      maxSeats: t.maxSeats,
      playerCount: t.getSeatedPlayers().length,
      phase: t.phase,
    }));
  }

  joinTable(clientId, ws, tableId, playerName, seatIndex = null) {
    const table = this.tables.get(tableId);
    if (!table) return { ok: false, error: 'Table not found' };
    if (this.clientToTable.get(clientId)) {
      this.leaveTable(clientId);
    }
    const seat = seatIndex != null ? seatIndex : table.seats.findIndex((s) => !s.playerId);
    if (seat < 0 || seat >= table.maxSeats) return { ok: false, error: 'No empty seat' };
    if (table.seats[seat].playerId) return { ok: false, error: 'Seat taken' };
    const stack = STARTING_STACK;
    table.seats[seat] = { playerId: clientId, playerName: playerName || 'Guest', stack };
    table.clients.set(clientId, { ws, playerName: playerName || 'Guest', seatIndex: seat });
    table.betThisRound = table.betThisRound || table.seats.map(() => 0);
    table.folded = table.folded || table.seats.map(() => false);
    this.clientToTable.set(clientId, table.tableId);
    return {
      ok: true,
      tableState: table.getStateForClient(clientId),
    };
  }

  leaveTable(clientId) {
    const tableId = this.clientToTable.get(clientId);
    if (!tableId) return;
    const table = this.tables.get(tableId);
    if (!table) return;
    const client = table.clients.get(clientId);
    if (client) {
      const seat = client.seatIndex;
      table.seats[seat] = { playerId: null, playerName: null, stack: 0 };
      table.clients.delete(clientId);
      if (table.holeCards && table.holeCards[seat]) table.holeCards[seat] = [];
    }
    this.clientToTable.delete(clientId);
    return table;
  }

  sit(clientId, seatIndex) {
    const tableId = this.clientToTable.get(clientId);
    const table = this.tables.get(tableId);
    if (!table) return { ok: false, error: 'Not at table' };
    const client = table.clients.get(clientId);
    if (!client) return { ok: false, error: 'Not at table' };
    if (seatIndex < 0 || seatIndex >= table.maxSeats)
      return { ok: false, error: 'Invalid seat' };
    if (table.seats[seatIndex].playerId) return { ok: false, error: 'Seat taken' };
    const oldSeat = client.seatIndex;
    const stack = table.seats[oldSeat].stack || STARTING_STACK;
    table.seats[oldSeat] = { playerId: null, playerName: null, stack: 0 };
    table.seats[seatIndex] = {
      playerId: clientId,
      playerName: client.playerName,
      stack,
    };
    client.seatIndex = seatIndex;
    if (table.holeCards && table.holeCards[oldSeat]) table.holeCards[oldSeat] = [];
    return { ok: true, tableState: table.getStateForClient(clientId) };
  }

  startHand(clientId) {
    const tableId = this.clientToTable.get(clientId);
    const table = this.tables.get(tableId);
    if (!table) return { ok: false, error: 'Not at table' };
    const result = table.startHand();
    if (!result.ok) return result;
    return result;
  }

  action(clientId, action, raiseAmount) {
    const tableId = this.clientToTable.get(clientId);
    const table = this.tables.get(tableId);
    if (!table) return { ok: false, error: 'Not at table' };
    return table.applyAction(clientId, action, raiseAmount);
  }

  broadcast(tableId, payload, excludeClientId = null) {
    const table = this.tables.get(tableId);
    if (!table) return;
    const msg = JSON.stringify(payload);
    table.clients.forEach((client, cid) => {
      if (cid === excludeClientId) return;
      if (client.ws && client.ws.readyState === 1) {
        client.ws.send(msg);
      }
    });
  }

  sendToClient(table, clientId, payload) {
    const client = table.clients.get(clientId);
    if (client && client.ws && client.ws.readyState === 1) {
      client.ws.send(JSON.stringify(payload));
    }
  }
}

module.exports = { GameManager, Table, DEFAULT_BB, MIN_RAISE };
