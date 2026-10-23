// Homepage "scam weather" feed: what is happening today.
const Report = require('../models/Report.model');
const ai = require('./ai/aiRouter');
const { SUMMARY_SYSTEM } = require('./ai/prompts');
const { SCAM_LABELS, MIN_PUBLIC_REPORTERS } = require('../config/constants');

const DAY = 86400000;
const PKT_OFFSET = 5 * 3600000; // Pakistan time, UTC+5, no daylight saving

const startOfTodayPKT = () => new Date(Math.floor((Date.now() + PKT_OFFSET) / DAY) * DAY - PKT_OFFSET);
const pktDate = (d) => new Date(d.getTime() + PKT_OFFSET).toISOString().slice(0, 10);
const escapeRe = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const label = (t) => SCAM_LABELS[t] || SCAM_LABELS.other;

const feedCache = new Map();    // key -> { at, data }
const summaryCache = new Map(); // key -> { at, value }

async function summarize(key, stats, fallback) {
  const hit = summaryCache.get(key);
  if (hit && Date.now() - hit.at < 30 * 60 * 1000) return hit.value;
  let value = { ...fallback, mode: 'fallback' };
  if (stats.reportsToday >= 3) {
    try {
      const r = await ai.generateJSON({
        system: SUMMARY_SYSTEM,
        prompt: JSON.stringify(stats),
        validate: (o) => o && typeof o.headline === 'string' && typeof o.summary === 'string' && Array.isArray(o.tips),
      });
      value = { headline: r.data.headline, summary: r.data.summary, tips: r.data.tips.slice(0, 3).map(String), mode: 'ai' };
    } catch { /* keep fallback */ }
  }
  summaryCache.set(key, { at: Date.now(), value });
  return value;
}

async function buildFeed(city) {
  const start = startOfTodayPKT();
  const cityFilter = city ? { city: new RegExp(`^${escapeRe(city)}$`, 'i') } : {};
  const today = { createdAt: { $gte: start }, ...cityFilter };
  const week = { createdAt: { $gte: new Date(start.getTime() - 6 * DAY) }, ...cityFilter };

  const [totals, byType, topNumbers, trending, trend, recent, topCities] = await Promise.all([
    Report.aggregate([
      { $match: today },
      { $group: { _id: null, reports: { $sum: 1 }, reporters: { $addToSet: '$reporterHash' }, lost: { $sum: '$amountLost' } } },
    ]),
    Report.aggregate([
      { $match: today },
      { $group: { _id: '$scamType', reports: { $sum: 1 }, reporters: { $addToSet: '$reporterHash' } } },
      { $project: { _id: 0, type: '$_id', reports: 1, people: { $size: '$reporters' } } },
      { $sort: { reports: -1 } }, { $limit: 6 },
    ]),
    Report.aggregate([
      { $match: today }, { $unwind: '$numbers' },
      { $group: { _id: '$numbers', reporters: { $addToSet: '$reporterHash' }, scamType: { $first: '$scamType' } } },
      { $project: { _id: 0, number: '$_id', scamType: 1, uniqueReporters: { $size: '$reporters' } } },
      { $match: { uniqueReporters: { $gte: MIN_PUBLIC_REPORTERS } } },
      { $sort: { uniqueReporters: -1 } }, { $limit: 5 },
    ]),
    Report.aggregate([
      { $match: { ...today, brand: { $ne: null } } },
      { $group: { _id: { type: '$scamType', brand: '$brand' }, reports: { $sum: 1 } } },
      { $project: { _id: 0, type: '$_id.type', brand: '$_id.brand', reports: 1 } },
      { $sort: { reports: -1 } }, { $limit: 5 },
    ]),
    Report.aggregate([
      { $match: week },
      { $group: { _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt', timezone: 'Asia/Karachi' } }, reports: { $sum: 1 } } },
    ]),
    Report.find(today).sort({ createdAt: -1 }).limit(8).select('scamType brand snippet city createdAt'),
    Report.aggregate([
      { $match: { ...week, city: { $ne: null } } },
      { $group: { _id: '$city', reports: { $sum: 1 } } },
      { $project: { _id: 0, city: '$_id', reports: 1 } },
      { $sort: { reports: -1 } }, { $limit: 5 },
    ]),
  ]);

  const t = totals[0];
  const reportsToday = t ? t.reports : 0;
  const trendMap = new Map(trend.map((r) => [r._id, r.reports]));
  const last7Days = [];
  for (let i = 6; i >= 0; i--) {
    const d = pktDate(new Date(start.getTime() - i * DAY));
    last7Days.push({ date: d, reports: trendMap.get(d) || 0 });
  }

  const labelled = byType.map((r) => ({ ...r, label: label(r.type) }));
  const fallback = reportsToday
    ? {
        headline: `${reportsToday} scam ${reportsToday === 1 ? 'report' : 'reports'} today`,
        summary: `Most common today: ${labelled[0].label}. Be careful with unknown messages and calls.`,
        tips: ['Never share your OTP, PIN or CNIC.', 'Check with the official app or helpline before paying anyone.'],
      }
    : { headline: 'No scam reports yet today', summary: 'Stay alert anyway. Scammers can strike at any time.', tips: ['Never share your OTP, PIN or CNIC.'] };

  const stats = {
    date: pktDate(start), reportsToday, peopleReported: t ? t.reporters.length : 0,
    topTypes: labelled.slice(0, 3).map((r) => ({ type: r.label, reports: r.reports })),
    trending: trending.slice(0, 3).map((r) => ({ brand: r.brand, type: label(r.type), reports: r.reports })),
    city: city || 'all of Pakistan',
  };
  const bulletin = await summarize(`${stats.date}:${reportsToday}:${city || ''}`, stats, fallback);

  return {
    date: pktDate(start),
    timezone: 'Asia/Karachi',
    city: city || null,
    totals: { reportsToday, peopleReported: t ? t.reporters.length : 0, reportedLossToday: t ? t.lost : 0 },
    headline: bulletin.headline,
    summary: bulletin.summary,
    tips: bulletin.tips,
    byType: labelled,
    trending: trending.map((r) => ({ ...r, label: label(r.type) })),
    topNumbers: topNumbers.map((r) => ({ ...r, label: label(r.scamType) })),
    last7Days,
    topCities,
    recent: recent.map((r) => ({ type: r.scamType, label: label(r.scamType), brand: r.brand, snippet: r.snippet, city: r.city, createdAt: r.createdAt })),
    summaryMode: bulletin.mode,
    generatedAt: new Date(),
  };
}

async function getFeed(city) {
  const key = (city || '').toLowerCase();
  const hit = feedCache.get(key);
  if (hit && Date.now() - hit.at < 60 * 1000) return hit.data;
  const data = await buildFeed(city);
  feedCache.set(key, { at: Date.now(), data });
  return data;
}

const clearFeedCache = () => feedCache.clear();

module.exports = { getFeed, clearFeedCache, startOfTodayPKT };
