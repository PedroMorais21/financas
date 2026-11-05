const U = (process.env.SUPABASE_URL || '').trim().replace(/\/+$/, ''), K = (process.env.SUPABASE_SERVICE_KEY || '').trim();
const need = () => { if (!U || !K) throw new Error('Faltam as variáveis SUPABASE_URL e SUPABASE_SERVICE_KEY na Vercel (ou falta publicar de novo).'); };
const H = { apikey: K, 'Content-Type': 'application/json' };
if (K && K.startsWith('eyJ')) H.Authorization = 'Bearer ' + K;

async function getState() {
  need();
  const r = await fetch(U + '/rest/v1/app_state?id=eq.1&select=data', { headers: H });
  if (!r.ok) throw new Error(await r.text());
  const j = await r.json();
  return (j[0] && j[0].data) || {};
}

async function saveState(data) {
  need();
  const r = await fetch(U + '/rest/v1/app_state', {
    method: 'POST',
    headers: { ...H, Prefer: 'resolution=merge-duplicates' },
    body: JSON.stringify({ id: 1, data, updated_at: new Date().toISOString() }),
  });
  if (!r.ok) throw new Error(await r.text());
}

module.exports = { getState, saveState };
