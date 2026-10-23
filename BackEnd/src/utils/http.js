// Small fetch wrapper with timeout. Never puts API keys in URLs or error messages.
async function postJSON(url, { headers = {}, body, timeoutMs = 12000 }) {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...headers },
      body: JSON.stringify(body),
      signal: ctrl.signal,
    });
    const raw = await res.text();
    let data = null;
    try { data = JSON.parse(raw); } catch { /* not json */ }
    if (!res.ok) {
      const msg = (data && (data.error?.message || data.message)) || raw || 'Request failed';
      const err = new Error(`HTTP ${res.status}: ${String(msg).slice(0, 160)}`);
      err.status = res.status;
      throw err;
    }
    return data;
  } catch (err) {
    if (err.name === 'AbortError') {
      const e = new Error('Request timed out');
      e.status = 408;
      throw e;
    }
    throw err;
  } finally {
    clearTimeout(timer);
  }
}

module.exports = { postJSON };
