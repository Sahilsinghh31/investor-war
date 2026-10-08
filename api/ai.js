'use strict';
// Vercel serverless function: POST /api/ai. The LLM key (LLM_API_KEY) is read server-side only.
const { handle } = require('../lib/ai-service');
const hits = new Map();
module.exports = async (req, res) => {
  res.setHeader('Cache-Control', 'no-store');
  if (req.method !== 'POST') return res.status(405).json({ error: 'method' });
  const ip = String(req.headers['x-forwarded-for'] || 'local').split(',')[0].trim(), now = Date.now();
  const h = (hits.get(ip) || []).filter((t) => now - t < 60000);
  h.push(now); hits.set(ip, h);
  if (h.length > 60) return res.status(429).json({ error: 'rate' });
  try {
    let body = req.body;
    if (typeof body === 'string') { if (body.length > 60000) return res.status(413).json({ error: 'size' }); body = JSON.parse(body); }
    res.status(200).json(await handle(body || {}));
  } catch (e) {
    res.status(e.status || 502).json({ error: e.pub || 'unavailable' }); // never leak raw upstream errors
  }
};
