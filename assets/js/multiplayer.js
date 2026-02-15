/**
 * Multiplayer client: WebSocket connection, send actions, apply server state
 * Dispatches custom events for app.js to update poker state and re-render.
 */
(function () {
  const WS_URL =
    typeof POKEY_WS_URL !== 'undefined'
      ? POKEY_WS_URL
      : (location.protocol === 'https:' ? 'wss://' : 'ws://') + location.hostname + ':8765';

  let ws = null;
  let tableId = null;
  let mySeatIndex = null;
  let lastTableState = null;
  let reconnectAttempts = 0;
  const MAX_RECONNECT = 5;

  function send(msg) {
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify(msg));
    }
  }

  function connect() {
    if (ws && (ws.readyState === WebSocket.OPEN || ws.readyState === WebSocket.CONNECTING)) {
      return Promise.resolve();
    }
    return new Promise((resolve, reject) => {
      try {
        ws = new WebSocket(WS_URL);
      } catch (e) {
        reject(e);
        return;
      }
      ws.onopen = () => {
        reconnectAttempts = 0;
        dispatch('multiplayerConnected', {});
        resolve();
      };
      ws.onclose = () => {
        dispatch('multiplayerDisconnected', {});
        if (tableId) {
          tableId = null;
          mySeatIndex = null;
          lastTableState = null;
        }
      };
      ws.onerror = () => reject(new Error('WebSocket error'));
      ws.onmessage = (event) => {
        let data;
        try {
          data = JSON.parse(event.data);
        } catch {
          return;
        }
        const type = data.type;
        if (type === 'error') {
          dispatch('multiplayerError', { message: data.message });
          return;
        }
        if (type === 'tableCreated') {
          dispatch('multiplayerTableCreated', { tableId: data.tableId, name: data.name });
          return;
        }
        if (type === 'tableList') {
          dispatch('multiplayerTableList', { tables: data.tables });
          return;
        }
        if (type === 'tableState') {
          lastTableState = data;
          tableId = data.tableId;
          mySeatIndex = data.mySeatIndex;
          dispatch('multiplayerTableState', data);
          return;
        }
        if (type === 'leftTable') {
          tableId = null;
          mySeatIndex = null;
          lastTableState = null;
          dispatch('multiplayerLeftTable', {});
          return;
        }
        if (type === 'handStarted') {
          lastTableState = data;
          dispatch('multiplayerHandStarted', data);
          return;
        }
        if (type === 'stateUpdate') {
          lastTableState = data;
          dispatch('multiplayerStateUpdate', data);
          return;
        }
        if (type === 'showdown') {
          dispatch('multiplayerShowdown', data);
          if (data.stateUpdate) lastTableState = data.stateUpdate;
          return;
        }
      };
    });
  }

  function dispatch(eventName, detail) {
    window.dispatchEvent(new CustomEvent(eventName, { detail }));
  }

  function isInTable() {
    return tableId != null && ws && ws.readyState === WebSocket.OPEN;
  }

  function isMyTurn() {
    if (!lastTableState || mySeatIndex == null) return false;
    return lastTableState.turnSeat === mySeatIndex && lastTableState.phase !== 'idle' && lastTableState.phase !== 'showdown';
  }

  function isFolded() {
    if (!lastTableState || mySeatIndex == null) return false;
    const seats = lastTableState.seats || [];
    const me = seats.find((s) => s.seatIndex === mySeatIndex);
    return me && me.folded;
  }

  function sendAction(action, raiseAmount) {
    if (!isInTable()) return false;
    send({ type: 'action', action, raiseAmount: raiseAmount || 0 });
    return true;
  }

  function createTable(name) {
    send({ type: 'createTable', name: name || "Hold'em Table" });
  }

  function listTables() {
    send({ type: 'listTables' });
  }

  function joinTable(tableIdParam, playerName, seat) {
    if (!tableIdParam) return;
    send({ type: 'joinTable', tableId: tableIdParam, playerName: playerName || 'Guest', seat: seat ?? undefined });
  }

  function leaveTable() {
    if (!tableId) return;
    send({ type: 'leaveTable' });
  }

  function startHand() {
    if (!isInTable()) return;
    send({ type: 'startHand' });
  }

  function getTableId() {
    return tableId;
  }

  function getMySeatIndex() {
    return mySeatIndex;
  }

  function getLastTableState() {
    return lastTableState;
  }

  function getPlayerName() {
    const el = document.getElementById('playerName');
    return (el && el.textContent) ? el.textContent.trim() : 'Guest';
  }

  function updateLobbyUI() {
    const statusEl = document.getElementById('multiplayerStatus');
    const actionsEl = document.getElementById('multiplayerActions');
    const listEl = document.getElementById('multiplayerTableList');
    const atTableEl = document.getElementById('multiplayerAtTable');
    const connectBtn = document.getElementById('btnMpConnect');
    const createBtn = document.getElementById('btnMpCreateTable');
    const listBtn = document.getElementById('btnMpListTables');
    const startBtn = document.getElementById('btnMpStartHand');
    const leaveBtn = document.getElementById('btnMpLeaveTable');
    if (statusEl) statusEl.textContent = ws && ws.readyState === WebSocket.OPEN ? 'Connected' : 'Disconnected';
    if (connectBtn) connectBtn.disabled = ws && ws.readyState === WebSocket.CONNECTING;
    if (createBtn) createBtn.disabled = !ws || ws.readyState !== WebSocket.OPEN;
    if (listBtn) listBtn.disabled = !ws || ws.readyState !== WebSocket.OPEN;
    if (listEl) listEl.hidden = !(ws && ws.readyState === WebSocket.OPEN && !tableId);
    if (atTableEl) atTableEl.hidden = !tableId;
    if (tableId && lastTableState) {
      const nameEl = document.getElementById('multiplayerTableName');
      if (nameEl) nameEl.textContent = lastTableState.name || tableId;
      const rosterEl = document.getElementById('multiplayerRoster');
      if (rosterEl) {
        const seats = lastTableState.seats || [];
        rosterEl.innerHTML = seats.map(function (s) {
          if (!s.playerName) return '<li class="multiplayer-seat empty">Seat ' + (s.seatIndex + 1) + ': —</li>';
          return '<li class="multiplayer-seat">Seat ' + (s.seatIndex + 1) + ': ' + s.playerName + ' (' + (s.stack || 0) + ')</li>';
        }).join('');
      }
      if (startBtn) {
        const seated = (lastTableState.seats || []).filter(function (s) { return s.playerName; });
        startBtn.disabled = lastTableState.phase !== 'idle' || seated.length < 2;
      }
    }
  }

  function renderTableList(tables) {
    const ul = document.getElementById('multiplayerTables');
    if (!ul) return;
    if (!tables || !tables.length) {
      ul.innerHTML = '<li class="mini">No tables. Create one!</li>';
      return;
    }
    ul.innerHTML = tables.map(function (t) {
      return '<li class="multiplayer-table-row">' +
        '<span>' + (t.name || t.tableId) + ' (' + (t.playerCount || 0) + '/' + (t.maxSeats || 6) + ')</span> ' +
        '<button class="btn btn-tiny btn-shine btn-join-table" type="button" data-table-id="' + t.tableId + '">Join</button></li>';
    }).join('');
    ul.querySelectorAll('.btn-join-table').forEach(function (btn) {
      btn.addEventListener('click', function () {
        joinTable(btn.dataset.tableId, getPlayerName());
      });
    });
  }

  window.multiplayer = {
    connect,
    isInTable,
    isMyTurn,
    isFolded,
    sendAction,
    createTable,
    listTables,
    joinTable,
    leaveTable,
    startHand,
    getTableId,
    getMySeatIndex,
    getLastTableState,
    WS_URL,
    updateLobbyUI,
    getPlayerName,
  };

  document.addEventListener('DOMContentLoaded', function () {
    var connectBtn = document.getElementById('btnMpConnect');
    var createBtn = document.getElementById('btnMpCreateTable');
    var listBtn = document.getElementById('btnMpListTables');
    var startBtn = document.getElementById('btnMpStartHand');
    var leaveBtn = document.getElementById('btnMpLeaveTable');
    if (connectBtn) {
      connectBtn.addEventListener('click', function () {
        connect().then(updateLobbyUI).catch(function () { updateLobbyUI(); });
      });
    }
    if (createBtn) {
      createBtn.addEventListener('click', function () {
        var open = ws && ws.readyState === WebSocket.OPEN;
        if (open) createTable();
        else connect().then(function () { createTable(); updateLobbyUI(); });
      });
    }
    if (listBtn) {
      listBtn.addEventListener('click', function () {
        var open = ws && ws.readyState === WebSocket.OPEN;
        if (open) listTables();
        else connect().then(function () { listTables(); updateLobbyUI(); });
      });
    }
    if (startBtn) {
      startBtn.addEventListener('click', function () {
        startHand();
      });
    }
    if (leaveBtn) {
      leaveBtn.addEventListener('click', function () {
        leaveTable();
      });
    }
    window.addEventListener('multiplayerConnected', function () { updateLobbyUI(); });
    window.addEventListener('multiplayerDisconnected', function () { updateLobbyUI(); });
    window.addEventListener('multiplayerTableCreated', function (e) {
      joinTable(e.detail.tableId, getPlayerName());
    });
    window.addEventListener('multiplayerTableList', function (e) {
      renderTableList(e.detail.tables);
      updateLobbyUI();
    });
    window.addEventListener('multiplayerTableState', function () { updateLobbyUI(); });
    window.addEventListener('multiplayerHandStarted', function () { updateLobbyUI(); });
    window.addEventListener('multiplayerStateUpdate', function () { updateLobbyUI(); });
    window.addEventListener('multiplayerShowdown', function (e) {
      if (e.detail && e.detail.stateUpdate) updateLobbyUI();
    });
    window.addEventListener('multiplayerLeftTable', function () { updateLobbyUI(); });
    updateLobbyUI();
  });
})();
