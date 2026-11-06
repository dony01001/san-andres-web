# Residencial San Andrés — Claude Code Brief

## Qué es este proyecto
Sitio web de marketing para Residencial San Andrés, fraccionamiento en Tulancingo, Hidalgo. **Importante (legal):** el sitio NO debe usar el término "privada/privado" ni sugerir bardeado o protección perimetral — no se ofrece. Sí existen y sí se mencionan: caseta con vigilante, circuito cerrado, pluma vehicular y tarjetas de acceso. Live en **sanandresresidencial.com**. SPA React + Vite. Auto-deploy desde GitHub → Netlify.

## Stack y archivos

| Archivo/Carpeta | Propósito |
|---|---|
| `src/main.jsx` | App completa — ~1900 líneas, todos los componentes JSX en un solo archivo |
| `index.html` | Entrada Vite — meta tags, GA4, hidden Netlify form para detección |
| `public/` | Assets estáticos: imágenes WebP, videos .mp4, sitemap.xml, robots.txt |
| `package.json` | React 18 + Vite + @vitejs/plugin-react |
| `vite.config.js` | Config Vite, output → `dist/` |
| `netlify.toml` | Build: `npm run build`, publish: `dist`, NODE=20 |
| `.gitignore` | Excluye `node_modules/` y `dist/` |

## Servicios conectados

| Servicio | Detalle |
|---|---|
| **Netlify** | Site: `visionary-nasturtium-2d50a5` · auto-deploy desde branch `main` |
| **GitHub** | `github.com/dony01001/san-andres-web` |
| **Google Analytics** | GA4 Measurement ID: `G-QZ1NTEV0EQ` |
| **Google Ads** | Tag (gtag): `AW-17410208762` · en `index.html` junto a GA4 |
| **Netlify Forms** | Form name: `contacto` · notificaciones → `igdevi2089@gmail.com` |
| **WhatsApp** | `+52 775 161 2654` |
| **Google Search Console** | Propiedad de dominio verificada |
| **Cloudflare DNS** | DNS-only (sin proxy) para que Netlify maneje SSL |

## Flujo de trabajo
```bash
# Instalar dependencias (primera vez)
npm install

# Desarrollo local
npm run dev       # → http://localhost:5173

# Build producción
npm run build     # → dist/

# Deploy
git add . && git commit -m "mensaje" && git push
# Netlify auto-deploya en ~15s
```

## Componentes en src/main.jsx

| Función | Qué hace |
|---|---|
| `V2BohoBg` | Decoración de fondo (formas orgánicas SVG animadas) |
| `V2TopoLines` | Líneas topográficas de fondo (desktop) |
| `V2Gallery` | Galería de fotos + videos con lightbox |
| `V2LotMap` | SVG interactivo del plano de lotificación |
| `V2NaturalOrganic` | Componente raíz — renderiza todo el sitio |
| `V2Lantern` | Ícono SVG del farol (logo) |

`V2NaturalOrganic` recibe `SITE_TWEAKS` con colores, fuentes y flags de diseño.

## Imágenes: usar WebP

Todas las imágenes usan WebP excepto `gallery-img-3.jpeg` (WebP era más pesado).

```
public/gallery-img-1.webp  ... gallery-img-8.webp
public/gallery-img-3.jpeg  ← excepción, mantener JPEG
public/logo.webp
public/logo-farol.webp
public/soyolaplano.webp
public/plano-soyola.webp
```

## Diseño / variables CSS

```css
--ink:           #2d2a26   /* texto principal */
--sage-dark:     #5e6f55   /* verde olivo */
--terracota:     #c97e5d   /* acento terracota */
--cream:         #f6f0e6   /* fondo principal */
--cream-2:       #ede5d5   /* fondo secundario */
```

Fuentes: `"Fraunces"` (títulos/italic), `"Manrope"` (body), `"DM Serif Display"`.

## Estado actual — pendientes

### ✅ Netlify Forms — FUNCIONANDO (confirmado may-2026)
Formulario de contacto envía correos a `igdevi2089@gmail.com`. Confirmado con submit real. Detección vía hidden form con atributo `netlify` en `index.html` + POST urlencoded a `/` desde React (`form-name=contacto`).

### ✅ Cumplimiento LFPDPPP (datos personales MX) — hecho (commit `48ac6a0`)
Form tiene checkbox de consentimiento obligatorio + modal de Aviso de Privacidad (responsable, finalidades, derechos ARCO → `sanandres.fraccionamiento@gmail.com`). Link en footer y en el form. Submit bloqueado hasta aceptar. **Nota:** texto cubre mínimo legal; conviene revisión de abogado para versión blindada.

### ✅ Google Ads tag instalado (commit `2ab6639`) + eventos de conversión (`801b6f3`)
Tag `AW-17410208762` en `index.html` (comparte gtag.js con GA4). En el camino se quitó un bloque Meta Pixel placeholder (`YOUR_PIXEL_ID`) que rompía `npm run build` (parse error de `<noscript>` en `<head>`) y bloqueaba el deploy.

