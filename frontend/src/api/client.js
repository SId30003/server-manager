const BASE_URL = '/api';

function getToken() {
  return localStorage.getItem('sm_token');
}

async function request(path, { method = 'GET', body, headers = {} } = {}) {
  const token = getToken();
  const res = await fetch(`${BASE_URL}${path}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...headers,
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  let data = null;
  const text = await res.text();
  if (text) {
    try {
      data = JSON.parse(text);
    } catch {
      data = text;
    }
  }

  if (!res.ok) {
    const message = (data && data.error) || `Request failed (${res.status})`;
    throw new Error(message);
  }

  return data;
}

export const api = {
  register: (payload) => request('/auth/register', { method: 'POST', body: payload }),
  login: (payload) => request('/auth/login', { method: 'POST', body: payload }),

  listServers: () => request('/servers'),
  addServer: (payload) => request('/servers', { method: 'POST', body: payload }),
  testServer: (id) => request(`/servers/${id}/test`, { method: 'POST' }),
  deleteServer: (id) => request(`/servers/${id}`, { method: 'DELETE' }),

  listTools: () => request('/tools'),

  getMetrics: (id) => request(`/servers/${id}/metrics`),
};

export function installStreamUrl(toolId, serverId) {
  const token = getToken();
  return `${BASE_URL}/tools/${toolId}/install?serverId=${encodeURIComponent(
    serverId
  )}&token=${encodeURIComponent(token || '')}`;
}

export function terminalWsUrl(serverId) {
  const token = getToken();
  const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
  return `${protocol}//${window.location.host}/ws/terminal?serverId=${encodeURIComponent(
    serverId
  )}&token=${encodeURIComponent(token || '')}`;
}

export { getToken };
