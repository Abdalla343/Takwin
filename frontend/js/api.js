const API_BASE = '';

function getToken() {
  return localStorage.getItem('token');
}

function setAuth(user) {
  localStorage.setItem('token', user.token);
  localStorage.setItem('role', user.role);
  localStorage.setItem('name', user.name);
}

function clearAuth() {
  localStorage.removeItem('token');
  localStorage.removeItem('role');
  localStorage.removeItem('name');
}

function logout() {
  clearAuth();
  window.location.href = '/frontend/index.html';
}

async function api(path, options = {}) {
  const headers = options.headers || {};
  headers['Content-Type'] = 'application/json';
  const token = getToken();
  if (token) headers['Authorization'] = 'Bearer ' + token;
  const res = await fetch(API_BASE + path, { ...options, headers });
  if (!res.ok) {
    let msg = 'Request failed';
    try { const data = await res.json(); msg = data.message || msg; } catch {}
    throw new Error(msg);
  }
  try { return await res.json(); } catch { return null; }
}
