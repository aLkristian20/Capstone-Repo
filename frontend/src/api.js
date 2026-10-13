const API = (import.meta.env.VITE_API_BASE_URL || 'http://localhost:4000/api').replace(/\/+$/, '');
async function request(path, options = {}) {
  let response;
  try { response = await fetch(`${API}${path}`, { ...options, headers: { 'Content-Type': 'application/json', ...options.headers } }); }
  catch { throw new Error('Cannot reach the backend API. Start the backend server and try again.'); }
  const body = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(body.error || `Request failed (${response.status}).`);
  return body;
}
export const api = {
  stats: () => request('/dashboard/stats'),
  alerts: () => request('/alerts'),
  recentActivity: () => request('/activity/recent'),
  alert: (id) => request(`/alerts/${id}`),
  updateAlert: (id, data, officialKey) => request(`/alerts/${id}`, { method: 'PATCH', headers: { 'x-official-key': officialKey }, body: JSON.stringify(data) }),
  markAlertRead: (id) => request(`/alerts/${id}/read`, { method: 'PATCH' }),
  households: () => request('/households'),
  createHousehold: (data) => request('/households', { method: 'POST', body: JSON.stringify(data) }),
  status: () => request('/status')
};
