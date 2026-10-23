const SCAM_TYPES = [
  'prize_lottery', 'govt_benefit_fake', 'bank_impersonation', 'mobile_wallet_fraud',
  'courier_delivery', 'job_offer', 'investment_crypto', 'phishing_link',
  'tech_support', 'romance_blackmail', 'other', 'not_scam',
];

const SCAM_LABELS = {
  prize_lottery: 'Fake prize or lottery',
  govt_benefit_fake: 'Fake government benefit (BISP, NADRA, etc.)',
  bank_impersonation: 'Fake bank message',
  mobile_wallet_fraud: 'Mobile wallet fraud (Easypaisa, JazzCash, etc.)',
  courier_delivery: 'Fake courier or delivery fee',
  job_offer: 'Fake job offer',
  investment_crypto: 'Investment or crypto scam',
  phishing_link: 'Phishing link',
  tech_support: 'Fake tech support',
  romance_blackmail: 'Romance or blackmail scam',
  other: 'Other suspicious message',
  not_scam: 'No scam detected',
};

module.exports = {
  SCAM_TYPES,
  SCAM_LABELS,
  // unique reporters needed for each community level
  LEVELS: { SUSPICIOUS_MIN: 1, DANGEROUS_MIN: 5, CRITICAL_MIN: 20 },
  // a number is shown on the public homepage only after this many unique reporters
  MIN_PUBLIC_REPORTERS: 3,
  AI_TIMEOUT_MS: 12000,
  SIMILARITY: { AI_THRESHOLD: 0.82, LOCAL_THRESHOLD: 0.6, MAX_SCAN: 3000 },
  DISCLAIMER:
    'ScamShield gives guidance, not a legal or financial ruling. If you are unsure, contact your bank or the official helpline directly.',
};
