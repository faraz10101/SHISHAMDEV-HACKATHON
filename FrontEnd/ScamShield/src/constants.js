// Mirrors scamshield-backend/config/constants.js
export const SCAM_TYPES = [
  'prize_lottery', 'govt_benefit_fake', 'bank_impersonation', 'mobile_wallet_fraud',
  'courier_delivery', 'job_offer', 'investment_crypto', 'phishing_link',
  'tech_support', 'romance_blackmail', 'other',
];

export const SCAM_LABELS = {
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

// Number of unique reporters needed before a complaint summary can be generated
export const COMPLAINT_MIN_REPORTERS = 20;
