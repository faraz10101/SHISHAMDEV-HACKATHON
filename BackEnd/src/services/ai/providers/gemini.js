const { postJSON } = require('../../../utils/http');

const BASE = 'https://generativelanguage.googleapis.com/v1beta/models';

async function generate({ apiKey, model, system, prompt, timeoutMs }) {
  const data = await postJSON(`${BASE}/${encodeURIComponent(model)}:generateContent`, {
    headers: { 'x-goog-api-key': apiKey },
    timeoutMs,
    body: {
      systemInstruction: { parts: [{ text: system }] },
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      generationConfig: { responseMimeType: 'application/json', temperature: 0.2 },
    },
  });
  const text = data?.candidates?.[0]?.content?.parts?.map((p) => p.text || '').join('');
  if (!text) throw new Error('Empty response from Gemini');
  return text;
}

async function embed({ apiKey, model, text, timeoutMs }) {
  const data = await postJSON(`${BASE}/${encodeURIComponent(model)}:embedContent`, {
    headers: { 'x-goog-api-key': apiKey },
    timeoutMs,
    body: { content: { parts: [{ text }] } },
  });
  const values = data?.embedding?.values;
  if (!Array.isArray(values) || !values.length) throw new Error('Empty embedding from Gemini');
  return values;
}

module.exports = { generate, embed };
