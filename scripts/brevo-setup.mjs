// Script de una sola vez: crea en Brevo los atributos de contacto de texto
// que usa netlify/functions/submission-created.js.
// Uso:  BREVO_API_KEY=xkeysib-... node scripts/brevo-setup.mjs
// Si un atributo ya existe, lo reporta y sigue.

const apiKey = process.env.BREVO_API_KEY;
if (!apiKey) {
  console.error('Falta BREVO_API_KEY. Uso: BREVO_API_KEY=... node scripts/brevo-setup.mjs');
  process.exit(1);
}

// WHATSAPP es atributo nativo de Brevo (tipo teléfono); no se crea.
const ATTRS = ['NOMBRE', 'TELEFONO', 'CODIGO', 'CANAL'];
let failed = 0;

for (const name of ATTRS) {
  const res = await fetch(`https://api.brevo.com/v3/contacts/attributes/normal/${name}`, {
    method: 'POST',
    headers: { 'api-key': apiKey, 'content-type': 'application/json', accept: 'application/json' },
    body: JSON.stringify({ type: 'text' }),
  });
  if (res.ok) { console.log(`✓ ${name} creado`); continue; }
  const text = await res.text().catch(() => '');
  if (res.status === 400 && /already|exist/i.test(text)) { console.log(`= ${name} ya existía`); continue; }
  failed++;
  console.error(`✗ ${name}: ${res.status} ${text}`);
}

process.exit(failed ? 1 : 0);
