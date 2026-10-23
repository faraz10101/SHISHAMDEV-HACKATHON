// Fills the database with CLEARLY FAKE demo reports so the homepage and checker have data.
//   npm run seed          add demo data
//   npm run seed:reset    remove demo data only
// Tell judges in your video that this is seeded demo data.
require('dotenv').config();
const crypto = require('crypto');
const mongoose = require('mongoose');
const connectDB = require('../config/db');
const Report = require('../models/Report.model');
const ai = require('../services/ai/aiRouter');
const { scriptSkeleton, sanitizeSnippet } = require('../utils/text');
const { localEmbed } = require('../utils/similarity');
const { sha1 } = require('../utils/crypto');
const { startOfTodayPKT } = require('../services/feed.service');

const CITIES = ['Hyderabad', 'Karachi', 'Lahore', 'Islamabad', 'Faisalabad'];

const SCENARIOS = [
  { type: 'mobile_wallet_fraud', brand: 'Easypaisa', number: '03000000001', count: 24, today: 6,
    text: 'Easypaisa Alert: your account will be blocked in 24 hours. Send your OTP and CNIC to {num} to keep it active.' },
  { type: 'govt_benefit_fake', brand: 'BISP', number: '03000000002', host: 'bisp-claim-payment.top', count: 11, today: 4,
    text: 'Congratulations! Your BISP payment of Rs 25,000 is approved. Verify your CNIC now at {url} or your payment will be cancelled.' },
  { type: 'courier_delivery', brand: 'TCS', host: 'tcs-parcel-fee.click', count: 7, today: 3,
    text: 'Your parcel is held at customs. Pay Rs 150 delivery fee at {url} today or it will be returned.' },
  { type: 'prize_lottery', brand: null, number: '03000000004', count: 3, today: 1,
    text: 'You have won a Rs 500,000 lottery prize. Call {num} and send a small fee to claim it.' },
  { type: 'job_offer', brand: null, number: '03000000005', count: 2, today: 0,
    text: 'Work from home, earn Rs 5,000 daily. WhatsApp {num} now, limited seats.' },
];

(async () => {
  await connectDB();
  if (process.argv.includes('--reset')) {
    const r = await Report.deleteMany({ isDemo: true });
    console.log('Removed demo reports:', r.deletedCount);
    return mongoose.disconnect();
  }
  await Report.deleteMany({ isDemo: true });

  const start = startOfTodayPKT().getTime();
  const now = Date.now();
  const docs = [];

  for (const s of SCENARIOS) {
    const sample = s.text.replace('{num}', s.number || '').replace('{url}', s.host ? `https://${s.host}/verify` : '');
    const skeleton = scriptSkeleton(sample);
    const { vector, tag } = await ai.embed(skeleton); // one embedding per script, reused for all its reports
    const local = localEmbed(skeleton);
    for (let i = 0; i < s.count; i++) {
      const isToday = i < s.today;
      const createdAt = isToday
        ? new Date(start + Math.random() * Math.max(now - start, 60000))
        : new Date(now - (1 + Math.random() * 6) * 86400000);
      docs.push({
        numbers: s.number ? [s.number] : [],
        hosts: s.host ? [s.host] : [],
        urls: s.host ? [`https://${s.host}/verify`] : [],
        scamType: s.type, brand: s.brand,
        snippet: sanitizeSnippet(sample),
        scriptHash: sha1(skeleton),
        embedding: vector, embedTag: tag, localVec: local,
        reporterHash: crypto.randomBytes(16).toString('hex'),
        amountLost: Math.random() < 0.4 ? Math.round((500 + Math.random() * 19500) / 100) * 100 : 0,
        city: CITIES[Math.floor(Math.random() * CITIES.length)],
        isDemo: true, createdAt,
      });
    }
  }
  await Report.insertMany(docs);
  console.log(`Seeded ${docs.length} demo reports. Number 03000000001 has 24 unique reporters (complaint pack unlocked).`);
  await mongoose.disconnect();
})();
