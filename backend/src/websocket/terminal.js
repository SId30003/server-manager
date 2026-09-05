const { WebSocketServer } = require('ws');
const { Client } = require('ssh2');
const db = require('../db/store');
const { verifyToken } = require('../middleware/auth');
const { decrypt } = require('../utils/crypto');
const { buildConnectionConfig } = require('../services/ssh');

function attachTerminalWebSocket(server) {
  const wss = new WebSocketServer({ server, path: '/ws/terminal' });

  wss.on('connection', (ws, req) => {
    const url = new URL(req.url, 'http://localhost');
    const serverId = url.searchParams.get('serverId');
    const token = url.searchParams.get('token');

    let user;
    try {
      user = verifyToken(token);
    } catch (err) {
      ws.send('\r\n\x1b[31mSession expired. Please log in again.\x1b[0m\r\n');
      return ws.close();
    }

    const record = db.get('servers').find({ id: serverId, ownerId: user.id }).value();
    if (!record) {
      ws.send('\r\n\x1b[31mServer not found.\x1b[0m\r\n');
      return ws.close();
    }

    const connectionConfig = buildConnectionConfig({
      ...record,
      password: decrypt(record.password),
      privateKey: decrypt(record.privateKey),
      passphrase: decrypt(record.passphrase),
    });

    const conn = new Client();

    conn
      .on('ready', () => {
        conn.shell({ term: 'xterm-256color', cols: 80, rows: 24 }, (err, stream) => {
          if (err) {
            ws.send(`\r\n\x1b[31mFailed to start shell: ${err.message}\x1b[0m\r\n`);
            return ws.close();
          }

          stream.on('data', (data) => {
            if (ws.readyState === ws.OPEN) ws.send(data.toString('utf8'));
          });
          stream.stderr.on('data', (data) => {
            if (ws.readyState === ws.OPEN) ws.send(data.toString('utf8'));
          });
          stream.on('close', () => {
            conn.end();
            ws.close();
          });

          ws.on('message', (msg) => {
            const text = msg.toString();
            // The frontend sends resize events as JSON, raw keystrokes as plain text
            try {
              const parsed = JSON.parse(text);
              if (parsed && parsed.type === 'resize') {
                stream.setWindow(parsed.rows, parsed.cols, 0, 0);
                return;
              }
            } catch (e) {
              // not JSON - fall through and treat as keystroke input
            }
            stream.write(text);
          });

          ws.on('close', () => conn.end());
        });
      })
      .on('error', (err) => {
        if (ws.readyState === ws.OPEN) {
          ws.send(`\r\n\x1b[31mConnection error: ${err.message}\x1b[0m\r\n`);
        }
        ws.close();
      })
      .connect(connectionConfig);
  });

  return wss;
}

module.exports = attachTerminalWebSocket;
