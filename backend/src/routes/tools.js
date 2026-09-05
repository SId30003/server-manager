const express = require('express');
const db = require('../db/store');
const { requireAuth, verifyToken } = require('../middleware/auth');
const { decrypt } = require('../utils/crypto');
const { TOOLS, getTool } = require('../services/installScripts');
const { runStreamingCommand } = require('../services/ssh');

const router = express.Router();

// GET /api/tools - list the catalog of installable tools (no auth needed, static data)
router.get('/', (req, res) => {
  res.json(TOOLS.map(({ id, name, description }) => ({ id, name, description })));
});

// GET /api/tools/:toolId/install?serverId=...&token=...
// Uses Server-Sent Events so the frontend can show install progress live.
// EventSource can't send an Authorization header, so the token is passed as
// a query param here and verified manually.
router.get('/:toolId/install', async (req, res) => {
  const { serverId, token } = req.query;
  let user;
  try {
    user = verifyToken(token);
  } catch (err) {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }

  const tool = getTool(req.params.toolId);
  if (!tool) return res.status(404).json({ error: 'Unknown tool' });

  const server = db.get('servers').find({ id: serverId, ownerId: user.id }).value();
  if (!server) return res.status(404).json({ error: 'Server not found' });

  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    Connection: 'keep-alive',
  });

  const send = (event, data) => {
    res.write(`event: ${event}\n`);
    res.write(`data: ${JSON.stringify(data)}\n\n`);
  };

  const connectionInfo = {
    host: server.host,
    port: server.port,
    username: server.username,
    authType: server.authType,
    password: decrypt(server.password),
    privateKey: decrypt(server.privateKey),
    passphrase: decrypt(server.passphrase),
  };

  // Sudo normally asks for the account's own login password. For password-auth
  // servers that's the same password used to connect, so fall back to it when
  // no separate sudo password was configured. For key-auth servers there's no
  // login password to fall back to, so an explicit sudoPassword is required
  // (or the server needs passwordless sudo configured).
  const explicitSudoPassword = decrypt(server.sudoPassword);
  const effectiveSudoPassword =
    explicitSudoPassword || (server.authType === 'password' ? connectionInfo.password : '');

  send('log', { line: `Connecting to ${server.host}...` });

  try {
    const code = await runStreamingCommand(
      connectionInfo,
      tool.installScript,
      (chunk) => send('log', { line: chunk }),
      effectiveSudoPassword
    );

    if (code === 0) {
      const installed = new Set(server.installedTools || []);
      installed.add(tool.id);
      db.get('servers').find({ id: server.id }).assign({ installedTools: [...installed] }).write();
      send('done', { success: true, code });
    } else {
      send('done', { success: false, code });
    }
  } catch (err) {
    send('log', { line: `Error: ${err.message}` });
    send('done', { success: false, error: err.message });
  }

  res.end();
});

module.exports = router;
