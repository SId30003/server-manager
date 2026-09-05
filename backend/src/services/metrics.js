const { runCommand } = require('./ssh');

// No sudo anywhere here on purpose: `free`, `df`, and `uptime` never need it,
// and `journalctl`/`/var/log/syslog` are readable without it on Ubuntu's
// default cloud images (the default user is in the `adm` / `systemd-journal`
// groups). Requiring sudo here would reintroduce the exact hang this whole
// feature is meant to help you avoid.
const METRICS_SCRIPT = `
echo "___MEM___"
free -m
echo "___DISK___"
df -h / 2>/dev/null
echo "___LOAD___"
uptime
echo "___LOGS___"
if command -v journalctl >/dev/null 2>&1; then
  journalctl -n 40 --no-pager -o short-iso 2>/dev/null || tail -n 40 /var/log/syslog 2>/dev/null || echo "No accessible system logs on this account."
else
  tail -n 40 /var/log/syslog 2>/dev/null || echo "No accessible system logs on this account."
fi
`.trim();

function section(raw, marker, nextMarker) {
  const start = raw.indexOf(marker);
  if (start === -1) return '';
  const from = start + marker.length;
  const end = nextMarker ? raw.indexOf(nextMarker, from) : raw.length;
  return raw.slice(from, end === -1 ? raw.length : end).trim();
}

function parseMemory(block) {
  // Example line: "Mem:           1978         412         678           1         887        1400"
  const line = block.split('\n').find((l) => l.trim().startsWith('Mem:'));
  if (!line) return null;
  const parts = line.trim().split(/\s+/).map(Number);
  const [, total, used, free, , buffCache, available] = parts;
  if (!total) return null;
  return {
    totalMb: total,
    usedMb: used,
    freeMb: free,
    buffCacheMb: buffCache,
    availableMb: available ?? free,
    usedPercent: Math.round((used / total) * 100),
  };
}

function parseDisk(block) {
  // Example: "/dev/sda1        20G   8.1G   11G  43% /"
  const line = block.split('\n').find((l) => /\d+%/.test(l));
  if (!line) return null;
  const parts = line.trim().split(/\s+/);
  const [, size, used, avail, usePercent] = parts;
  return {
    size,
    used,
    available: avail,
    usedPercent: parseInt(usePercent, 10) || 0,
  };
}

function parseLoad(block) {
  const match = block.match(/load average:\s*([\d.]+),?\s*([\d.]+),?\s*([\d.]+)/i);
  const uptimeMatch = block.match(/up\s+(.*?),\s*\d+\s*users?,/i) || block.match(/up\s+(.*?),\s*load average/i);
  return {
    load1: match ? parseFloat(match[1]) : null,
    load5: match ? parseFloat(match[2]) : null,
    load15: match ? parseFloat(match[3]) : null,
    uptime: uptimeMatch ? uptimeMatch[1].trim() : null,
  };
}

function parseLogs(block) {
  return block
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean)
    .slice(-40)
    .reverse() // newest first
    .map((line) => {
      // journalctl -o short-iso lines start with an ISO timestamp, e.g.
      // "2026-09-05T04:22:20+0000 host sshd[1234]: Accepted password..."
      const isoMatch = line.match(/^(\d{4}-\d{2}-\d{2}T[\d:+\-]+)\s+(.*)$/);
      if (isoMatch) {
        return { timestamp: isoMatch[1], message: isoMatch[2] };
      }
      return { timestamp: null, message: line };
    });
}

async function fetchMetrics(server) {
  const { stdout } = await runCommand(server, METRICS_SCRIPT);

  const memBlock = section(stdout, '___MEM___', '___DISK___');
  const diskBlock = section(stdout, '___DISK___', '___LOAD___');
  const loadBlock = section(stdout, '___LOAD___', '___LOGS___');
  const logsBlock = section(stdout, '___LOGS___', null);

  return {
    fetchedAt: new Date().toISOString(),
    memory: parseMemory(memBlock),
    disk: parseDisk(diskBlock),
    load: parseLoad(loadBlock),
    logs: parseLogs(logsBlock),
  };
}

module.exports = { fetchMetrics };
