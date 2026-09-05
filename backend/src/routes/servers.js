const express = require('express');
const { v4: uuid } = require('uuid');
const db = require('../db/store');
const { requireAuth } = require('../middleware/auth');
const { encrypt, decrypt } = require('../utils/crypto');
const { testConnection } = require('../services/ssh');
const { fetchMetrics } = require('../services/metrics');

const router = express.Router();
router.use(requireAuth);

function toPublicServer(server) {
  const { password, privateKey, passphrase, sudoPassword, ...rest } = server;
  return { ...rest, hasPassword: !!password, hasKey: !!privateKey, hasSudoPassword: !!sudoPassword };
}

// GET /api/servers - list servers owned by the current user
router.get('/', (req, res) => {
  const servers = db.get('servers').filter({ ownerId: req.user.id }).value();
  res.json(servers.map(toPublicServer));
});

// POST /api/servers - connect a new server
router.post('/', async (req, res) => {
  const { name, host, port, username, authType, password, privateKey, passphrase, sudoPassword } = req.body;

  if (!name || !host || !username || !authType) {
    return res.status(400).json({ error: 'Name, host, username, and auth type are required' });
  }
  if (authType === 'password' && !password) {
    return res.status(400).json({ error: 'Password is required for password authentication' });
  }
  if (authType === 'key' && !privateKey) {
    return res.status(400).json({ error: 'Private key is required for key authentication' });
  }

  const server = {
    id: uuid(),
    ownerId: req.user.id,
    name,
    host,
    port: port ? Number(port) : 22,
    username,
    authType,
    password: authType === 'password' ? encrypt(password) : '',
    privateKey: authType === 'key' ? encrypt(privateKey) : '',
    passphrase: authType === 'key' && passphrase ? encrypt(passphrase) : '',
    sudoPassword: sudoPassword ? encrypt(sudoPassword) : '',
    status: 'unknown',
    installedTools: [],
    createdAt: new Date().toISOString(),
  };

  // Try connecting right away so the user gets immediate feedback
  try {
    await testConnection({
      host: server.host,
      port: server.port,
      username: server.username,
      authType: server.authType,
      password,
      privateKey,
      passphrase,
    });
    server.status = 'online';
  } catch (err) {
    server.status = 'offline';
    server.lastError = err.message;
  }

  db.get('servers').push(server).write();
  res.status(201).json(toPublicServer(server));
});

// POST /api/servers/:id/test - re-check connectivity for an existing server
router.post('/:id/test', async (req, res) => {
  const server = db.get('servers').find({ id: req.params.id, ownerId: req.user.id }).value();
  if (!server) return res.status(404).json({ error: 'Server not found' });

  try {
    await testConnection({
      ...server,
      password: decrypt(server.password),
      privateKey: decrypt(server.privateKey),
      passphrase: decrypt(server.passphrase),
    });
    db.get('servers').find({ id: server.id }).assign({ status: 'online', lastError: null }).write();
    res.json({ status: 'online' });
  } catch (err) {
    db.get('servers').find({ id: server.id }).assign({ status: 'offline', lastError: err.message }).write();
    res.status(200).json({ status: 'offline', error: err.message });
  }
});

// GET /api/servers/:id/metrics - RAM, disk, load average, and recent system logs
router.get('/:id/metrics', async (req, res) => {
  const server = db.get('servers').find({ id: req.params.id, ownerId: req.user.id }).value();
  if (!server) return res.status(404).json({ error: 'Server not found' });

  try {
    const metrics = await fetchMetrics({
      ...server,
      password: decrypt(server.password),
      privateKey: decrypt(server.privateKey),
      passphrase: decrypt(server.passphrase),
    });
    res.json(metrics);
  } catch (err) {
    res.status(502).json({ error: `Couldn't read metrics: ${err.message}` });
  }
});

// DELETE /api/servers/:id - disconnect / remove a server
router.delete('/:id', (req, res) => {
  const server = db.get('servers').find({ id: req.params.id, ownerId: req.user.id }).value();
  if (!server) return res.status(404).json({ error: 'Server not found' });

  db.get('servers').remove({ id: server.id }).write();
  res.status(204).send();
});

module.exports = router;
