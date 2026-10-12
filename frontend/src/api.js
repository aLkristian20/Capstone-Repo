const API = import.meta.env.VITE_API_URL || 'http://localhost:4000/api';
async function request(path, options = {}) {
  let response;
  try { response = await fetch(`${API}${path}`, { ...options, headers: { 'Content-Type': 'application/json', ...options.headers } }); }
  catch { throw new Error('Cannot reach the backend API. Start the backend server and try again.'); }
  const body = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(body.error || `Request failed (${response.status}).`);
  return body;
}
export const api = {
  summary: () => request('/dashboard/summary'),
  alerts: () => request('/alerts'),
  alert: (id) => request(`/alerts/${id}`),
  updateAlert: (id, data) => request(`/alerts/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
  households: () => request('/households'),
  createHousehold: (data) => request('/households', { method: 'POST', body: JSON.stringify(data) }),
  status: () => request('/status')
};
