const mongoose = require('mongoose');
const { SCAM_TYPES } = require('../config/constants');

const reportSchema = new mongoose.Schema(
  {
    numbers: { type: [String], default: [], index: true },   // scammer phone numbers (normalized)
    hosts: { type: [String], default: [], index: true },     // scam link domains
    urls: { type: [String], default: [] },
    scamType: { type: String, enum: SCAM_TYPES, default: 'other' },
    brand: { type: String, default: null },                  // who the scammer pretended to be
    snippet: { type: String, default: '' },                  // sanitized message text (no personal data)
    scriptHash: { type: String, index: true },
    embedding: { type: [Number], default: [], select: false },
    embedTag: { type: String, default: 'local' },
    localVec: { type: [Number], default: [], select: false },
    reporter: { type: mongoose.Schema.Types.ObjectId, ref: 'User', index: true }, // verified account that filed it (never exposed publicly)
    reporterHash: { type: String, required: true, index: true }, // HMAC(user id): the public "unique reporter" key
    amountLost: { type: Number, default: 0, min: 0 },        // self-reported, unverified
    city: { type: String, default: null },
    isDemo: { type: Boolean, default: false },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

reportSchema.index({ createdAt: -1 });

module.exports = mongoose.model('Report', reportSchema);
