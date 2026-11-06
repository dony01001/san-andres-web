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
//
// Blindaje: solo procesa envíos dentro de la vigencia, con consentimiento, datos
// válidos y con el código que deriva el servidor para ese WhatsApp (ver
// netlify/lib/cupon.js). Si el correo o el WhatsApp ya tienen cupón en Brevo,
// no se sobrescribe ni se envía otro correo.

const { telefono10, codigoServidor, limpiaNombre, emailOk, enVigencia, canalOk } = require('../lib/cupon.js');

const FORM_NAME = 'cupon-buenfin';
const BREVO_LIST_ID = 3;
const BREVO_API = 'https://api.brevo.com/v3';
const DEFAULT_SENDER = 'sanandres.fraccionamiento@gmail.com';
const WA_NUMBER = '527751612654';

const PROMO_TERMINOS = 'Cupón Buen Fin San Andrés. Descuento de $30,000 MXN sobre el precio de lista de un lote de Calle Rancho Soyola (últimos lotes o nueva preventa) de Residencial San Andrés. Vigencia del 1 al 30 de noviembre de 2026, sujeto a disponibilidad de lotes. Para hacerlo válido, el enganche debe pagarse dentro de la vigencia. Aplica con el plan de 30% de enganche y 12 mensualidades sin intereses, o con pago de contado. Un cupón por lote. Cupón personal e intransferible: se obtiene registrándose en sanandresresidencial.com y solo es válido para la persona registrada con ese código. No acumulable con otras promociones, descuentos o negociaciones. No aplica en ventas realizadas a través de brokers o intermediarios externos. El cupón se respeta solo si a más tardar el 30 de noviembre de 2026 a las 23:59 (hora del centro de México) está pagado el enganche completo del 30% o el pago total de contado; un apartado o anticipo menor no conserva el cupón. La persona registrada debe ser titular o cotitular del contrato y declarar por escrito al firmar que no participa ningún asesor, broker o intermediario. No aplica a lotes apartados, negociados o contratados antes del 1 de noviembre de 2026. El descuento no es canjeable por dinero ni reembolsable; si el contrato se cancela, el descuento se pierde, y si el lote se cede o traspasa antes de liquidarse, el nuevo titular paga el precio sin descuento. Términos actualizados el 6 de noviembre de 2026; si un anuncio, mensaje o captura de pantalla dice algo distinto, valen estos términos. Precio de lista vigente a noviembre de 2026: $3,300 MXN por m² en últimos lotes y $3,500 MXN por m² en nueva preventa, sujeto a cambio sin previo aviso fuera de la vigencia de la promoción. No incluye gastos notariales, impuestos ni derechos de escrituración. Informes: WhatsApp 775 161 2654.';

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

// Llamada a Brevo. Nunca lanza por status HTTP: regresa { ok, status, text, json }
// para poder registrar la respuesta completa de Brevo en los logs de Netlify.
async function brevo(method, path, apiKey, body) {
  const opts = { method, headers: { 'api-key': apiKey, accept: 'application/json' } };
  if (body !== undefined) { opts.headers['content-type'] = 'application/json'; opts.body = JSON.stringify(body); }
  const res = await fetch(`${BREVO_API}${path}`, opts);
  let text = '';
  try { text = await res.text(); } catch {}
  let json = null;
  try { json = text ? JSON.parse(text) : null; } catch {}
  return { ok: !!res.ok, status: res.status, text, json };
}

// Errores de Brevo que indican problema con el teléfono (campo WHATSAPP/SMS).
const PHONE_ERROR_RE = /phone|whatsapp|sms|invalid/i;
// Contacto (correo) ya existente al crear con updateEnabled:false.
const isDupContact = r => r.status === 400 && /duplicate_parameter|already exist/i.test(r.text) && !/whatsapp|sms|phone/i.test(r.text);

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
      const r = await brevo('POST', `/contacts/attributes/normal/${name}`, apiKey, { type: 'text' });
      if (r.ok) continue;
      if (r.status === 400 && /already|exist|duplicate/i.test(r.text)) continue;
      allOk = false;
      console.error(`[submission-created] No se pudo crear el atributo ${name} en Brevo: ${r.status} ${r.text}`);
    } catch (err) {
      allOk = false;
      console.error(`[submission-created] Error al crear el atributo ${name} en Brevo:`, err.message || err);
    }
  }
  if (allOk) attrsReady = true; // si algo falló, se reintenta en el próximo envío
}

// Busca un contacto. Regresa el contacto, null si no existe (404) o
// undefined si no se pudo saber (error de Brevo/red; queda en el log).
async function buscaContacto(apiKey, identifier, identifierType) {
  const qs = identifierType ? `?identifierType=${identifierType}` : '';
  try {
    const r = await brevo('GET', `/contacts/${encodeURIComponent(identifier)}${qs}`, apiKey);
    if (r.ok) return r.json || {};
    if (r.status === 404) return null;
    console.error(`[submission-created] Brevo GET /contacts (${identifierType || 'email'}) respondió ${r.status}: ${r.text}`);
  } catch (err) {
    console.error('[submission-created] Error de red al buscar contacto en Brevo:', err.message || err);
  }
  return undefined;
}
const tieneCodigo = c => !!(c && c.attributes && String(c.attributes.CODIGO || '').trim());

