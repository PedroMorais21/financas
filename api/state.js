const crypto = require('crypto');
const { getState, saveState } = require('../_lib');

const eq = (a, b) => {
  a = Buffer.from(String(a || '').trim());
  b = Buffer.from(String(b || '').trim());
  return a.length === b.length && crypto.timingSafeEqual(a, b);
};

function readBody(req) {
  return new Promise((resolve, reject) => {
    let data = '';
    req.on('data', chunk => data += chunk);
    req.on('end', () => {
      try { resolve(data ? JSON.parse(data) : {}); }
      catch (e) { resolve({}); }
    });
    req.on('error', reject);
  });
}

module.exports = async (req, res) => {
  res.setHeader('Cache-Control', 'no-store');
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, PUT, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, x-app-user, x-app-key');

  if (req.method === 'OPTIONS') return res.status(200).end();

  const U = process.env.APP_USER || 'pedro.morais';
  const P = process.env.APP_PASSWORD || '@Pm211020';

  const userOk = eq(String(req.headers['x-app-user'] || '').toLowerCase(), U.toLowerCase());
  const passOk = eq(req.headers['x-app-key'], P);

  if (!userOk || !passOk) {
    return res.status(401).json({ error: 'unauthorized' });
  }

  try {
    if (req.method === 'GET') {
      const data = await getState();
      return res.status(200).json(data);
    }

    if (req.method === 'PUT') {
      const body = await readBody(req);
      if (!body || typeof body !== 'object' || !body.D) {
        return res.status(400).json({ error: 'bad body' });
      }
      await saveState({ D: body.D, L: body.L });
      return res.status(200).json({ ok: true });
    }

    res.status(405).end();
  } catch (e) {
    console.error('state.js error:', e);
    res.status(500).json({ error: String(e) });
  }
};
