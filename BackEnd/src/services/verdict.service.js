// LAYER 5: final verdict. AI reads ALL evidence and writes the explanation,
// but hard facts from the database set a minimum risk (AI cannot call a heavily reported number "safe").
// If AI is unavailable, a rule-based verdict is returned (analysisMode = "fallback").
const ai = require('./ai/aiRouter');
const { VERDICT_SYSTEM } = require('./ai/prompts');
const { DISCLAIMER, SCAM_LABELS } = require('../config/constants');

const RANK = { safe: 0, suspicious: 1, scam: 2 };
const LEVEL_RANK = { none: 0, suspicious: 1, dangerous: 2, critical: 3 };
const LEVEL_POINTS = { none: 0, suspicious: 25, dangerous: 45, critical: 60 };
const FLOORS = {
  critical: { verdict: 'scam', score: 92 },
  dangerous: { verdict: 'scam', score: 78 },
  suspicious: { verdict: 'suspicious', score: 45 },
};
const HEADLINES = {
  scam: 'This looks like a scam. Do not click, pay or reply.',
  suspicious: 'This looks suspicious. Be careful.',
  safe: 'No clear warning signs found, but stay careful.',
};
const ACTIONS = {
  scam: [
    'Do not click any link or call back the number.',
    'Never share your OTP, PIN, CNIC or card details with anyone.',
    'Block the sender and delete the message.',
    'If you already paid or shared details, contact your bank or wallet provider immediately.',
    'Report it on ScamShield to warn others.',
  ],
  suspicious: [
    'Do not click links or send money yet.',
    'Check through the official app, website or helpline. Do not use numbers or links from the message.',
    'Never share your OTP, PIN or CNIC.',
    'Report it on ScamShield if it turns out to be fake.',
  ],
  safe: [
    'Still never share your OTP, PIN or CNIC with anyone.',
    'If anything feels wrong, verify with the official source before acting.',
  ],
};

const clamp = (n) => Math.max(0, Math.min(100, Math.round(Number(n) || 0)));
const bandVerdict = (s) => (s >= 70 ? 'scam' : s >= 35 ? 'suspicious' : 'safe');
const COLOR = { scam: 'red', suspicious: 'yellow', safe: 'green' };

function worstLevel(rep) {
  return [...rep.numbers, ...rep.hosts].reduce((w, r) => (LEVEL_RANK[r.level] > LEVEL_RANK[w] ? r.level : w), 'none');
}

function evidenceReasons({ reputation, similar, rules }) {
  const out = [];
  for (const r of reputation.numbers) {
    if (r.uniqueReporters > 0) out.push(`The number ${r.value} has been reported by ${r.uniqueReporters} different ${r.uniqueReporters === 1 ? 'person' : 'people'} on ScamShield.`);
  }
  for (const r of reputation.hosts) {
    if (r.uniqueReporters > 0) out.push(`The website ${r.value} has been reported by ${r.uniqueReporters} different ${r.uniqueReporters === 1 ? 'person' : 'people'} on ScamShield.`);
  }
  if (similar.matchCount > 0) {
    out.push(`The wording closely matches ${similar.matchCount} known scam ${similar.matchCount === 1 ? 'report' : 'reports'}${similar.uniqueReporters > 1 ? ` from ${similar.uniqueReporters} different people` : ''}, even if the number or link is new.`);
  }
  for (const f of rules.findings) if (f.severity === 'high' || f.severity === 'medium') out.push(f.message);
  return out;
}

function fallbackVerdict(ctx) {
  let score = ctx.rules.riskPoints + LEVEL_POINTS[worstLevel(ctx.reputation)];
  if (ctx.similar.uniqueReporters >= 5) score += 40;
  else if (ctx.similar.matchCount > 0) score += 25;
  if (!['other', 'not_scam'].includes(ctx.extracted.scamType)) score += 15;
  score = clamp(score);
  const verdict = bandVerdict(score);
  return { verdict, riskScore: score, headline: HEADLINES[verdict], reasons: [], whatToDo: ACTIONS[verdict] };
}

