const crypto = require('crypto');
const { getState, saveState } = require('./_lib');

const eq = (a, b) => {
  a = Buffer.from(String(a || '').trim()); b = Buffer.from(String(b || '').trim());
  return a.length === b.length && crypto.timingSafeEqual(a, b);
};

module.exports = async (req, res) => {
  res.setHeader('Cache-Control', 'no-store');
  // Usuário e senha já vêm embutidos aqui (só o servidor lê este arquivo).
  // Se existirem as variáveis APP_USER / APP_PASSWORD na Vercel, elas têm prioridade.
  const U = process.env.APP_USER || 'pedro.morais', P = process.env.APP_PASSWORD || '@Pm211020';
  if (!eq(String(req.headers['x-app-user'] || '').toLowerCase(), U.toLowerCase()) || !eq(req.headers['x-app-key'], P))
    return res.status(401).json({ error: 'unauthorized' });
  try {
    if (req.method === 'GET') return res.status(200).json(await getState());
    if (req.method === 'PUT') {
      if (!req.body || typeof req.body !== 'object' || !req.body.D) return res.status(400).json({ error: 'bad body' });
      await saveState({ D: req.body.D, L: req.body.L });
      return res.status(200).json({ ok: true });
    }
    res.status(405).end();
  } catch (e) {
    res.status(500).json({ error: String(e) });
  }
};
