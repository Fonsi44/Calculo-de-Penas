# Fase 3C — Plan de rollback

**Fecha:** 2026-07-26
**Modo:** `IMPLEMENTACIÓN` sobre `main`

Este documento describe cómo revertir los cambios de Fase 3C en caso necesario. Cada commit es independiente y reversible.

---

## 1. Commits de Fase 3C

```
0cbdf89f feat(fase3c): clasificar procedencia de fuentes normativas (7 categorias)
e0e8ed82 docs(fase3c): localizar CNA Decreto 35-2013 y resolver Art. 71 Constitucion
5b2aaddf fix(fase3c): desbloquear 4 articulos y reformular claims comerciales
<commit4>  feat(fase3c): recalcular claims, estados y paquetes de revision humana
<commit5>  feat(fase3c): SEO/GEO, validacion y documentacion
```

Estado antes de Fase 3C: `57fd9655` (HEAD de Fase 3B).

---

## 2. Rollback por capas

### 2.1 Rollback de DB Neon (bodies y estados)

Los cambios en DB son los más críticos. Para restaurar:

**Bodies de los 4 artículos desbloqueados:**
```bash
# El backup con SHA-256 está en:
ls auditoria-blog/backup-pre-fase3c-*.json

# Script para restaurar bodies (ejemplo conceptual — crear si se necesita):
npx tsx -e "
import { config } from 'dotenv';
import { neon } from '@neondatabase/serverless';
import * as fs from 'fs';
config({ path: '.env.local' });
const sql = neon(process.env.DATABASE_URL);
const backup = JSON.parse(fs.readFileSync('auditoria-blog/backup-pre-fase3c-2026-07-26T15-20-42-774Z.json','utf8'));
for (const p of backup.posts) {
  await sql\`UPDATE blog_posts SET body = \${p.body}, updated_at = NOW() WHERE slug = \${p.slug}\`;
  console.log('Restaurado:', p.slug);
}
"
```

**Estados AI (15 artículos):**
El backup incluye los campos `aiReviewStatus`, `aiReviewClaimsCount`, etc. antes de Fase 3C. Restaurar con UPDATE similar.

### 2.2 Rollback de código

Para revertir todos los commits de Fase 3C (sin `--force`, usando `git revert`):

```bash
# Revertir en orden inverso (más reciente primero)
git revert <commit5>
git revert <commit4>
git revert 5b2aaddf
git revert e0e8ed82
git revert 0cbdf89f
```

Esto crea commits de reversión sin reescribir historial (cumple R19).

**Alternativa si NO se ha hecho push todavía:**
```bash
git reset --hard 57fd9655  # Solo local, antes de push
```
⚠️ No usar `--force` en push (R19).

### 2.3 Rollback por archivo específico

Si solo se quiere revertir un cambio concreto:

**Revertir extensión de `OfficialSource`:**
```bash
git checkout 57fd9655 -- lib/ai/deepseek-blog-review.ts
```

**Eliminar módulo de procedencia:**
```bash
git rm lib/ai/source-provenance.ts
```

**Restaurar informe Fase 3B:**
Los informes Fase 3B (`docs/audits/fase3b-*.md`) no se modificaron en Fase 3C. Siguen disponibles.

---

## 3. PDFs de trabajo (no commiteados)

Los PDFs descargados en Fase 3C están en `.fase3b-fuentes/` (gitignored):
- `cna-35-2013-cepal.pdf` (610 KB)
- `cna-35-2013.txt` (texto extraído)

Para limpiar (opcional):
```bash
rm .fase3b-fuentes/cna-35-2013-*
```

No afecta al repositorio ni al despliegue.

---

## 4. Verificación post-rollback

Tras revertir, ejecutar para confirmar estado limpio:

```bash
npm run lint
npx tsc --noEmit
npm run test
npm run build
```

Las 4 deben dar exit 0.

Verificar DB con:
```bash
npx tsx scripts/fase3b-verificar-lote.ts
```

Debe mostrar los 15 slugs con sus estados Fase 3B (previos a Fase 3C).

---

## 5. Riesgos del rollback

| Riesgo | Mitigación |
|--------|------------|
| Revertir bodies sin restaurar estados → inconsistencia | Restaurar bodies Y estados del mismo backup |
| Revertir código sin restaurar DB → tests de invariantes fallan | Restaurar DB primero, luego código |
| `git revert` crea commits adicionales | Aceptable (cumple R19: no reescribir historial) |
| Push `--force` | ❌ PROHIBIDO por R19 |

---

## 6. Punto de retorno seguro

El estado `57fd9655` (HEAD de Fase 3B) es el punto de retorno canónico. Es estable, las 4 validaciones pasan, y la DB estaba en ese estado antes de Fase 3C.

**Si todo falla:** restaurar DB desde backup + `git reset --hard 57fd9655` (solo si no se ha hecho push).