// Crea (POST, updateEnabled:false) o completa (PUT) el contacto, con reintento sin
// WHATSAPP si Brevo rechaza el teléfono. Regresa 'ok' | 'duplicado' | 'error'.
async function guardaContacto(apiKey, { email, attributes, existente }) {
  const enviar = attrs => existente
    ? brevo('PUT', `/contacts/${encodeURIComponent(email)}`, apiKey, { attributes: attrs, listIds: [BREVO_LIST_ID] })
    : brevo('POST', '/contacts', apiKey, { email, attributes: attrs, listIds: [BREVO_LIST_ID], updateEnabled: false });
  const ruta = existente ? 'PUT /contacts/{email}' : 'POST /contacts';
  let r = await enviar(attributes);
  if (r.ok) return 'ok';
  console.error(`[submission-created] Brevo ${ruta} respondió ${r.status}: ${r.text}`);
  if (!existente && isDupContact(r)) return 'duplicado';
  if (r.status === 400 && attributes.WHATSAPP && PHONE_ERROR_RE.test(r.text)) {
    const { WHATSAPP, ...sinWhatsapp } = attributes;
    r = await enviar(sinWhatsapp);
    if (r.ok) { console.warn('[submission-created] Contacto guardado sin WHATSAPP (reintento); el número quedó en TELEFONO.'); return 'ok'; }
    console.error(`[submission-created] Reintento sin WHATSAPP también falló: ${r.status}: ${r.text}`);
    if (!existente && isDupContact(r)) return 'duplicado';
  }
  return 'error';
}

async function handler(event) {
  try {
    return await procesa(event);
  } catch (err) {
    console.error('[submission-created] Error inesperado:', err && (err.stack || err.message || err));
    return ok('error');
  }
}

async function procesa(event) {
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

  // 1) Vigencia según la fecha del envío registrada por Netlify.
  const creado = payload.created_at ? Date.parse(payload.created_at) : Date.now();
  if (!enVigencia(creado)) {
    console.warn(`[submission-created] Envío fuera de vigencia (${payload.created_at || 'sin fecha'}); se ignora.`);
    return ok('fuera-de-vigencia');
  }

  // 2) Consentimiento explícito.
  if (data.acepta_promociones !== 'si') {
    console.warn('[submission-created] Envío sin consentimiento de promociones; se ignora.');
    return ok('sin-consentimiento');
  }

  // 3) Limpieza / validación de datos.
  const nombre = limpiaNombre(data.nombre);
  const email = String(data.email || data.correo || '').trim().toLowerCase();
  const tel10 = telefono10(data.whatsapp);
  if (!nombre || !emailOk(email) || !tel10) {
    console.warn(`[submission-created] Datos inválidos (nombre:${!!nombre} email:${emailOk(email)} whatsapp:${!!tel10}); se ignora.`);
    return ok('datos-invalidos');
  }
  const canal = canalOk(data.canal);

  const apiKey = process.env.BREVO_API_KEY;
  if (!apiKey) {
    console.warn('[submission-created] Falta BREVO_API_KEY: no se envía a Brevo (el formulario sí quedó guardado en Netlify).');
    return ok('no-key');
  }

  // 4) El código debe ser el que deriva el servidor para ese WhatsApp.
  const codigo = codigoServidor(tel10);
  if (!codigo || String(data.codigo || '').trim().toUpperCase() !== codigo) {
    console.warn(`[submission-created] Código no coincide con el del servidor (recibido "${String(data.codigo || '').slice(0, 20)}"); se ignora.`);
    return ok('codigo-invalido');
  }

  await ensureAttributes(apiKey);

  // 5) Duplicados: si ya hay contacto con cupón (por correo o por WhatsApp), no se toca ni se reenvía.
  const porEmail = await buscaContacto(apiKey, email, 'email_id');
  if (tieneCodigo(porEmail)) {
    console.warn('[submission-created] El correo ya tiene cupón en Brevo; no se sobrescribe ni se reenvía.');
    return ok('duplicado');
  }
  const wa = `+52${tel10}`;
  const porWa = await buscaContacto(apiKey, wa, 'whatsapp_id');
  if (tieneCodigo(porWa)) {
    console.warn('[submission-created] El WhatsApp ya tiene cupón en Brevo; no se sobrescribe ni se reenvía.');
    return ok('duplicado');
  }

  // 6) Guardar contacto (nuevo con updateEnabled:false; si el correo ya existía SIN cupón, se completa).
  const attributes = { NOMBRE: nombre, TELEFONO: tel10, CODIGO: codigo, CANAL: canal, WHATSAPP: wa };
  let guardado = 'error';
  try {
    guardado = await guardaContacto(apiKey, { email, attributes, existente: !!porEmail });
  } catch (err) {
    console.error('[submission-created] Error de red al guardar contacto en Brevo:', err.message || err);
  }
  if (guardado === 'duplicado') {
    console.warn('[submission-created] Brevo indica que el contacto ya existe; no se envía otro correo.');
    return ok('duplicado');
  }

  // 7) Correo de bienvenida solo con datos limpios y el código del servidor.
  try {
    const r = await brevo('POST', '/smtp/email', apiKey, {
      sender: { name: 'Residencial San Andrés', email: process.env.BREVO_SENDER_EMAIL || DEFAULT_SENDER },
      to: [{ email, name: nombre }],
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
  handler, buildEmailHtml, waLink, PROMO_TERMINOS,
  _resetAttrsCache: () => { attrsReady = false; }, // solo para pruebas
};
