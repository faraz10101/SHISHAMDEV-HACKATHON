// Works with any OpenAI-compatible API: Groq, OpenRouter, OpenAI, Together, etc.
const { postJSON } = require('../../../utils/http');

const base = (u) => String(u || '').replace(/\/+$/, '');

async function generate({ apiKey, model, baseUrl, system, prompt, timeoutMs }) {
  const data = await postJSON(`${base(baseUrl)}/chat/completions`, {
    headers: { Authorization: `Bearer ${apiKey}` },
    timeoutMs,
    body: {
      model,
      temperature: 0.2,
      response_format: { type: 'json_object' },
      messages: [
        { role: 'system', content: system },
        { role: 'user', content: prompt },
      ],
    },
  });
  const text = data?.choices?.[0]?.message?.content;
  if (!text) throw new Error('Empty response from provider');
  return text;
}

async function embed({ apiKey, model, baseUrl, text, timeoutMs }) {
  const data = await postJSON(`${base(baseUrl)}/embeddings`, {
    headers: { Authorization: `Bearer ${apiKey}` },
    timeoutMs,
    body: { model, input: text },
  });
  const values = data?.data?.[0]?.embedding;
  if (!Array.isArray(values) || !values.length) throw new Error('Empty embedding from provider');
  return values;
}

module.exports = { generate, embed };
