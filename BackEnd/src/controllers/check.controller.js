// POST /api/check — runs the full 5-layer pipeline.
const { extract } = require('../services/extract.service');
const { analyzeLinks } = require('../services/rules.service');
const { reputationFor } = require('../services/lookup.service');
const { findSimilar, EMPTY_SIMILAR } = require('../services/similarity.service');
const { buildVerdict } = require('../services/verdict.service');
const { stripUrls } = require('../utils/text');

exports.checkContent = async (req, res) => {
  const { content } = req.body;

  const extracted = await extract(content);                                   // L1 (AI + regex)
  const rules = analyzeLinks(extracted.urls, extracted.brand);                // L2 (code)
  const [numbers, hosts] = await Promise.all([                                // L3 (database)
    reputationFor('numbers', extracted.numbers),
    reputationFor('hosts', extracted.hosts),
  ]);
  const hasWording = stripUrls(content).replace(/[\d\s+\-().]/g, '').length >= 20;
  const similar = hasWording ? await findSimilar(content) : EMPTY_SIMILAR;    // L4 (embeddings)

  const data = await buildVerdict({ content, extracted, rules, reputation: { numbers, hosts }, similar }); // L5
  res.json({ success: true, data });
};
