require('dotenv').config();
const http = require('http');
const express = require('express');
const cors = require('cors');

const authRoutes = require('./routes/auth');
const serverRoutes = require('./routes/servers');
const toolRoutes = require('./routes/tools');
const attachTerminalWebSocket = require('./websocket/terminal');

const app = express();

app.use(
  cors({
    origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
  })
);
app.use(express.json());

app.get('/api/health', (req, res) => res.json({ ok: true }));

app.use('/api/auth', authRoutes);
app.use('/api/servers', serverRoutes);
app.use('/api/tools', toolRoutes);

app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: 'Something went wrong on the server' });
});

const server = http.createServer(app);
attachTerminalWebSocket(server);

const PORT = process.env.PORT || 4000;
server.listen(PORT, () => {
  console.log(`Server Manager API listening on http://localhost:${PORT}`);
  console.log(`Terminal WebSocket available at ws://localhost:${PORT}/ws/terminal`);
});
