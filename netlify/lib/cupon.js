// Lógica compartida del cupón Buen Fin (NO es una función de Netlify: vive fuera
// de netlify/functions y se importa con ruta relativa).
//
// El código del cupón se deriva en el servidor a partir del WhatsApp:
// mismo teléfono => mismo código, y nadie puede inventar uno válido sin el secreto.
// Secreto: CUPON_SECRET si existe; si no, BREVO_API_KEY (no requiere variables nuevas).
// OJO: si se cambia la BREVO_API_KEY (y no hay CUPON_SECRET), los códigos
// nuevos cambian; los ya guardados en Brevo siguen siendo la referencia.

const crypto = require('crypto');

const ALFABETO = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // 32 símbolos, sin 0/O/1/I
const LARGO_CODIGO = 6;

// Vigencia del cupón (hora de Ciudad de México, UTC-6) + 10 min de gracia al final
// para envíos que se procesan justo al cierre.
const VIGENCIA = {
  inicio: Date.parse('2026-11-01T00:00:00-06:00'),
  fin: Date.parse('2026-11-30T23:59:59-06:00'),
  graciaMs: 10 * 60 * 1000,
};

const CANALES = ['FB', 'IG', 'GA', 'WEB'];

function telefono10(raw) {
  let d = String(raw == null ? '' : raw).replace(/\D/g, '');
  if (d.length === 13 && d.startsWith('521')) d = d.slice(3);
  else if (d.length === 12 && d.startsWith('52')) d = d.slice(2);
  return d.length === 10 ? d : '';
}

function secreto() {
  return process.env.CUPON_SECRET || process.env.BREVO_API_KEY || '';
}

// Devuelve 'BF30-XXXXXX' o '' si no hay teléfono válido o no hay secreto configurado.
function codigoServidor(tel10) {
  const tel = telefono10(tel10);
  const s = secreto();
  if (!tel || !s) return '';
  const llave = crypto.createHash('sha256').update('cupon-bf2026|' + s).digest();
  const mac = crypto.createHmac('sha256', llave).update(tel).digest();
  let out = '';
  for (let i = 0; i < LARGO_CODIGO; i++) out += ALFABETO[mac[i] % ALFABETO.length];
  return 'BF30-' + out;
}

// Solo letras (cualquier idioma), marcas diacríticas, espacio, punto, apóstrofo y guion.
// Antes quita etiquetas HTML, URLs y dominios (para que no aparezcan como links en el correo).
function limpiaNombre(raw) {
  return String(raw == null ? '' : raw)
    .normalize('NFC')
    .replace(/<[^>]*>/g, ' ')                                   // etiquetas HTML
    .replace(/\b(?:https?:\/\/|www\.)\S*/gi, ' ')               // URLs explícitas
    .replace(/\S*[\p{L}\d]\.[\p{L}\d]{2,}\S*/gu, ' ')              // dominios tipo algo.com
    .replace(/[^\p{L}\p{M} .'\-]/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 60)
    .trim();
}

function emailOk(raw) {
  const e = String(raw == null ? '' : raw).trim();
  return e.length > 0 && e.length <= 100 && /^[^\s@<>()"',;:]+@[A-Za-z0-9](?:[A-Za-z0-9-]*[A-Za-z0-9])?(?:\.[A-Za-z0-9](?:[A-Za-z0-9-]*[A-Za-z0-9])?)+$/.test(e);
}

function enVigencia(dateMs) {
  const t = typeof dateMs === 'number' ? dateMs : Date.parse(dateMs);
  if (!Number.isFinite(t)) return false;
  return t >= VIGENCIA.inicio && t <= VIGENCIA.fin + VIGENCIA.graciaMs;
}

function canalOk(raw) {
  const c = String(raw == null ? '' : raw).trim().toUpperCase();
  return CANALES.includes(c) ? c : 'WEB';
}

module.exports = { telefono10, codigoServidor, limpiaNombre, emailOk, enVigencia, canalOk, VIGENCIA, ALFABETO };
