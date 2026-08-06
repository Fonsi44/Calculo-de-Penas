---
status: current
owner: engineering
created: 2026-07-28
last_reviewed: 2026-07-28
review_due: 2026-10-28
supersedes: null
superseded_by: null
---
# Staging Deployment

## Despliegue inicial

```bash
git switch staging/fase6-preproduction
vercel deploy --no-wait
```

## Comandos

| Acción | Comando |
|--------|---------|
| Desplegar staging | `vercel deploy` |
| Ver estado | `vercel inspect <deployment-id>` |
| Ver logs | `vercel logs <deployment-url>` |
| Variables entorno | `vercel env ls` |
| Añadir variable | `vercel env add <NAME> <environment>` |

## Variables de entorno en Vercel

Las variables se configuran en el entorno "Preview" del proyecto justicia-verdadera.
Las variables compartidas (Blob) ya existen en Development, Preview y Production.

## Post-despliegue

1. Verificar `https://<staging-url>/api/health`
2. Verificar `https://<staging-url>/robots.txt` (debe tener `Disallow: /`)
3. Verificar cabeceras HTTP: `X-Robots-Tag: noindex`
4. Verificar protección de acceso (Vercel SSO o Basic Auth)
5. Ejecutar smoke tests

## URLs

- Staging: https://justicia-verdadera-4ki16xmrr-fonsi-roiget-s-projects.vercel.app
- Inspector: https://vercel.com/fonsi-roiget-s-projects/justicia-verdadera/6385eTPzNMGGXSxWcMuMWxcq6iHA

## Rollback

```bash
vercel rollback <deployment-id>
```

O desplegar un commit anterior de la rama staging:

```bash
git checkout <commit-hash>
vercel deploy
```
