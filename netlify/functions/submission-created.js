// Netlify Function de evento: se ejecuta automáticamente en cada envío de
// formulario verificado (no spam) de Netlify Forms.
// Solo actúa sobre el formulario "cupon-buenfin": da de alta el contacto en
// Brevo (lista #3) y le envía el correo de bienvenida con su cupón.
//
// Variables de entorno (Netlify → Site configuration → Environment variables):
//   BREVO_API_KEY       (obligatoria) API key v3 de Brevo
//   BREVO_SENDER_EMAIL  (opcional)    remitente verificado en Brevo → Senders
//
// Siempre responde 200 para no afectar el envío del formulario.

const FORM_NAME = 'cupon-buenfin';
const BREVO_LIST_ID = 3;
const BREVO_API = 'https://api.brevo.com/v3';
const DEFAULT_SENDER = 'sanandres.fraccionamiento@gmail.com';
const WA_NUMBER = '527751612654';

const PROMO_TERMINOS = 'Cupón Buen Fin San Andrés. Descuento de $30,000 MXN sobre el precio de lista de un lote de Calle Rancho Soyola (últimos lotes o nueva preventa) de Residencial San Andrés. Vigencia del 1 al 30 de noviembre de 2026, sujeto a disponibilidad de lotes. Para hacerlo válido, el enganche debe pagarse dentro de la vigencia. Aplica con el plan de 30% de enganche y 12 mensualidades sin intereses, o con pago de contado. Un cupón por lote. Cupón personal e intransferible: se obtiene registrándose en sanandresresidencial.com y solo es válido para la persona registrada con ese código. No acumulable con otras promociones, descuentos o negociaciones. No aplica en ventas realizadas a través de brokers o intermediarios externos. Precio de lista vigente a noviembre de 2026: $3,300 MXN por m² en últimos lotes y $3,500 MXN por m² en nueva preventa, sujeto a cambio sin previo aviso fuera de la vigencia de la promoción. No incluye gastos notariales, impuestos ni derechos de escrituración. Informes: WhatsApp 775 161 2654.';

const ok = (msg = 'ok') => ({ statusCode: 200, body: msg });

const escapeHtml = s => String(s == null ? '' : s)
  .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;').replace(/'/g, '&#39;');

// Mismo mensaje prellenado que el botón del sitio.
function waLink(nombre, codigo) {
  const text = `Hola, soy ${nombre}. Quiero aplicar mi cupón ${codigo} de $30,000 para un lote en San Andrés. ¿Me pasan disponibilidad?`;
  return `https://wa.me/${WA_NUMBER}?text=${encodeURIComponent(text)}`;
}

