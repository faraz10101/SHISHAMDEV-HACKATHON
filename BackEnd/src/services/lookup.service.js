// LAYER 3: community database lookup. Counts UNIQUE reporters, not raw reports.
const Report = require('../models/Report.model');
const { LEVELS } = require('../config/constants');

function levelFor(uniqueReporters) {
  if (uniqueReporters >= LEVELS.CRITICAL_MIN) return 'critical';
  if (uniqueReporters >= LEVELS.DANGEROUS_MIN) return 'dangerous';
  if (uniqueReporters >= LEVELS.SUSPICIOUS_MIN) return 'suspicious';
  return 'none';
}

async function one(field, value) {
  const [r] = await Report.aggregate([
    { $match: { [field]: value } },
    {
      $group: {
        _id: null,
        totalReports: { $sum: 1 },
        reporters: { $addToSet: '$reporterHash' },
        first: { $min: '$createdAt' },
        last: { $max: '$createdAt' },
        scamTypes: { $addToSet: '$scamType' },
      },
    },
  ]);
  const uniqueReporters = r ? r.reporters.length : 0;
  return {
    value,
    totalReports: r ? r.totalReports : 0,
    uniqueReporters,
    level: levelFor(uniqueReporters),
    firstReportedAt: r ? r.first : null,
    lastReportedAt: r ? r.last : null,
    scamTypes: r ? r.scamTypes : [],
  };
}

// field: 'numbers' | 'hosts'
async function reputationFor(field, values = []) {
  return Promise.all(values.slice(0, 5).map((v) => one(field, v)));
}

module.exports = { reputationFor, levelFor };