const validVerdict = (o) =>
  o && ['scam', 'suspicious', 'safe'].includes(o.verdict) && Number.isFinite(Number(o.riskScore)) &&
  typeof o.headline === 'string' && Array.isArray(o.reasons) && Array.isArray(o.whatToDo) && o.whatToDo.length > 0;

async function buildVerdict(ctx) {
  const { content, extracted, rules, reputation, similar } = ctx;
  let result = fallbackVerdict(ctx);
  let mode = 'fallback';

  try {
    const evidence = {
      message: content.slice(0, 1200),
      extracted: {
        numbers: extracted.numbers, links: extracted.hosts, scamType: extracted.scamType,
        impersonatedBrand: extracted.brand, amountMentioned: extracted.amountMentioned, tactics: extracted.tactics,
      },
      linkChecks: rules.findings.map((f) => f.message),
      communityReports: [...reputation.numbers, ...reputation.hosts].map((r) => ({ item: r.value, uniqueReporters: r.uniqueReporters, level: r.level })),
      similarKnownScripts: { count: similar.matchCount, fromPeople: similar.uniqueReporters, type: similar.topScamType, examples: similar.samples },
    };
    const r = await ai.generateJSON({ system: VERDICT_SYSTEM, prompt: JSON.stringify(evidence), validate: validVerdict });
    result = {
      verdict: r.data.verdict,
      riskScore: clamp(r.data.riskScore),
      headline: String(r.data.headline).slice(0, 140),
      reasons: r.data.reasons.map(String).slice(0, 5),
      whatToDo: r.data.whatToDo.map(String).slice(0, 5),
    };
    mode = 'ai';
  } catch { /* keep fallback */ }

  // Hard evidence sets a minimum.
  let floorVerdict = 'safe';
  let floorScore = 0;
  const worst = worstLevel(reputation);
  if (FLOORS[worst]) { floorVerdict = FLOORS[worst].verdict; floorScore = FLOORS[worst].score; }
  if (rules.findings.some((f) => f.severity === 'high') && floorScore < 60) { floorVerdict = RANK[floorVerdict] < 1 ? 'suspicious' : floorVerdict; floorScore = 60; }
  if (similar.uniqueReporters >= 5 && floorScore < 70) { floorVerdict = 'scam'; floorScore = 70; }
  else if (similar.matchCount > 0 && floorScore < 45) { floorVerdict = RANK[floorVerdict] < 1 ? 'suspicious' : floorVerdict; floorScore = 45; }

  result.riskScore = Math.max(result.riskScore, floorScore);
  if (result.riskScore >= 85 && RANK[floorVerdict] < 2) floorVerdict = 'scam';
  if (RANK[floorVerdict] > RANK[result.verdict]) {
    result.verdict = floorVerdict;
    result.headline = HEADLINES[floorVerdict];
    result.whatToDo = ACTIONS[floorVerdict];
  }

  const reasons = [...new Set([...evidenceReasons({ reputation, similar, rules }), ...result.reasons])].slice(0, 7);
  if (!reasons.length) reasons.push('We did not find any known scam signs, but this check is not a guarantee.');

  return {
    verdict: result.verdict,
    level: COLOR[result.verdict],
    riskScore: result.riskScore,
    headline: result.headline,
    reasons,
    whatToDo: result.whatToDo,
    extracted: {
      numbers: extracted.numbers,
      urls: extracted.urls,
      scamType: extracted.scamType,
      scamTypeLabel: SCAM_LABELS[extracted.scamType] || SCAM_LABELS.other,
      brand: extracted.brand,
      amountMentioned: extracted.amountMentioned,
      summary: extracted.summary,
    },
    ruleFindings: rules.findings,
    reputation,
    similar,
    analysisMode: mode,
    disclaimer: DISCLAIMER,
  };
}

module.exports = { buildVerdict };
