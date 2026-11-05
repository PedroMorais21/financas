const crypto = require('crypto');
const { getState, saveState } = require('./_lib');

const nowMonth = () => new Date().toLocaleDateString('en-CA', { timeZone: 'America/Sao_Paulo' }).slice(0, 7);
const readBody = (req) => new Promise((ok) => { const c = []; req.on('data', (d) => c.push(d)); req.on('end', () => ok(Buffer.concat(c))); });

async function send(to, text) {
  await fetch(`https://graph.facebook.com/v21.0/${process.env.WA_PHONE_ID}/messages`, {
    method: 'POST',
    headers: { Authorization: 'Bearer ' + process.env.WA_TOKEN, 'Content-Type': 'application/json' },
    body: JSON.stringify({ messaging_product: 'whatsapp', to, type: 'text', text: { body: text } }),
  });
}

async function parse(text, L) {
  const r = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: { 'x-api-key': process.env.ANTHROPIC_API_KEY, 'anthropic-version': '2023-06-01', 'content-type': 'application/json' },
    body: JSON.stringify({
      model: process.env.CLAUDE_MODEL || 'claude-haiku-5-5',
      max_tokens: 300,
      system: `Você extrai lançamentos financeiros de mensagens em português. Responda SOMENTE com um JSON, sem texto extra.
Campos: tipo (gasto = compra no cartão; pagto = pagamento/amortização de fatura; ganho = entrada/faturamento; despesa = despesa de empresa; conta = conta/boleto/lote sem cartão; debpix = gasto no débito ou Pix; receber = alguém me deve; desconhecido), desc (curta), val (número total em reais), par (parcelas, padrão 1), mes (AAAA-MM, padrão ${nowMonth()}), card (um de: ${L.cards.join(', ')}), src (uma de: ${L.srcs.join(', ')}), who (nome de quem deve), forma (debito ou pix). Use só os campos do tipo.`,
      messages: [{ role: 'user', content: text }],
    }),
  });
  const j = await r.json();
  const t = (j.content && j.content[0] && j.content[0].text) || '{}';
  return JSON.parse(t.replace(/```json|```/g, '').trim());
}

const KEY = { gasto: 'gastos', pagto: 'pagtos', ganho: 'ganhos', despesa: 'despesas', conta: 'contas', debpix: 'contas', receber: 'receber' };
const LABEL = { gasto: 'Gasto no cartão', pagto: 'Pagamento de cartão', ganho: 'Ganho', despesa: 'Despesa de empresa', conta: 'Conta', debpix: 'Débito/Pix', receber: 'A receber' };

module.exports = async (req, res) => {
  if (req.method === 'GET') {
    const q = req.query;
    return q['hub.verify_token'] === process.env.WA_VERIFY_TOKEN ? res.status(200).send(q['hub.challenge']) : res.status(403).end();
  }
  try {
    const raw = await readBody(req);
    const expected = 'sha256=' + crypto.createHmac('sha256', process.env.WA_APP_SECRET).update(raw).digest('hex');
    const got = req.headers['x-hub-signature-256'] || '';
    if (got.length !== expected.length || !crypto.timingSafeEqual(Buffer.from(got), Buffer.from(expected))) return res.status(401).end();

    const msg = JSON.parse(raw.toString()).entry?.[0]?.changes?.[0]?.value?.messages?.[0];
    if (!msg || msg.type !== 'text' || msg.from !== process.env.ALLOWED_PHONE) return res.status(200).end();

    const st = await getState();
    const D = st.D || {}, L = st.L || { cards: [], srcs: [] };
    const p = await parse(msg.text.body, L);
    const key = KEY[p.tipo], val = Number(p.val);

    if (!key || !(val > 0)) {
      await send(msg.from, 'Não entendi. Exemplos: "gastei 85 no mercado no Nubank", "recebi 3000 da Empresa A", "paguei 500 da fatura do Itaú".');
    } else {
      const id = Math.max(100, ...Object.values(D).flat().map((e) => e.id || 0)) + 1;
      const e = { id, desc: p.desc || 'Lançamento', val, par: Math.max(1, parseInt(p.par) || 1), month: p.mes || nowMonth() };
      if (p.tipo === 'ganho' || p.tipo === 'despesa') e.src = L.srcs.includes(p.src) ? p.src : L.srcs[0];
      if (p.tipo === 'gasto' || p.tipo === 'pagto') e.card = L.cards.includes(p.card) ? p.card : L.cards[0];
      if (p.tipo === 'receber') { e.card = L.cards.includes(p.card) ? p.card : null; e.who = p.who || 'Alguém'; }
      if (p.tipo === 'pagto') e.par = 1;
      if (p.tipo === 'conta') e.kind = 'conta';
      if (p.tipo === 'debpix') { e.kind = p.forma === 'pix' ? 'pix' : 'debito'; e.par = 1; }
      (D[key] = D[key] || []).push(e);
      await saveState({ D, L });
      const R = 'R$ ' + val.toFixed(2).replace('.', ',');
      await send(msg.from, `✅ ${LABEL[p.tipo]}: ${e.desc} — ${R}${e.par > 1 ? ' em ' + e.par + 'x' : ''}${e.card ? ' · ' + e.card : ''}${e.src ? ' · ' + e.src : ''}${e.who ? ' · ' + e.who : ''} · ${e.month}`);
    }
  } catch (err) {
    console.error(err);
  }
  res.status(200).end();
};

module.exports.config = { api: { bodyParser: false } };
