import { Peer } from 'peerjs';

let peer = null;
let conn = null;
let listeners = {};

// Helper for Pub/Sub
const emit = (event, data) => {
  if (listeners[event]) {
    listeners[event].forEach(cb => cb(data));
  }
};

export const onMsg = (event, callback) => {
  if (!listeners[event]) listeners[event] = [];
  listeners[event].push(callback);
  return () => {
    listeners[event] = listeners[event].filter(cb => cb !== callback);
  };
};

export const sendMsg = (event, data) => {
  if (conn && conn.open) {
    conn.send({ event, data });
  }
};

const setupConnection = (connection) => {
  conn = connection;
  conn.on('open', () => {
    emit('player_joined', {}); 
  });
  conn.on('data', (payload) => {
    emit(payload.event, payload.data);
  });
  conn.on('close', () => emit('opponent_disconnected', {}));
  conn.on('error', () => emit('opponent_disconnected', {}));
};

export const hostGame = () => {
  return new Promise((resolve, reject) => {
    const code = String(Math.floor(1000 + Math.random() * 9000));
    const peerId = `cipher-game-${code}`;
    peer = new Peer(peerId);

    peer.on('open', () => {
      resolve(code);
    });

    peer.on('connection', (connection) => {
      setupConnection(connection);
    });

    peer.on('error', (err) => {
      reject(err);
    });
  });
};

export const joinGame = (code) => {
  return new Promise((resolve, reject) => {
    peer = new Peer(); 

    peer.on('open', () => {
      const hostId = `cipher-game-${code}`;
      const connection = peer.connect(hostId, { reliable: true });
      setupConnection(connection);
      
      connection.on('open', () => {
         resolve(code);
      });
    });

    peer.on('error', (err) => {
      reject(err);
    });
  });
};

export const disconnect = () => {
  if (conn) conn.close();
  if (peer) peer.destroy();
  peer = null;
  conn = null;
  listeners = {};
};
