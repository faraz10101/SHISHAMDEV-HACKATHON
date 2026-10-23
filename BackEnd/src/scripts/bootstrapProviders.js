// One-time helper: reads AI keys from .env, encrypts them and stores them in MongoDB.
// Run:  npm run providers     Then DELETE the keys from .env.
// You can also add more keys later with POST /api/admin/providers.
require('dotenv').config();
const mongoose = require('mongoose');
const connectDB = require('../config/db');
const AIProvider = require('../models/AIProvider.model');
const { encrypt } = require('../utils/crypto');

// Model names change over time: check Google AI Studio / Groq console and override in .env if needed.
const SOURCES = [
  { env: 'GEMINI_API_KEY', name: 'gemini', type: 'gemini', model: process.env.GEMINI_MODEL || 'gemini-2.5-flash', embedModel: process.env.GEMINI_EMBED_MODEL || 'gemini-embedding-001', priority: 1 },
  { env: 'GROQ_API_KEY', name: 'groq', type: 'openai', baseUrl: 'https://api.groq.com/openai/v1', model: process.env.GROQ_MODEL || 'llama-3.3-70b-versatile', embedModel: '', priority: 5 },
  { env: 'OPENROUTER_API_KEY', name: 'openrouter', type: 'openai', baseUrl: 'https://openrouter.ai/api/v1', model: process.env.OPENROUTER_MODEL || 'meta-llama/llama-3.3-70b-instruct:free', embedModel: '', priority: 8 },
];

(async () => {
  await connectDB();
  let count = 0;
  for (const s of SOURCES) {
    for (const [i, suffix] of ['', '_2', '_3'].entries()) {
      const key = process.env[`${s.env}${suffix}`];
      if (!key) continue;
      const name = `${s.name}${suffix || '_1'}`;
      await AIProvider.findOneAndUpdate(
        { name },
        {
          name, type: s.type, baseUrl: s.baseUrl || '', model: s.model, embedModel: s.embedModel,
          priority: s.priority + i * 0.1, apiKeyEnc: encrypt(key), enabled: true,
          failCount: 0, cooldownUntil: null, lastError: null,
        },
        { upsert: true, setDefaultsOnInsert: true }
      );
      console.log('Saved provider:', name);
      count++;
    }
  }
  if (!count) console.log('No API keys found in .env. Nothing saved.');
  else console.log('Done. Now remove the API keys from .env.');
  await mongoose.disconnect();
})();
