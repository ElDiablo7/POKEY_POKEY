/**
 * WebSocket server for POKEY_POKEY multiplayer
 * Messages: joinTable, leaveTable, sit, startHand, action
 * Events: tableState, handStarted, stateUpdate, showdown, error
 */
const WebSocket = require('ws');
const { GameManager } = require('./game-manager');

const PORT = process.env.PORT || 8765;
const server = new WebSocket.Server({ port: PORT });
const gm = new GameManager();

function generateClientId() {
  return 'c' + Math.random().toString(36).slice(2, 12);
}

server.on('connection', (ws, req) => {
  const clientId = generateClientId();
  ws.clientId = clientId;
  ws.isAlive = true;
  ws.on('pong', () => { ws.isAlive = true; });

  ws.on('message', (data) => {
    let msg;
    try {
      msg = JSON.parse(data.toString());
    } catch {
      send(ws, { type: 'error', message: 'Invalid JSON' });
      return;
    }
    const type = msg.type;
    if (type === 'createTable') {
      const name = msg.name || 'Hold\'em Table';
      const table = gm.createTable(name);
      send(ws, { type: 'tableCreated', tableId: table.tableId, name: table.name });
      return;
    }
    if (type === 'listTables') {
      const tables = gm.listTables();
      send(ws, { type: 'tableList', tables });
      return;
    }
    if (type === 'joinTable') {
      const { tableId, playerName, seat: seatIndex } = msg;
      if (!tableId) {
        send(ws, { type: 'error', message: 'tableId required' });
        return;
      }
      const result = gm.joinTable(
        clientId,
        ws,
        tableId,
        playerName || 'Guest',
        seatIndex ?? null
      );
      if (!result.ok) {
        send(ws, { type: 'error', message: result.error });
        return;
      }
      send(ws, { type: 'tableState', ...result.tableState });
      const table = gm.getTable(tableId);
      gm.broadcast(tableId, { type: 'tableState', ...table.getPublicState() }, clientId);
      return;
    }
    if (type === 'leaveTable') {
      const table = gm.leaveTable(clientId);
      send(ws, { type: 'leftTable' });
      if (table) {
        gm.broadcast(table.tableId, { type: 'tableState', ...table.getPublicState() });
      }
      return;
    }
    if (type === 'sit') {
      const seatIndex = msg.seat;
      if (seatIndex == null) {
        send(ws, { type: 'error', message: 'seat required' });
        return;
      }
      const result = gm.sit(clientId, seatIndex);
      if (!result.ok) {
        send(ws, { type: 'error', message: result.error });
        return;
      }
      send(ws, { type: 'tableState', ...result.tableState });
      const tableId = gm.clientToTable.get(clientId);
      const table = gm.getTable(tableId);
      gm.broadcast(tableId, { type: 'tableState', ...table.getPublicState() }, clientId);
      return;
    }
    if (type === 'startHand') {
      const result = gm.startHand(clientId);
      if (!result.ok) {
        send(ws, { type: 'error', message: result.error });
        return;
      }
      const tableId = gm.clientToTable.get(clientId);
      const table = gm.getTable(tableId);
      table.clients.forEach((client, cid) => {
        const state = table.getStateForClient(cid);
        const payload = {
          type: 'handStarted',
          ...state,
          handStarted: true,
          myHoleCards: state.myHoleCards,
          mySeatIndex: state.mySeatIndex,
        };
        if (client.ws && client.ws.readyState === 1) {
          client.ws.send(JSON.stringify(payload));
        }
      });
      return;
    }
    if (type === 'action') {
      const { action, raiseAmount } = msg;
      if (!action || !['fold', 'check', 'call', 'raise'].includes(action)) {
        send(ws, { type: 'error', message: 'Invalid action' });
        return;
      }
      const result = gm.action(clientId, action, raiseAmount);
      if (!result.ok) {
        send(ws, { type: 'error', message: result.error });
        return;
      }
      const tableId = gm.clientToTable.get(clientId);
      const table = gm.getTable(tableId);
      if (result.stateUpdate) {
        table.clients.forEach((client, cid) => {
          const payload = {
            type: 'stateUpdate',
            ...table.getStateForClient(cid),
          };
          if (client.ws && client.ws.readyState === 1) {
            client.ws.send(JSON.stringify(payload));
          }
        });
      }
      if (result.showdown) {
        table.clients.forEach((client) => {
          if (client.ws && client.ws.readyState === 1) {
            client.ws.send(
              JSON.stringify({
                type: 'showdown',
                ...result.showdown,
              })
            );
          }
        });
      }
      return;
    }
    send(ws, { type: 'error', message: 'Unknown message type' });
  });

  ws.on('close', () => {
    const table = gm.leaveTable(clientId);
    if (table) {
      gm.broadcast(table.tableId, { type: 'tableState', ...table.getPublicState() });
    }
  });
});

function send(ws, obj) {
  if (ws.readyState === WebSocket.OPEN) {
    ws.send(JSON.stringify(obj));
  }
}

const interval = setInterval(() => {
  server.clients.forEach((ws) => {
    if (ws.isAlive === false) return ws.terminate();
    ws.isAlive = false;
    ws.ping();
  });
}, 30000);

server.on('close', () => clearInterval(interval));

console.log(`POKEY_POKEY WebSocket server listening on port ${PORT}`);