function buildEmailHtml({ nombre, codigo }) {
  const n = escapeHtml(nombre);
  const c = escapeHtml(codigo);
  const href = escapeHtml(waLink(nombre, codigo));
  return `<!doctype html>
<html lang="es-MX"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Tu cupón de $30,000</title></head>
<body style="margin:0;padding:0;background:#f6f0e6;font-family:Helvetica,Arial,sans-serif;color:#2d2a26;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f6f0e6;">
    <tr><td align="center" style="padding:24px 12px;">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#ffffff;border-radius:20px;">
        <tr><td style="padding:28px 24px 8px;text-align:center;">
          <div style="font-size:11px;letter-spacing:3px;text-transform:uppercase;color:#5e6f55;">Residencial</div>
          <div style="font-family:Georgia,serif;font-size:26px;color:#2d2a26;">San <em style="color:#c97e5d;">Andrés</em></div>
        </td></tr>
        <tr><td style="padding:16px 24px 0;font-size:16px;line-height:1.6;">
          <p style="margin:0 0 12px;">Hola, ${n}:</p>
          <p style="margin:0 0 12px;">Gracias por registrarte en el Buen Fin de San Andrés. Este es tu cupón personal de <strong>$30,000 MXN</strong> de descuento en tu lote:</p>
        </td></tr>
        <tr><td align="center" style="padding:8px 24px;">
          <div style="display:inline-block;font-size:34px;font-weight:800;letter-spacing:4px;color:#c97e5d;border:2px dashed #c97e5d;border-radius:16px;padding:14px 22px;background:#f6f0e6;">${c}</div>
          <p style="margin:12px 0 0;font-size:15px;font-weight:bold;color:#5e6f55;">Tu cupón está activo hasta el 30 de noviembre de 2026</p>
        </td></tr>
        <tr><td align="center" style="padding:20px 24px;">
          <a href="${href}" target="_blank" style="display:inline-block;background:#25D366;color:#ffffff;text-decoration:none;font-weight:bold;font-size:16px;padding:14px 26px;border-radius:100px;">Aplicar mi cupón por WhatsApp</a>
        </td></tr>
        <tr><td style="padding:0 24px 16px;font-size:15px;line-height:1.6;">
          <p style="margin:0;">Quedan los <strong>últimos lotes de Calle Rancho Soyola</strong> ($3,300 MXN por m²) y abrimos su <strong>nueva preventa</strong> a <strong>$3,500 MXN por m²</strong>, lista en unos días. Plan de 30% de enganche + 12 mensualidades sin intereses.</p>
        </td></tr>
        <tr><td style="padding:0 24px 24px;">
          <p style="margin:0;padding-top:14px;border-top:1px solid #ede5d5;font-size:11px;line-height:1.5;color:#6b6660;">${escapeHtml(PROMO_TERMINOS)}</p>
        </td></tr>
      </table>
      <p style="margin:16px 0 0;font-size:12px;line-height:1.5;color:#6b6660;text-align:center;">Residencial San Andrés · Carr. Tulancingo–Pachuca km 4.5, Col. Santa Alicia, Tulancingo, Hidalgo, C.P. 43700<br>WhatsApp 775 161 2654 · sanandresresidencial.com</p>
    </td></tr>
  </table>
</body></html>`;
}

// POST a Brevo. Nunca lanza por status HTTP: regresa { ok, status, text }
// para poder registrar la respuesta completa de Brevo en los logs de Netlify.
async function brevo(path, apiKey, body) {
  const res = await fetch(`${BREVO_API}${path}`, {
    method: 'POST',
    headers: { 'api-key': apiKey, 'content-type': 'application/json', accept: 'application/json' },
    body: JSON.stringify(body),
  });
  let text = '';
  try { text = await res.text(); } catch {}
  return { ok: !!res.ok, status: res.status, text };
}

// Teléfono a 10 dígitos (MX) a partir de lo capturado.
function telefono10(v) {
  let d = String(v || '').replace(/\D/g, '');
  if (d.length === 13 && d.startsWith('521')) d = d.slice(3);
  else if (d.length === 12 && d.startsWith('52')) d = d.slice(2);
  return d.length === 10 ? d : '';
}
// Formato E.164 para el campo nativo WHATSAPP de Brevo (tipo teléfono).
const whatsappE164 = tel10 => (tel10 ? `+52${tel10}` : '');

// Errores de Brevo que indican problema con el teléfono (campo WHATSAPP/SMS).
const PHONE_ERROR_RE = /phone|whatsapp|sms|invalid/i;

// Atributos de contacto de texto que usa la función. Se crean solos la primera
// vez (una vez por instancia "caliente" de la función); si ya existen, Brevo
// responde 400 "already exists" y se toma como éxito.
// OJO: WHATSAPP (y SMS) son atributos NATIVOS de Brevo de tipo teléfono (E.164);
// no se crean aquí. El número en texto plano va en TELEFONO.
const BREVO_ATTRS = ['NOMBRE', 'TELEFONO', 'CODIGO', 'CANAL'];
let attrsReady = false;

