// Text helpers: find phone numbers / links, mask private data, build a "script skeleton".

const URL_RE = /\b(?:https?:\/\/|www\.)[^\s<>"')]+|\b[a-z0-9][a-z0-9-]*(?:\.[a-z0-9-]+)*\.(?:com|net|org|pk|xyz|top|info|link|site|online|club|live|click|shop|vip|app|cc|me|ly|gl|co|tk|ml|ga|cf|gq|work|rest|icu|buzz|cyou|ws|in|us|uk|biz)\b(?:\/[^\s<>"')]*)?/gi;
const PHONE_RE = /(?:\+|00)?\d[\d\s\-().]{8,18}\d/g;

function normalizeNumber(raw, minLen = 10) {
  let d = String(raw || '').replace(/\D/g, '');
  if (d.startsWith('0092')) d = '0' + d.slice(4);
  else if (d.startsWith('92') && d.length === 12) d = '0' + d.slice(2);
  if (d.length < minLen || d.length > 15) return null;
  return d;
}

function stripUrls(text) {
  return String(text || '').replace(URL_RE, ' ');
}

function extractNumbers(text) {
  const out = new Set();
  for (const m of stripUrls(text).matchAll(PHONE_RE)) {
    const n = normalizeNumber(m[0]);
    if (n) out.add(n);
  }
  return [...out];
}

function normalizeUrl(raw) {
  let s = String(raw || '').trim().replace(/[.,;:!?)\]]+$/, '');
  if (!s) return null;
  const insecure = /^http:\/\//i.test(s);
  if (!/^https?:\/\//i.test(s)) s = 'https://' + s;
  try {
    const u = new URL(s);
    const host = u.hostname.toLowerCase().replace(/^www\./, '');
    if (!host.includes('.')) return null;
    return { url: u.href.slice(0, 300), host, insecure };
  } catch {
    return null;
  }
}

function extractUrls(text) {
  const str = String(text || '');
  const seen = new Set();
  const out = [];
  for (const m of str.matchAll(URL_RE)) {
    if (str[m.index - 1] === '@') continue; // part of an email address
    const n = normalizeUrl(m[0]);
    if (!n) continue;
    const key = n.host + new URL(n.url).pathname;
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(n);
  }
  return out;
}

// Removes personal details and defangs links so stored snippets are safe to display.
function sanitizeSnippet(text) {
  return String(text || '')
    .replace(/[\w.+-]+@[\w-]+\.[\w.]+/g, '[email]')
    .replace(URL_RE, (m) => m.replace(/^http/i, 'hxxp').replace(/\./g, '[.]'))
    .replace(PHONE_RE, '[number]')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 500);
}

// Same scam script with a different number/link gives the same skeleton.
function scriptSkeleton(text) {
  return String(text || '')
    .toLowerCase()
    .replace(/[\w.+-]+@[\w-]+\.[\w.]+/g, ' <email> ')
    .replace(URL_RE, ' <url> ')
    .replace(PHONE_RE, ' <num> ')
    .replace(/\d[\d,.]*/g, '#')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 1000);
}

module.exports = {
  URL_RE, normalizeNumber, normalizeUrl, stripUrls,
  extractNumbers, extractUrls, sanitizeSnippet, scriptSkeleton,
};
