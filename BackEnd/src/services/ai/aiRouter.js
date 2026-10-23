// Dynamic AI selector. Tries providers stored in MongoDB by priority.
// If one fails (quota, timeout, bad key, bad JSON) it is put on a short cooldown and the next one is tried.
// If everything fails: generateJSON throws AIUnavailableError (callers use rule-based fallbacks),
// embed() falls back to an offline embedding. The user never sees an AI error.
const AIProvider = require('../../models/AIProvider.model');
const { decrypt } = require('../../utils/crypto');
const { localEmbed } = require('../../utils/similarity');
const { AI_TIMEOUT_MS } = require('../../config/constants');
const gemini = require('./providers/gemini');
const openai = require('./providers/openaiCompat');

const adapters = { gemini, openai };

class AIUnavailableError extends Error {
  constructor(details) {
    super('No AI provider is currently available');
    this.name = 'AIUnavailableError';
    this.details = details;
  }
}

async function candidates(capability) {
  const base = { enabled: true };
  if (capability === 'embed') base.embedModel = { $nin: ['', null] };
  const ready = await AIProvider.find({
    ...base,
    $or: [{ cooldownUntil: null }, { cooldownUntil: { $lte: new Date() } }],
  })
    .select('+apiKeyEnc')
    .sort({ priority: 1, failCount: 1 });
  if (ready.length) return ready;
  // Everything is cooling down: still try them, soonest-available first.
  return AIProvider.find(base).select('+apiKeyEnc').sort({ cooldownUntil: 1 }).limit(3);
}

function cooldownMs(err) {
  const s = err.status;
  if (s === 401 || s === 403) return 30 * 60 * 1000; // bad/blocked key
  if (s === 429) return 60 * 1000;                   // quota or rate limit
  if (s === 400 || s === 404) return 2 * 60 * 1000;  // usually a wrong model name
  return 30 * 1000;                                  // timeout / 5xx / bad JSON
}

const markFail = (p, err) =>
  AIProvider.updateOne(
    { _id: p._id },
    {
      $inc: { failCount: 1 },
      $set: { cooldownUntil: new Date(Date.now() + cooldownMs(err)), lastError: String(err.message).slice(0, 200) },
    }
  ).catch(() => {});

const markOk = (p) =>
  AIProvider.updateOne(
    { _id: p._id },
    {
      $set: { failCount: 0, cooldownUntil: null, lastError: null, lastUsedAt: new Date() },
      $inc: { successCount: 1 },
    }
  ).catch(() => {});

function parseJSON(text) {
  const clean = String(text).replace(/```json|```/gi, '').trim();
  try {
    return JSON.parse(clean);
  } catch {
    const a = clean.indexOf('{');
    const b = clean.lastIndexOf('}');
    if (a >= 0 && b > a) return JSON.parse(clean.slice(a, b + 1));
    throw new Error('AI did not return valid JSON');
  }
}

async function generateJSON({ system, prompt, validate }) {
  const list = await candidates('generate');
  const errors = [];
  for (const p of list) {
    try {
      const text = await adapters[p.type].generate({
        apiKey: decrypt(p.apiKeyEnc), model: p.model, baseUrl: p.baseUrl,
        system, prompt, timeoutMs: AI_TIMEOUT_MS,
      });
      const data = parseJSON(text);
      if (validate && !validate(data)) throw new Error('AI response had an unexpected shape');
      await markOk(p);
      return { data, provider: p.name };
    } catch (err) {
      errors.push(`${p.name}: ${err.message}`);
      await markFail(p, err);
    }
  }
  throw new AIUnavailableError(errors);
}

async function embed(text) {
  const input = String(text || '').slice(0, 2000);
  try {
    const list = await candidates('embed');
    for (const p of list) {
      try {
        const vector = await adapters[p.type].embed({
          apiKey: decrypt(p.apiKeyEnc), model: p.embedModel, baseUrl: p.baseUrl,
          text: input, timeoutMs: AI_TIMEOUT_MS,
        });
        await markOk(p);
        return { vector, tag: `${p.type}:${p.embedModel}` };
      } catch (err) {
        await markFail(p, err);
      }
    }
  } catch { /* DB or decrypt problem: use offline embedding */ }
  return { vector: localEmbed(input), tag: 'local' };
}

module.exports = { generateJSON, embed, AIUnavailableError, adapters };
