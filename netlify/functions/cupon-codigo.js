// Función síncrona: POST /.netlify/functions/cupon-codigo  {"whatsapp": "7751234567"}
// Responde {"codigo": "BF30-XXXXXX"} si el teléfono es válido (10 dígitos MX) y la
// promo está vigente (hora del servidor). No guarda nada ni envía nada.

const { telefono10, codigoServidor, enVigencia } = require('../lib/cupon.js');

const HEADERS = { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' };
const json = (statusCode, obj, extra = {}) => ({ statusCode, headers: { ...HEADERS, ...extra }, body: JSON.stringify(obj) });

async function handler(event) {
  if (event.httpMethod !== 'POST') return json(405, { error: 'metodo_no_permitido' }, { allow: 'POST' });

  const ct = String((event.headers && (event.headers['content-type'] || event.headers['Content-Type'])) || '');
  if (!/^application\/json\b/i.test(ct)) return json(415, { error: 'solo_json' });

  let body;
  try {
    const raw = event.isBase64Encoded ? Buffer.from(event.body || '', 'base64').toString('utf8') : (event.body || '');
    if (raw.length > 2000) return json(400, { error: 'solicitud_invalida' });
    body = JSON.parse(raw);
  } catch {
    return json(400, { error: 'solicitud_invalida' });
  }
  if (!body || typeof body !== 'object') return json(400, { error: 'solicitud_invalida' });

  if (!enVigencia(Date.now())) return json(400, { error: 'fuera_de_vigencia' });

  const tel = telefono10(body.whatsapp);
  if (!tel) return json(400, { error: 'whatsapp_invalido' });

  const codigo = codigoServidor(tel);
  if (!codigo) {
    console.error('[cupon-codigo] Falta secreto (CUPON_SECRET o BREVO_API_KEY); no se puede generar el código.');
    return json(503, { error: 'no_disponible' });
  }
  return json(200, { codigo });
}

module.exports = { handler };
