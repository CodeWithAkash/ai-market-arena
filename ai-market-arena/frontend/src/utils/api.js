import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

const api = axios.create({
  baseURL: `${API_URL}/api`,
  timeout: 10000,
});

export const createSession = async (selectedAgents, startingCash = 10000) => {
  const res = await api.post('/sessions', { selectedAgents, startingCash });
  return res.data;
};

export const getSession = async (id) => {
  const res = await api.get(`/sessions/${id}`);
  return res.data;
};

export const playerBuy = async (sessionId, ticker, shares) => {
  const res = await api.post(`/sessions/${sessionId}/buy`, { ticker, shares });
  return res.data;
};

export const playerSell = async (sessionId, ticker, shares) => {
  const res = await api.post(`/sessions/${sessionId}/sell`, { ticker, shares });
  return res.data;
};

export const saveScore = async (data) => {
  const res = await api.post('/leaderboard', data);
  return res.data;
};

export const getLeaderboard = async () => {
  const res = await api.get('/leaderboard');
  return res.data;
};

export const healthCheck = async () => {
  const res = await api.get('/health');
  return res.data;
};
