# Cierre final — Periodo de observación SEO/GEO

Fecha de inicio (Día 0): a determinar tras el despliegue productivo.
Dominio canónico: `https://www.pinedayasociadoshn.com`

> No se inventa línea base. Los valores se rellenan con datos reales de
> Search Console, GA4 y Bing Webmaster Tools a medida que estén disponibles.

## Día 0 (despliegue)

- [ ] CI de GitHub Actions en verde para el commit final.
- [ ] Deployment de Vercel correspondiente a `HEAD == origin/main`.
- [ ] Producción responde en el dominio canónico (HTTP 200, redirects correctos).
- [ ] Sitemap y robots accesibles y correctos.
- [ ] URLs modificadas notificadas vía IndexNow (registro de URLs).
- [ ] Eventos GA4 nuevos (`view_local_page`, `view_spain_service`, `cta_spain`)
  llegan a GA4 (sin PII).

**URLs notificadas a IndexNow:** (rellenar tras ejecutar `indexnow:aplicar`)

## Día 7

- [ ] Rastreo: páginas modificadas indexadas/rastreadas en GSC.
- [ ] Errores de rastreo o cobertura nuevos.
- [ ] Formularios: recepción correcta de solicitudes (incluido motivo España).
- [ ] Enlaces internos rotos (auditoría).
- [ ] Rendimiento Core Web Vitals sin regresión.

## Día 14

- [ ] Impresiones de páginas locales y España.
- [ ] CTR medio.
- [ ] Consultas no de marca nuevas.
- [ ] Posicionamiento de páginas modificadas vs. línea base.

## Día 28

- [ ] Conversiones (formularios, teléfono, WhatsApp, mapas).
- [ ] Eventos `cta_spain` y `view_spain_service`.
- [ ] Páginas locales: tráfico y engagement.
- [ ] Sección España: tráfico y conversiones.
- [ ] Bing AI Performance (si aplica).

## Día 90

- [ ] Páginas ganadoras (mayor visibilidad/CTR).
- [ ] Canibalización entre páginas locales.
- [ ] Páginas locales débiles (candidatas a consolidación, ver
  `docs/seo/fase-4/riesgo-paginas-puerta.md`).
- [ ] Servicios secundarios: rendimiento.
- [ ] Decisiones de consolidación futuras (con datos GSC y aprobación).

## Rollback documentado

- Commit estable anterior: `a478f5d6` (previo a Fase 4).
- Commit final: (a determinar).
- Deployment anterior: (a determinar).
- Deployment nuevo: (a determinar).
- Procedimiento: revertir al commit anterior con `git revert` (sin force push)
  y redeployar desde `main`; Vercel redeploya automáticamente.

> No se ejecuta rollback salvo regresión bloqueante. No se usa force push.