async function ensureAttributes(apiKey) {
  if (attrsReady) return;
  let allOk = true;
  for (const name of BREVO_ATTRS) {
    try {
      const res = await fetch(`${BREVO_API}/contacts/attributes/normal/${name}`, {
        method: 'POST',
        headers: { 'api-key': apiKey, 'content-type': 'application/json', accept: 'application/json' },
        body: JSON.stringify({ type: 'text' }),
      });
      if (res.ok) continue;
      let detail = '';
      try { detail = await res.text(); } catch {}
      if (res.status === 400 && /already|exist|duplicate/i.test(detail)) continue;
      allOk = false;
      console.error(`[submission-created] No se pudo crear el atributo ${name} en Brevo: ${res.status} ${detail}`);
    } catch (err) {
      allOk = false;
      console.error(`[submission-created] Error al crear el atributo ${name} en Brevo:`, err.message || err);
    }
  }
  if (allOk) attrsReady = true; // si algo falló, se reintenta en el próximo envío
}

async function handler(event) {
  let payload;
  try {
    payload = JSON.parse(event.body || '{}').payload || {};
  } catch (err) {
    console.error('[submission-created] body inválido', err);
    return ok('ignored');
  }
  const data = payload.data || {};
  const formName = payload.form_name || data['form-name'];
  if (formName !== FORM_NAME) return ok('ignored');

  const apiKey = process.env.BREVO_API_KEY;
  if (!apiKey) {
    console.warn('[submission-created] Falta BREVO_API_KEY: no se envía a Brevo (el formulario sí quedó guardado en Netlify).');
    return ok('no-key');
  }

  const nombre = String(data.nombre || '').trim();
  const email = String(data.email || data.correo || '').trim();
  const tel10 = telefono10(data.whatsapp || data.telefono);
  const codigo = String(data.codigo || '').trim();
  const canal = String(data.canal || 'WEB').trim();
  if (!email) {
    console.warn('[submission-created] Envío sin correo; se ignora.');
    return ok('no-email');
  }

  await ensureAttributes(apiKey);

  try {
    const attributes = { NOMBRE: nombre, TELEFONO: tel10 || String(data.whatsapp || '').trim(), CODIGO: codigo, CANAL: canal };
    const wa = whatsappE164(tel10);
    if (wa) attributes.WHATSAPP = wa;
    const contact = attrs => ({ email, attributes: attrs, listIds: [BREVO_LIST_ID], updateEnabled: true });

    let r = await brevo('/contacts', apiKey, contact(attributes));
    if (!r.ok) {
      console.error(`[submission-created] Brevo /contacts respondió ${r.status}: ${r.text}`);
      if (r.status === 400 && attributes.WHATSAPP && PHONE_ERROR_RE.test(r.text)) {
        const { WHATSAPP, ...sinWhatsapp } = attributes;
        r = await brevo('/contacts', apiKey, contact(sinWhatsapp));
        if (r.ok) console.warn('[submission-created] Contacto creado sin WHATSAPP (reintento); el número quedó en TELEFONO.');
        else console.error(`[submission-created] Reintento sin WHATSAPP también falló: ${r.status}: ${r.text}`);
      }
    }
  } catch (err) {
    console.error('[submission-created] Error de red al crear contacto en Brevo:', err.message || err);
  }

  try {
    const r = await brevo('/smtp/email', apiKey, {
      sender: { name: 'Residencial San Andrés', email: process.env.BREVO_SENDER_EMAIL || DEFAULT_SENDER },
      to: [{ email, name: nombre || undefined }],
      subject: `Tu cupón de $30,000 en Residencial San Andrés: ${codigo}`,
      htmlContent: buildEmailHtml({ nombre, codigo }),
    });
    if (!r.ok) console.error(`[submission-created] Brevo /smtp/email respondió ${r.status}: ${r.text}`);
  } catch (err) {
    console.error('[submission-created] Error de red al enviar correo con Brevo:', err.message || err);
  }

  return ok('done');
}

module.exports = {
  handler, buildEmailHtml, waLink, PROMO_TERMINOS, telefono10, whatsappE164,
  _resetAttrsCache: () => { attrsReady = false; }, // solo para pruebas
};
