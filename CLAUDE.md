# Privada Residencial San Andrés — Claude Code Brief

## Qué es este proyecto
Sitio web de marketing para Privada Residencial San Andrés, fraccionamiento en Tulancingo, Hidalgo. Live en **sanandresresidencial.com**. SPA React + Vite. Auto-deploy desde GitHub → Netlify.

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

### 🔴 Netlify Forms no confirmado
El formulario de contacto usa Netlify Forms. Se hizo fix en último commit (`2477e1f`) cambiando `data-netlify="true"` → atributo `netlify`. **Verificar** que el form "contacto" aparece en Netlify → Forms después del próximo deploy.

Si sigue sin aparecer, el `index.html` tiene:
```html
<form name="contacto" netlify netlify-honeypot="bot-field" hidden>
  <input type="text" name="nombre" />
  <input type="tel" name="telefono" />
  <input type="email" name="email" />
  <textarea name="mensaje"></textarea>
  <input name="bot-field" />
  <button type="submit">Enviar</button>
</form>
```
Si Netlify sigue sin detectar, alternativa: usar Netlify Functions o Formspree.

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
