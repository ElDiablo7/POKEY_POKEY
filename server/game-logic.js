/**
 * Hold'em deck and hand evaluation (mirrors poker-engine.js for server use)
 */
const RANKS = ['2', '3', '4', '5', '6', '7', '8', '9', 'T', 'J', 'Q', 'K', 'A'];
const SUITS = ['\u2660', '\u2665', '\u2666', '\u2663']; // ♠♥♦♣

function createDeck() {
  const deck = [];
  for (const s of SUITS) {
    for (const r of RANKS) {
      deck.push({
        rank: r,
        suit: s,
        value: RANKS.indexOf(r) + 2,
      });
    }
  }
  return deck;
}

function shuffle(deck) {
  const d = [...deck];
  for (let i = d.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [d[i], d[j]] = [d[j], d[i]];
  }
  return d;
}

function evaluateHand(cards) {
  if (cards.length < 5) return null;
  const all = [...cards].sort((a, b) => b.value - a.value);
  const byRank = {};
  const bySuit = {};
  for (const c of all) {
    byRank[c.rank] = (byRank[c.rank] || 0) + 1;
    bySuit[c.suit] = (bySuit[c.suit] || 0) + 1;
  }
  const isFlush = Object.values(bySuit).some((n) => n >= 5);
  const flushSuit = Object.entries(bySuit).find(([, n]) => n >= 5)?.[0];
  const flushCards = flushSuit ? all.filter((c) => c.suit === flushSuit) : [];
  const vals = all.map((c) => c.value);
  const isStraight = (arr) => {
    const uniq = [...new Set(arr)].sort((a, b) => b - a);
    for (let i = 0; i <= uniq.length - 5; i++) {
      if (uniq[i] - uniq[i + 4] === 4) return uniq.slice(i, i + 5);
      if (
        uniq[i] === 14 &&
        uniq.includes(5) &&
        uniq.includes(4) &&
        uniq.includes(3) &&
        uniq.includes(2)
      ) {
        return [5, 4, 3, 2, 1];
      }
    }
    return null;
  };
  const straightCards = isStraight(vals);
  const straightFlushCards =
    flushSuit && straightCards
      ? flushCards.filter((c) =>
          straightCards.includes(c.value === 14 ? 1 : c.value)
        )
      : null;
  const counts = Object.entries(byRank)
    .map(([r, n]) => ({ rank: r, count: n }))
    .sort((a, b) => b.count - a.count);
  const quads = counts.find((c) => c.count === 4);
  const trips = counts.find((c) => c.count === 3);
  const pairs = counts.filter((c) => c.count === 2);

  if (straightFlushCards && straightFlushCards.length >= 5) {
    const high = Math.max(
      ...straightFlushCards.map((c) => (c.value === 14 ? 14 : c.value))
    );
    return {
      rank: 8,
      name: high === 14 ? 'Royal Flush' : 'Straight Flush',
      highCards: [high],
    };
  }
  if (quads) {
    const kicker = all.find((c) => c.rank !== quads.rank)?.value ?? 0;
    return {
      rank: 7,
      name: 'Four of a Kind',
      highCards: [RANKS.indexOf(quads.rank) + 2, kicker],
    };
  }
  if (trips && pairs.length >= 1) {
    const pairRank = RANKS.indexOf(pairs[0].rank) + 2;
    return {
      rank: 6,
      name: 'Full House',
      highCards: [RANKS.indexOf(trips.rank) + 2, pairRank],
    };
  }
  if (isFlush && flushCards.length >= 5) {
    const highs = flushCards.slice(0, 5).map((c) => c.value);
    return { rank: 5, name: 'Flush', highCards: highs };
  }
  if (straightCards) {
    const high =
      straightCards[0] === 14 && straightCards.includes(5)
        ? 5
        : straightCards[0];
    return { rank: 4, name: 'Straight', highCards: [high] };
  }
  if (trips) {
    const kickers = all
      .filter((c) => c.rank !== trips.rank)
      .slice(0, 2)
      .map((c) => c.value);
    return {
      rank: 3,
      name: 'Three of a Kind',
      highCards: [RANKS.indexOf(trips.rank) + 2, ...kickers],
    };
  }
  if (pairs.length >= 2) {
    const p1 = RANKS.indexOf(pairs[0].rank) + 2;
    const p2 = RANKS.indexOf(pairs[1].rank) + 2;
    const kicker =
      all.find(
        (c) => c.rank !== pairs[0].rank && c.rank !== pairs[1].rank
      )?.value ?? 0;
    return {
      rank: 2,
      name: 'Two Pair',
      highCards: [Math.max(p1, p2), Math.min(p1, p2), kicker],
    };
  }
  if (pairs.length === 1) {
    const kickers = all
      .filter((c) => c.rank !== pairs[0].rank)
      .slice(0, 3)
      .map((c) => c.value);
    return {
      rank: 1,
      name: 'Pair',
      highCards: [RANKS.indexOf(pairs[0].rank) + 2, ...kickers],
    };
  }
  return {
    rank: 0,
    name: 'High Card',
    highCards: all.slice(0, 5).map((c) => c.value),
  };
}

function combinations(arr, k) {
  if (k > arr.length) return [];
  if (k === arr.length) return [arr];
  if (k === 1) return arr.map((x) => [x]);
  const result = [];
  for (let i = 0; i <= arr.length - k; i++) {
    for (const c of combinations(arr.slice(i + 1), k - 1)) {
      result.push([arr[i], ...c]);
    }
  }
  return result;
}

function highCardsCompare(a, b) {
  for (let i = 0; i < Math.max(a.length, b.length); i++) {
    const va = a[i] || 0,
      vb = b[i] || 0;
    if (va !== vb) return va - vb;
  }
  return 0;
}

function bestHand(cards) {
  if (cards.length === 5) return evaluateHand(cards);
  if (cards.length < 5) return null;
  let best = evaluateHand(cards.slice(0, 5));
  const combs = combinations(cards, 5);
  for (const combo of combs) {
    const ev = evaluateHand(combo);
    if (
      ev &&
      (!best ||
        ev.rank > best.rank ||
        (ev.rank === best.rank &&
          highCardsCompare(ev.highCards, best.highCards) > 0))
    ) {
      best = ev;
    }
  }
  return best;
}

module.exports = {
  createDeck,
  shuffle,
  evaluateHand,
  bestHand,
  highCardsCompare,
  RANKS,
  SUITS,
};
