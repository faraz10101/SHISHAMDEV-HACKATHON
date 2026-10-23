const Report = require('../models/Report.model');
const ai = require('../services/ai/aiRouter');
const { extract, extractBasic } = require('../services/extract.service');
const { reputationFor } = require('../services/lookup.service');
const { buildComplaintPack } = require('../services/complaint.service');
const { clearFeedCache } = require('../services/feed.service');
const { localEmbed } = require('../utils/similarity');
const { scriptSkeleton, sanitizeSnippet, normalizeNumber } = require('../utils/text');
const { sha1 } = require('../utils/crypto');
const { LEVELS } = require('../config/constants');

// POST /api/reports
exports.createReport = async (req, res) => {
  const { message, url, numbers: manual, amountLost, city, scamType } = req.body;

  const manualNumbers = manual.map((n) => normalizeNumber(n, 7)).filter(Boolean);
  const text = [message, url].filter(Boolean).join('\n');
  const extracted = await extract(text || manualNumbers.join(' '), { manualNumbers });

  const numbers = extracted.numbers;
  const hosts = extracted.hosts;
  const skeleton = scriptSkeleton(message);
  const hasScript = skeleton.length >= 20;

  if (!numbers.length && !hosts.length && !hasScript) {
    return res.status(400).json({ success: false, message: "We could not find a phone number, link or enough message text. Please add the scammer's number, the link, or the full message." });
  }

  const scriptHash = hasScript ? sha1(skeleton) : undefined;
  const dupConditions = [];
  if (numbers.length) dupConditions.push({ numbers: { $in: numbers } });
  if (hosts.length) dupConditions.push({ hosts: { $in: hosts } });
  if (scriptHash) dupConditions.push({ scriptHash });
  const duplicate = await Report.exists({ reporterHash: req.reporterHash, $or: dupConditions });
  if (duplicate && process.env.ALLOW_REPEAT_REPORTS !== 'true') {
    return res.status(409).json({ success: false, message: 'You have already reported this. Thank you, one report per person is enough.' });
  }

  let embedding = [];
  let embedTag = 'local';
  if (hasScript) {
    const e = await ai.embed(skeleton);
    embedding = e.vector;
    embedTag = e.tag;
  }

  const report = await Report.create({
    numbers, hosts,
    urls: extracted.urls.map((u) => u.url),
    scamType: scamType || extracted.scamType,
    brand: extracted.brand,
    snippet: sanitizeSnippet(message),
    scriptHash,
    embedding, embedTag,
    localVec: hasScript ? localEmbed(skeleton) : [],
    reporter: req.user._id,
    reporterHash: req.reporterHash,
    amountLost, city,
  });
  clearFeedCache();

  const [nRep, hRep] = await Promise.all([reputationFor('numbers', numbers), reputationFor('hosts', hosts)]);
  const complaintReady = [...nRep, ...hRep].some((r) => r.uniqueReporters >= LEVELS.CRITICAL_MIN);

  res.status(201).json({
    success: true,
    message: 'Thank you! Your report was added and will help warn other people.',
    data: { reportId: report._id, reputation: { numbers: nRep, hosts: hRep }, complaintReady },
  });
};

// GET /api/reports/lookup?q=<number or link>   (no AI, fast)
exports.lookup = async (req, res) => {
  const q = String(req.query.q || '').trim();
  if (q.length < 3) return res.status(400).json({ success: false, message: 'Please enter a phone number or a link.' });
  const basic = extractBasic(q);
  const numbers = basic.numbers.length ? basic.numbers : [normalizeNumber(q, 7)].filter(Boolean);
  const [nRep, hRep] = await Promise.all([reputationFor('numbers', numbers), reputationFor('hosts', basic.hosts)]);
  if (!nRep.length && !hRep.length) {
    return res.status(400).json({ success: false, message: 'We could not find a valid phone number or link in what you entered.' });
  }
  res.json({ success: true, data: { numbers: nRep, hosts: hRep } });
};

// GET /api/reports/complaint?target=<number or link>
exports.complaint = async (req, res) => {
  const q = String(req.query.target || '').trim();
  const basic = extractBasic(q);
  const num = basic.numbers[0] || normalizeNumber(q, 7);
  const kind = num ? 'number' : basic.hosts[0] ? 'host' : null;
  if (!kind) return res.status(400).json({ success: false, message: 'Please provide a phone number or a link.' });
  const pack = await buildComplaintPack(kind, num || basic.hosts[0]);
  res.json({ success: true, data: pack });
};
