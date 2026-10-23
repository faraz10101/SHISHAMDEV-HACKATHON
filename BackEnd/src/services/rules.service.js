// LAYER 2: plain code checks on links (no AI). Fast, free, always available.

const SHORTENERS = new Set(['bit.ly', 'tinyurl.com', 't.co', 'cutt.ly', 'rb.gy', 'is.gd', 'goo.gl', 'ow.ly', 'shorturl.at', 'tiny.cc', 'buff.ly', 'rebrand.ly', 's.id', 't.ly']);
const RISKY_TLDS = ['.xyz', '.top', '.click', '.link', '.live', '.vip', '.tk', '.ml', '.ga', '.cf', '.gq', '.work', '.rest', '.icu', '.buzz', '.cyou', '.ws'];

// TODO(before demo): double-check these official domains on each organisation's real website.
const BRANDS = {
  easypaisa: { name: 'Easypaisa', domains: ['easypaisa.com.pk'] },
  jazzcash: { name: 'JazzCash', domains: ['jazzcash.com.pk'] },
  nadra: { name: 'NADRA', domains: ['nadra.gov.pk'] },
  bisp: { name: 'BISP', domains: ['bisp.gov.pk'] },
  hbl: { name: 'HBL', domains: ['hbl.com'] },
  ubl: { name: 'UBL', domains: ['ubl.com.pk'] },
  mcb: { name: 'MCB', domains: ['mcb.com.pk'] },
  meezan: { name: 'Meezan Bank', domains: ['meezanbank.com'] },
  daraz: { name: 'Daraz', domains: ['daraz.pk'] },
  tcs: { name: 'TCS', domains: ['tcs.com.pk'] },
  pta: { name: 'PTA', domains: ['pta.gov.pk'] },
};

const POINTS = { high: 35, medium: 20, low: 8, info: 0 };

function deleet(s, oneAs = 'i') {
  return s.replace(/0/g, 'o').replace(/1/g, oneAs).replace(/3/g, 'e').replace(/4/g, 'a').replace(/5/g, 's').replace(/@/g, 'a').replace(/\$/g, 's');
}

function levenshtein(a, b) {
  const dp = Array.from({ length: a.length + 1 }, (_, i) => [i, ...Array(b.length).fill(0)]);
  for (let j = 0; j <= b.length; j++) dp[0][j] = j;
  for (let i = 1; i <= a.length; i++) {
    for (let j = 1; j <= b.length; j++) {
      dp[i][j] = Math.min(dp[i - 1][j] + 1, dp[i][j - 1] + 1, dp[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
    }
  }
  return dp[a.length][b.length];
}

const isOfficial = (host, domains) => domains.some((d) => host === d || host.endsWith('.' + d));

function analyzeLinks(urls = [], claimedBrand = null) {
  const findings = [];
  const add = (code, severity, message, host) => findings.push({ code, severity, message, host });

  for (const { host, insecure } of urls) {
    const labels = host.split(/[.\-]/).filter(Boolean);
    const compact = host.replace(/[.\-]/g, '');

    if (SHORTENERS.has(host)) add('SHORTENER', 'medium', `${host} is a link shortener. It hides where the link really goes.`, host);
    if (/^\d{1,3}(\.\d{1,3}){3}$/.test(host)) add('IP_HOST', 'high', 'The link uses a raw IP address instead of a real website name.', host);
    if (host.includes('xn--')) add('PUNYCODE', 'high', 'The website name uses look-alike characters to imitate another site.', host);
    if (RISKY_TLDS.some((t) => host.endsWith(t))) add('RISKY_TLD', 'medium', `Websites ending in ".${host.split('.').pop()}" are often used in scams.`, host);
    if (host.split('.').length > 4 || (host.match(/-/g) || []).length >= 3) add('MESSY_HOST', 'low', 'The website name looks unusually long or messy.', host);
    if (insecure) add('NO_HTTPS', 'low', 'The link does not use a secure (HTTPS) connection.', host);

    for (const [key, b] of Object.entries(BRANDS)) {
      if (isOfficial(host, b.domains)) { add('OFFICIAL', 'info', `This is the official ${b.name} website.`, host); continue; }
      const short = key.length < 5;
      const contains = short
        ? labels.some((l) => deleet(l) === key)
        : [deleet(compact, 'i'), deleet(compact, 'l')].some((v) => v.includes(key));
      const typo = !short && labels.some((l) => {
        const d = levenshtein(deleet(l), key);
        return d > 0 && d <= 1 && Math.abs(l.length - key.length) <= 1;
      });
      if (contains || typo) {
        add('LOOKALIKE', 'high', `This website pretends to be ${b.name} but is NOT its official website.`, host);
      }
    }
  }

  if (claimedBrand) {
    const cb = String(claimedBrand).toLowerCase();
    for (const [key, b] of Object.entries(BRANDS)) {
      if (!cb.includes(key)) continue;
      const bad = urls.filter((u) => !isOfficial(u.host, b.domains));
      if (urls.length && bad.length === urls.length) {
        add('BRAND_MISMATCH', 'medium', `The message claims to be from ${b.name}, but its link does not go to ${b.name}'s official website.`, bad[0].host);
      }
    }
  }

  // de-duplicate identical messages for the same host
  const seen = new Set();
  const unique = findings.filter((f) => { const k = f.code + f.host; if (seen.has(k)) return false; seen.add(k); return true; });
  const riskPoints = Math.min(100, unique.reduce((s, f) => s + POINTS[f.severity], 0));
  return { findings: unique, riskPoints };
}

module.exports = { analyzeLinks };
