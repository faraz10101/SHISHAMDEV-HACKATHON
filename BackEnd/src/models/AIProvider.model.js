const mongoose = require('mongoose');

// One document per AI API key. The selector tries providers by priority and skips ones cooling down.
const providerSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, unique: true },
    type: { type: String, enum: ['gemini', 'openai'], required: true }, // 'openai' = any OpenAI-compatible API
    baseUrl: { type: String, default: '' },        // required for type 'openai' (e.g. https://api.groq.com/openai/v1)
    model: { type: String, required: true },
    embedModel: { type: String, default: '' },     // empty = this provider is not used for embeddings
    apiKeyEnc: { type: String, required: true, select: false },
    priority: { type: Number, default: 10 },       // lower number is tried first
    enabled: { type: Boolean, default: true },
    failCount: { type: Number, default: 0 },
    successCount: { type: Number, default: 0 },
    cooldownUntil: { type: Date, default: null },
    lastError: { type: String, default: null },
    lastUsedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

module.exports = mongoose.model('AIProvider', providerSchema);