Eventos en `src/main.jsx` vía helper `trackConv()` (manda a GA4 siempre, y a Google Ads si hay label):
- `whatsapp_click` — nav, hero, footer, FAB, botón post-form (cada uno con `source` en params)
- `form_submit` — al enviar el form de contacto con éxito

### Promo Buen Fin 2026 + Brevo (nov-2026, branch `buenfin-2026`)
- **Sitio:** banner + modal de cupón (form Netlify `cupon-buenfin`, hidden copy en `index.html`). Fechas en `PROMO_BUENFIN` al inicio de `src/main.jsx`; se oculta solo fuera del 1–30 nov 2026 (CDMX). Lotes: "Calle Rancho Soyola: últimos lotes" ($3,300/m²) y "Calle Rancho Soyola: nueva preventa" ($3,500/m², lista en unos días). **No mostrar número de lotes ni número de etapa** ("Etapa 3/4" confunde: cada calle tiene varias etapas) en sitio, correo ni letra chica.
- **Función:** `netlify/functions/submission-created.js` — evento de Netlify que corre en cada envío verificado. Ignora todo form que no sea `cupon-buenfin`. Para el cupón: (1) crea/actualiza el contacto en **Brevo, lista #3** (atributos `NOMBRE`, `TELEFONO` = 10 dígitos en texto, `CODIGO`, `CANAL`, y el nativo `WHATSAPP` = `+52` + 10 dígitos en E.164; `updateEnabled: true`). Si Brevo rechaza el contacto por el teléfono (400 que menciona phone/WHATSAPP/SMS/invalid), reintenta una vez sin `WHATSAPP`. Todas las respuestas de error de Brevo (status + cuerpo) quedan en el log; (2) envía el correo de bienvenida con el código, botón de WhatsApp y letra chica. Siempre responde 200; errores solo van al log (Netlify → Functions → submission-created).
- **Variables de entorno (Netlify):** `BREVO_API_KEY` (obligatoria; si falta, la función solo avisa en el log y el form sigue guardándose en Netlify) y `BREVO_SENDER_EMAIL` (opcional; default `sanandres.fraccionamiento@gmail.com`). El remitente **debe estar verificado en Brevo → Senders**.
- **Atributos de Brevo:** la función crea sola los de texto (`NOMBRE`, `TELEFONO`, `CODIGO`, `CANAL`). **No crear un `WHATSAPP` propio:** Brevo ya trae `WHATSAPP`/`SMS` nativos tipo teléfono (E.164) y mandar 10 dígitos sin lada hacía que rechazara todo el contacto (nov-2026, lista #3 quedaba vacía). Se crean antes del primer alta, una vez por instancia; "ya existe" cuenta como éxito y si falla otra cosa igual intenta crear el contacto. La API key necesita permisos Contacts y Transactional email. Respaldo opcional: `BREVO_API_KEY=... node scripts/brevo-setup.mjs` o crearlos a mano en Brevo → Contacts → Settings → Contact attributes.
- **OJO al migrar a Cloudflare:** esta función depende de Netlify Forms; habría que reemplazarla junto con el form.

### 🟡 PENDIENTE (jun-2026): pegar labels de conversión de Google Ads
Crear 2 acciones de conversión en Google Ads (Objetivos → Conversiones → Nueva acción, origen Sitio web) y pegar los labels en `ADS_CONV` al inicio de `src/main.jsx`:
```js
const ADS_CONV = { whatsapp_click: '<label>', form_submit: '<label>' };
```
Hasta entonces los eventos solo llegan a GA4 (sí miden, pero no cuentan como conversión en Ads). El dueño quedó de crear las acciones y pasar los labels.

### 🟡 Migración a Cloudflare Pages (planeada — no iniciada)
Motivo: costo/límites de Netlify. Pendiente hasta que el dueño decida.
**OJO crítico:** Netlify Forms NO existe en Cloudflare. Al migrar, el form de contacto deja de enviar correos. Reemplazar con: Cloudflare Pages Function (Resend/MailChannels) o Formspree. Decidir método al migrar.

### Próximas mejoras sugeridas
- Sección de noticias/promociones mensuales (estático en JSX, un array de objetos)
- Lighthouse audit (objetivo >90 performance)
- Verificar indexación en Google Search Console

## Qué NO cambiar
- Measurement ID GA4: `G-QZ1NTEV0EQ` — no cambiar
- Canonical URL: `https://sanandresresidencial.com/` — no cambiar
- Atributo `netlify` en el hidden form de `index.html` — crítico para Forms
- Paths de imágenes en `public/` — Vite los sirve desde raíz

## Primer mensaje sugerido para Claude Code
```
Lee el CLAUDE.md. Verifica que Netlify Forms funcione
(comprueba que el form "contacto" está detectado) y luego
continúa con las mejoras pendientes.
```
