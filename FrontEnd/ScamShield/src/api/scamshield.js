import axios from 'axios';
import API from './client';

// GET /api/feed?city=  -> homepage "scam weather"
export const getFeed = async (city) => {
  const { data } = await API.get('/feed', { params: city ? { city } : {} });
  return data.data;
};

// POST /api/check  { content }  -> verdict (AI can take a while, so longer timeout)
export const checkContent = async (content) => {
  const { data } = await API.post('/check', { content }, { timeout: 60000 });
  return data.data;
};

// POST /api/reports  (login + verified email) -> { message, data:{ reportId, reputation, complaintReady } }
export const submitReport = async (payload) => {
  const { data } = await API.post('/reports', payload, { timeout: 60000 });
  return data;
};

// GET /api/reports/lookup?q=  -> { numbers:[], hosts:[] }
export const lookupReputation = async (q) => {
  const { data } = await API.get('/reports/lookup', { params: { q } });
  return data.data;
};

// GET /api/reports/complaint?target=  -> { text, summary, uniqueReporters, ... }
export const getComplaint = async (target) => {
  const { data } = await API.get('/reports/complaint', { params: { target }, timeout: 30000 });
  return data.data;
};

/* ---------- Admin (x-admin-key header) ---------- */
const adminClient = (key) => {
  const c = axios.create({
    baseURL: API.defaults.baseURL,
    headers: { 'x-admin-key': key, 'Content-Type': 'application/json' },
    timeout: 30000,
  });
  c.interceptors.response.use((r) => r, (e) =>
    Promise.reject({ message: e.response?.data?.message || (e.response ? 'Request failed.' : 'Cannot reach the server.'), status: e.response?.status })
  );
  return c;
};

export const adminApi = (key) => {
  const c = adminClient(key);
  return {
    list: async () => (await c.get('/admin/providers')).data.data,
    create: async (body) => (await c.post('/admin/providers', body)).data.data,
    update: async (id, patch) => (await c.patch(`/admin/providers/${id}`, patch)).data.data,
    remove: async (id) => (await c.delete(`/admin/providers/${id}`)).data,
    test: async (id) => (await c.post(`/admin/providers/${id}/test`)).data.data,
    resetCooldowns: async () => (await c.post('/admin/providers/reset-cooldowns')).data,
  };
};
