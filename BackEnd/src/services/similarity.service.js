// LAYER 4: script similarity. Scammers change numbers but reuse the same wording.
// We embed the message (numbers/links masked) and compare it with stored reports.
const Report = require('../models/Report.model');
const ai = require('./ai/aiRouter');
const { cosine, localEmbed } = require('../utils/similarity');
const { scriptSkeleton } = require('../utils/text');
const { SIMILARITY } = require('../config/constants');

const EMPTY = { matchCount: 0, uniqueReporters: 0, topScamType: null, samples: [], method: null };

async function findSimilar(text) {
  const skeleton = scriptSkeleton(text);
  if (skeleton.length < 15) return EMPTY;

  const local = localEmbed(skeleton);
  const { vector, tag } = await ai.embed(skeleton);

  const docs = await Report.find({ scriptHash: { $exists: true } })
    .sort({ createdAt: -1 })
    .limit(SIMILARITY.MAX_SCAN)
    .select('+embedding +localVec scamType snippet reporterHash embedTag');

  const matches = [];
  for (const d of docs) {
    let score; let method;
    if (d.embedTag === tag && tag !== 'local' && d.embedding?.length) {
      score = cosine(vector, d.embedding); method = 'ai';
      if (score < SIMILARITY.AI_THRESHOLD) continue;
    } else {
      score = cosine(local, d.localVec); method = 'local';
      if (score < SIMILARITY.LOCAL_THRESHOLD) continue;
    }
    matches.push({ score, method, d });
  }
  if (!matches.length) return EMPTY;

  matches.sort((a, b) => b.score - a.score);
  const counts = {};
  for (const m of matches) counts[m.d.scamType] = (counts[m.d.scamType] || 0) + 1;
  const topScamType = Object.entries(counts).sort((a, b) => b[1] - a[1])[0][0];

  return {
    matchCount: matches.length,
    uniqueReporters: new Set(matches.map((m) => m.d.reporterHash)).size,
    topScamType,
    samples: [...new Set(matches.map((m) => m.d.snippet).filter(Boolean))].slice(0, 3),
    method: matches[0].method,
  };
}

module.exports = { findSimilar, EMPTY_SIMILAR: EMPTY };
