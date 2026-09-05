const { Client } = require('ssh2');

/**
 * Build ssh2 connection config from a stored server record (already decrypted).
 */
function buildConnectionConfig(server) {
  const config = {
    host: server.host,
    port: server.port || 22,
    username: server.username,
    readyTimeout: 15000,
  };

  if (server.authType === 'key') {
    config.privateKey = server.privateKey;
    if (server.passphrase) config.passphrase = server.passphrase;
  } else {
    config.password = server.password;
  }

  return config;
}

/**
 * Verify that we can open an SSH connection and authenticate successfully.
 */
function testConnection(server) {
  return new Promise((resolve, reject) => {
    const conn = new Client();
    const timer = setTimeout(() => {
      conn.end();
      reject(new Error('Connection timed out'));
    }, 15000);

    conn
      .on('ready', () => {
        clearTimeout(timer);
        conn.end();
        resolve(true);
      })
      .on('error', (err) => {
        clearTimeout(timer);
        reject(err);
      })
      .connect(buildConnectionConfig(server));
  });
}

/**
 * Run a single command over SSH (non-interactive) and collect its full output.
 * Used for quick checks; for streaming installer output see runStreamingCommand.
 */
function runCommand(server, command) {
  return new Promise((resolve, reject) => {
    const conn = new Client();
    let stdout = '';
    let stderr = '';

    conn
      .on('ready', () => {
        conn.exec(command, (err, stream) => {
          if (err) {
            conn.end();
            return reject(err);
          }
          stream
            .on('close', (code) => {
              conn.end();
              resolve({ code, stdout, stderr });
            })
            .on('data', (data) => {
              stdout += data.toString('utf8');
            })
            .stderr.on('data', (data) => {
              stderr += data.toString('utf8');
            });
        });
      })
      .on('error', reject)
      .connect(buildConnectionConfig(server));
  });
}

// Matches the standard sudo password prompt, e.g. "[sudo] password for bob: "
// This intentionally does NOT match generic "password" mentions in normal
// command output - it requires the trailing colon+optional space at the end
// of a line, which is how sudo/su actually prompt.
const SUDO_PROMPT_RE = /\[sudo\] password for [^:]+:\s*$/i;

// Some distros/configs use a plain "Password:" prompt instead (e.g. `su`).
const GENERIC_PASSWORD_PROMPT_RE = /(^|\n)password:\s*$/i;

const MAX_SUDO_ANSWERS = 2; // sudo itself gives up after ~3 tries; we bail earlier with a clear error

/**
 * Run a command over SSH and stream each output chunk to onData as it arrives.
 * Resolves with the exit code when the command finishes. Used for one-click
 * installer scripts so the frontend can show live progress.
 *
 * If the remote command prompts for a sudo password (because the account
 * doesn't have passwordless sudo configured), this will type `sudoPassword`
 * in automatically, the same way a person watching the terminal would. If
 * no sudoPassword is available and a prompt appears, the command is aborted
 * with a clear error instead of hanging forever.
 */
function runStreamingCommand(server, command, onData, sudoPassword) {
  return new Promise((resolve, reject) => {
    const conn = new Client();
    let settled = false;
    let sudoAnswerCount = 0;
    let buffer = '';

    const finish = (fn, value) => {
      if (settled) return;
      settled = true;
      fn(value);
    };

    conn
      .on('ready', () => {
        conn.exec(command, { pty: true }, (err, stream) => {
          if (err) {
            conn.end();
            return finish(reject, err);
          }

          const handleChunk = (text) => {
            onData(text);

            // Keep a small rolling buffer so a prompt split across two TCP
            // chunks still gets detected.
            buffer = (buffer + text).slice(-500);

            const promptMatched = SUDO_PROMPT_RE.test(buffer) || GENERIC_PASSWORD_PROMPT_RE.test(buffer);
            if (!promptMatched) return;

            if (!sudoPassword) {
              onData(
                '\n[Server Manager] This account needs a sudo password and none is configured for it. ' +
                  'Add one when connecting the server, or configure passwordless sudo on the server. Aborting.\n'
              );
              stream.close();
              conn.end();
              return finish(resolve, 1);
            }

            if (sudoAnswerCount >= MAX_SUDO_ANSWERS) {
              onData('\n[Server Manager] Sudo password was rejected too many times. Aborting.\n');
              stream.close();
              conn.end();
              return finish(resolve, 1);
            }

            sudoAnswerCount += 1;
            buffer = ''; // don't re-trigger on the same prompt text
            stream.write(`${sudoPassword}\n`);
          };

          stream
            .on('close', (code) => {
              conn.end();
              finish(resolve, code);
            })
            .on('data', (data) => handleChunk(data.toString('utf8')))
            .stderr.on('data', (data) => handleChunk(data.toString('utf8')));
        });
      })
      .on('error', (err) => finish(reject, err))
      .connect(buildConnectionConfig(server));
  });
}

module.exports = { buildConnectionConfig, testConnection, runCommand, runStreamingCommand };
