const BASE = import.meta.env.VITE_API_URL || 'http://localhost:3001';

async function req(method, path, body) {
  const res = await fetch(`${BASE}/api${path}`, {
    method,
    headers: { 'Content-Type': 'application/json' },
    body: body ? JSON.stringify(body) : undefined,
  });
  return res.json();
}

export const healthCheck    = ()     => req('GET',  '/health');
export const getLeaderboard = ()     => req('GET',  '/leaderboard');
export const saveScore      = (data) => req('POST', '/leaderboard', data);