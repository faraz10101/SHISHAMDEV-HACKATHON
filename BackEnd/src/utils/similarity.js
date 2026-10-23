function cosine(a, b) {
  if (!a || !b || !a.length || a.length !== b.length) return 0;
  let dot = 0, na = 0, nb = 0;
  for (let i = 0; i < a.length; i++) { dot += a[i] * b[i]; na += a[i] * a[i]; nb += b[i] * b[i]; }
  return dot / (Math.sqrt(na) * Math.sqrt(nb) || 1);
}

function fnv(str) {
  let h = 0x811c9dc5;
  for (let i = 0; i < str.length; i++) { h ^= str.charCodeAt(i); h = Math.imul(h, 0x01000193) >>> 0; }
  return h >>> 0;
}

// Offline "embedding" (hashed words + character trigrams). Used when no AI provider is reachable,
// and stored on every report so similarity always works.
function localEmbed(text, dims = 256) {
  const t = String(text || '').toLowerCase().replace(/[^\p{L}\p{N}#<>\s]/gu, ' ').replace(/\s+/g, ' ').trim();
  const v = new Array(dims).fill(0);
  if (!t) return v;
  for (const w of t.split(' ')) v[fnv('w:' + w) % dims] += 2;
  const p = ` ${t} `;
  for (let i = 0; i < p.length - 2; i++) v[fnv('t:' + p.slice(i, i + 3)) % dims] += 1;
  const n = Math.sqrt(v.reduce((s, x) => s + x * x, 0)) || 1;
  return v.map((x) => x / n);
}

module.exports = { cosine, localEmbed };
