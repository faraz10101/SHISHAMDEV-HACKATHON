import API from './client';

// POST /api/auth/register -> { email, expiresIn }
export const registerUser = async ({ username, email, password }) => {
  try {
    const { data } = await API.post('/auth/register', { username, email, password });
    return data;
  } catch (err) {
    // 429 "a code was just sent" still carries the email -> user can continue to the code screen
    throw { ...err, email: err.email };
  }
};

// POST /api/auth/verify-email -> { token, user } (user is logged in afterwards)
export const verifyEmail = async (email, code) => {
  const { data } = await API.post('/auth/verify-email', { email: email.trim().toLowerCase(), code: String(code) });
  if (data.token) localStorage.setItem('token', data.token);
  return data;
};

// POST /api/auth/resend-code
export const resendCode = async (email) => {
  const { data } = await API.post('/auth/resend-code', { email: email.trim().toLowerCase() });
  return data;
};

// POST /api/auth/login  (unverified account -> rejects with action: 'verify', email)
export const loginUser = async ({ username, password }) => {
  const id = username.trim();
  const body = id.includes('@') ? { email: id, password } : { username: id, password };
  const { data } = await API.post('/auth/login', body);
  if (data.token) localStorage.setItem('token', data.token);
  return data;
};

// GET /api/auth/me -> restores the session on page load (null when not logged in)
export const getCurrentUser = async () => {
  try {
    const { data } = await API.get('/auth/me');
    return data.user;
  } catch {
    localStorage.removeItem('token');
    return null;
  }
};

// POST /api/auth/logout
export const logoutUser = async () => {
  try { await API.post('/auth/logout'); } catch { /* ignore, we clear locally anyway */ }
  localStorage.removeItem('token');
};
