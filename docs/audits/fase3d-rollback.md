# Fase 3D — Plan de rollback

> Fecha: 2026-07-26 · Punto de retorno: `04b48104` (HEAD al iniciar Fase 3D)

## 1. Punto de retorno seguro

Si Fase 3D introduce una regresión en producción, el árbol puede restaurarse
al estado previo (commit `04b48104`, último de Fase 3C):

```bash
# Verificar que origin/main está empujado y estable antes de cualquier rollback
git log --oneline -1 origin/main

# Rollback LOCAL al punto de retorno (sin push, solo árbol de trabajo):
git reset --hard 04b48104
```

**IMPORTANTE (R19)**: no se hace `git push --force` ni `git revert` de toda
la rama salvo autorización expresa. El rollback preferido es:
1. Revertir commits atómicos puntuales con `git revert <hash>`.
2. O, si la regresión es total, coordinar un reset + force-push con el usuario.

## 2. Commits atómicos Fase 3D (para revertir individualmente)

| Commit | Hash | Reversión |
|---|---|---|
| 1 SW | `26c049c9` | `git revert 26c049c9` (restaura BUILD_ID real commiteado + quita test/doc) |
| 2 Claims | `cc1ca12d` | `git revert cc1ca12d` (elimina 16 claims reconstruidos) |
| 3 Estados | `40764c4b` | `git revert 40764c4b` + re-ejecutar `fase3c-reclasificar.ts --aplicar` para restaurar estados 3C en DB |
| 4 Revalidate | `412fc430` | `git revert 412fc430` (elimina endpoint) |
| 5 Trazabilidad | `d314f22f` | `git revert d314f22f` (elimina docs; sin impacto runtime) |
| 6 Bodies | `945f0cfa` | `git revert 945f0cfa` + restaurar bodies DB desde backup (ver §3) |
| 7 Tests | `d0769a03` | `git revert d0769a03` (elimina tests; sin impacto runtime) |
| 8 Docs | (este) | `git revert` (elimina docs; sin impacto runtime) |

## 3. Rollback de bodies DB Neon

Los 9 reemplazos textuales aplicados a bodies (Commit 6) son **idempotentes
y reversibles**. Para restaurar un body a su estado pre-corrección:

```bash
# Opción A: revertir manualmente cada reemplazo (buscar el correctedText,
#           reemplazar por el originalText). Tedioso pero preciso.
#
# Opción B: si existe un dump previo al Commit 6, restaurar desde ahí.
#           Los hashes pre-corrección están documentados en
#           docs/audits/fase3d-correcciones-bodies.json:
#             allanamiento: 5434054f
#             antejuicio:   f2f368eb
#             delitos-mas-comunes: 84edddcb
#             derechos-detenido:   fdd8ba8c
#             estafas-fraudes:     cc02971e
```

**Recomendado**: antes de aplicar Fase 3D en otro entorno, hacer un dump
completo de `blog_posts` con `scripts/dump-blog-posts.ts` y guardarlo fuera
del repo.

## 4. Rollback de estados DB Neon

Los 15 estados se actualizaron a `ai_review_version = 'fase3d'`. Para
restaurar a `fase3c`:

```bash
# Re-ejecutar el reclasificador de Fase 3C (sobrescribe fase3d → fase3c):
npx tsx scripts/fase3c-reclasificar.ts --aplicar
```

**Nota**: esto restauraría los estados pero los 2 slugs reconstruidos
(`delitos-mas-comunes`, `estafas-fraudes`) volverían a quedar preservados
sin inventario (regresando al estado "no cerrado" que Fase 3D resolvió).

## 5. Rollback del endpoint `/api/revalidate`

Sin estado persistente. Basta con `git revert 412fc430`. No hay migración
DB ni configuración que revertir. El endpoint lee `CRON_SECRET` de env
(sin cambios).

## 6. Rollback del service worker

Si el placeholder restaurado causa problemas (no esperado, pero documentado):

```bash
# Restaurar el BUILD_ID real commiteado (estado pre-Fase 3D):
git revert 26c049c9
# Re-ejecutar postbuild para inyectar el BUILD_ID actual:
npm run build
```

## 7. Verificación post-rollback

Tras cualquier rollback:

```bash
npm run lint && npx tsc --noEmit && npm run test && npm run build
git status --short           # debe estar limpio
# Verificar DB Neon:
node scripts/_tmp_check_db.mjs  # (crear ad-hoc con SELECT ai_review_version, ai_review_status)
```

## 8. No se aplica rollback en esta sesión

Fase 3D se valida verde (lint+tsc+test+build). El rollback queda documentado
por si una regresión aparece en producción tras el push.
