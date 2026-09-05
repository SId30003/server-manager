# Server Manager

Connect your servers/VPS, install common tools with one click, and open a live
CLI to any connected server — right from the browser.

## What's included

- **Backend** (`/backend`) — Node.js + Express API. Connects to servers over
  SSH (`ssh2`), runs one-click installer scripts with live streamed output
  (Server-Sent Events), and bridges a real interactive SSH shell to the
  browser over WebSocket (`/ws/terminal`) for the CLI feature.
- **Frontend** (`/frontend`) — React + Vite. Dashboard, per-server pages with
  Overview / Tools / Terminal tabs, and a live terminal powered by `xterm.js`.

## How the CLI feature works

1. You open the **Terminal** tab on a connected server.
2. The browser opens a WebSocket to the backend at `/ws/terminal?serverId=...`.
3. The backend opens a real SSH connection to that server and allocates a
   PTY (`conn.shell(...)` in `ssh2`).
4. Everything you type is sent over the WebSocket and written to the SSH
   stream; everything the server prints comes back the same way and is
   rendered by `xterm.js`, so you get a real, full-featured terminal —
   colors, `vim`, tab-completion, `htop`, all of it.

## Getting started

### 1. Backend

```bash
cd backend
npm install
cp .env.example .env
# edit .env and set real values for JWT_SECRET and CREDENTIALS_KEY
npm run dev      # or: npm start
```

The API runs on `http://localhost:4000` by default. Server credentials
(passwords / private keys) are encrypted at rest using `CREDENTIALS_KEY`
before being written to `backend/data/db.json` (a simple JSON file database —
swap in Postgres/Mongo later if you need multi-instance deployment).

### 2. Frontend

```bash
cd frontend
npm install
npm run dev
```

Open `http://localhost:5173`. The Vite dev server proxies `/api` and `/ws`
requests to the backend, so both need to be running.

### 3. Try it

1. Register an account on the login screen.
2. Click **Connect server** in the sidebar and enter SSH credentials for a
   real VPS or server you control (password or private key auth).
3. Open the server, use the **Tools** tab to one-click install Docker,
   Nginx, Node.js, Jenkins, Git, or PostgreSQL.
4. Use the **Terminal** tab for a full interactive shell.

## Security notes before deploying this for real

- Set strong, random values for `JWT_SECRET` and `CREDENTIALS_KEY` in
  `backend/.env` — never use the example defaults.
- Serve the app over HTTPS/WSS in production; browsers will otherwise block
  or warn on the WebSocket connection.
- Consider adding audit logging of terminal sessions and installer runs if
  multiple people share access to the same servers.
- The current installer scripts assume a Debian/Ubuntu (`apt`) target.

## Project structure

```
server-manager/
  backend/
    src/
      index.js              # Express app + WebSocket wiring
      routes/                # auth, servers, tools (SSE install streaming)
      services/
        ssh.js                # SSH connection/exec helpers
        installScripts.js     # one-click tool install scripts
      websocket/terminal.js  # interactive SSH <-> browser WebSocket bridge
      middleware/auth.js     # JWT auth
      utils/crypto.js        # AES encryption for stored credentials
      db/store.js            # lowdb JSON file database
  frontend/
    src/
      pages/                 # Login, Dashboard, ServerDetail
      components/
        Sidebar.jsx            # server list + connect modal
        ServerTerminal.jsx     # xterm.js CLI panel
        ToolInstaller.jsx      # one-click installer with live logs
        AddServerModal.jsx
      context/                # Auth + Server React contexts
      api/client.js           # fetch wrapper
      styles/theme.css        # design tokens (color, type, motion)
```
