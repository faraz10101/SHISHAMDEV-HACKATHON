// LAYER 1: pull numbers, links, brand, scam type out of the text.
// Regex always runs; AI enriches it. If AI is down, regex + keywords still work.
const ai = require('./ai/aiRouter');
const { EXTRACT_SYSTEM } = require('./ai/prompts');
const { SCAM_TYPES } = require('../config/constants');
const { extractNumbers, extractUrls, normalizeNumber, normalizeUrl } = require('../utils/text');

const TYPE_KEYWORDS = [
  ['mobile_wallet_fraud', /easypaisa|easy paisa|jazzcash|jazz cash|sadapay|nayapay|\botp\b|\bmpin\b/i],
  ['govt_benefit_fake', /bisp|ehsaas|benazir|nadra|\bfbr\b|subsid/i],
  ['prize_lottery', /prize|lottery|winner|you have won|jeet|inam/i],
  ['bank_impersonation', /\bbank\b|debit card|\batm\b|account.{0,20}(block|suspend)|\bhbl\b|\bubl\b|\bmcb\b|meezan/i],
  ['courier_delivery', /courier|parcel|delivery|\btcs\b|leopards|customs/i],
  ['job_offer', /work from home|part[- ]time job|daily income|job offer/i],
  ['investment_crypto', /crypto|bitcoin|usdt|forex|double your money|profit/i],
];

const BRANDS = {
  easypaisa: 'Easypaisa', jazzcash: 'JazzCash', sadapay: 'SadaPay', nayapay: 'NayaPay',
  bisp: 'BISP', nadra: 'NADRA', ehsaas: 'Ehsaas', hbl: 'HBL', ubl: 'UBL', mcb: 'MCB',
  meezan: 'Meezan Bank', tcs: 'TCS', leopards: 'Leopards Courier', daraz: 'Daraz', fbr: 'FBR', pta: 'PTA',
};

function heuristicType(text) {
  for (const [type, re] of TYPE_KEYWORDS) if (re.test(text)) return type;
  return 'other';
}

function heuristicBrand(text) {
  const t = text.toLowerCase();
  for (const [k, name] of Object.entries(BRANDS)) {
    if (new RegExp(`\\b${k}\\b`).test(t)) return name;
  }
  return null;
}

const validExtract = (o) => o && typeof o === 'object' && typeof o.scamType === 'string';

// Fast, no-AI extraction (used for lookups)
function extractBasic(text) {
  const urls = extractUrls(text);
  return { numbers: extractNumbers(text), urls, hosts: [...new Set(urls.map((u) => u.host))] };
}

async function extract(text, { manualNumbers = [] } = {}) {
  const basic = extractBasic(text);
  const numbers = new Set([...basic.numbers, ...manualNumbers]);
  const urls = [...basic.urls];

  let aiOut = null;
  try {
    const r = await ai.generateJSON({ system: EXTRACT_SYSTEM, prompt: String(text).slice(0, 2000), validate: validExtract });
    aiOut = r.data;
  } catch { /* fall back to regex + keywords */ }

  if (aiOut) {
    const digits = String(text).replace(/\D/g, '');
    for (const raw of aiOut.phoneNumbers || []) {
      const n = normalizeNumber(raw);
      if (n && digits.includes(n.slice(-10))) numbers.add(n); // only numbers really present in the text
    }
    const lower = String(text).toLowerCase();
    for (const raw of aiOut.urls || []) {
      const u = normalizeUrl(raw);
      if (u && lower.includes(u.host) && !urls.some((x) => x.host === u.host)) urls.push(u);
    }
  }

  const scamType = aiOut && SCAM_TYPES.includes(aiOut.scamType) ? aiOut.scamType : heuristicType(String(text));
  return {
    numbers: [...numbers],
    urls,
    hosts: [...new Set(urls.map((u) => u.host))],
    scamType,
    brand: (aiOut && aiOut.impersonatedBrand) || heuristicBrand(String(text)),
    amountMentioned: aiOut?.amountMentioned || null,
    tactics: Array.isArray(aiOut?.urgencyTactics) ? aiOut.urgencyTactics.slice(0, 5).map(String) : [],
    summary: aiOut?.summary || null,
    usedAI: !!aiOut,
  };
}

module.exports = { extract, extractBasic };
