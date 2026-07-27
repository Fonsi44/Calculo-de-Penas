# Fase 5A — Lote 3: Plan de rollback

- **Fase:** 5A · **Lote:** 3
- **Fecha:** 2026-07-27
- **Hash inicial:** `3f9e9ccdeefe3dec047ee3bdf71fe287d838c4e4`

## Alcance de los cambios aplicados

1. **Body de 1 artículo corregido** (`poder-legal`): cita Art. 1732→1888 CC.
2. **Enlazado interno en 10 artículos** (10 enlaces `<a>` añadidos).
3. **Estados `ai_review_*` en DB** de los 15 artículos del Lote 3.
4. **Commits locales** (máx 7) con los artefactos de auditoría.

## Procedimiento de rollback

### Paso 1 — Restaurar bodies desde backup local

El backup completo está en `.secrets/fase5a-lote3-backup.json` (ignorado por Git,
15 artículos con body + metadatos + hashes). Restaurar:

```bash
npx tsx -e "
import { config } from 'dotenv';
import { neon } from '@neondatabase/serverless';
import * as fs from 'fs';
config({ path: ['.env.local', '.env'] });
const sql = neon(process.env.DATABASE_URL!);
const b = JSON.parse(fs.readFileSync('.secrets/fase5a-lote3-backup.json','utf8'));
for (const a of b.articulos) {
  await sql\`UPDATE blog_posts SET body = \${a.body}, updated_at = \${a.updated_at} WHERE slug = \${a.slug}\`;
  console.log('Restaurado body:', a.slug);
}
"
```

### Paso 2 — Restaurar estados `ai_review_*` a `not_started`

```bash
npx tsx -e "
import { config } from 'dotenv';
import { neon } from '@neondatabase/serverless';
import * as fs from 'fs';
config({ path: ['.env.local', '.env'] });
const sql = neon(process.env.DATABASE_URL!);
const b = JSON.parse(fs.readFileSync('.secrets/fase5a-lote3-backup.json','utf8'));
for (const a of b.articulos) {
  await sql\`UPDATE blog_posts SET
    ai_review_status = \${a.ai_review_status},
    ai_review_claims_count = \${a.ai_review_claims_count},
    ai_review_confirmed_claims = \${a.ai_review_confirmed_claims},
    ai_review_corrected_claims = \${a.ai_review_corrected_claims},
    ai_review_unresolved_claims = \${a.ai_review_unresolved_claims},
    ai_review_requires_human = \${a.ai_review_requires_human},
    ai_review_version = \${a.ai_review_version}
    WHERE slug = \${a.slug}\`;
  console.log('Restaurado estado:', a.slug);
}
"
```

### Paso 3 — Revertir commits (si ya se hizo push, usar `git revert`)

Si los commits aún NO se han pusheado:

```bash
git reset --hard 3f9e9ccd   # vuelve al punto de partida
```

Si ya se pusheadon a `origin/main`:

```bash
# Listar los commits de Fase 5A
git log --oneline 3f9e9ccd..HEAD
# Revertir cada uno en orden inverso (crea commits de reversión)
git revert --no-edit <hash-commit-más-reciente> ... <hash-commit-más-antiguo>
git push origin main
```

### Paso 4 — Revalidar tras rollback

- `npm run lint && npx tsc --noEmit && npm run test && npm run build` debe dar verde.
- Los 15 artículos deben volver a responder 200 con contenido anterior.
- Los estados `ai_review_*` deben ser `not_started` para los 15.
- `git status` debe mostrar árbol limpio en `3f9e9ccd`.

### Paso 5 — Forzar redeploy (si fue push)

Si se revirtió vía push, Vercel redeployará automáticamente. Verificar con:

```bash
curl -sI https://www.pinedayasociadoshn.com/blog/derecho-notarial/poder-legal-honduras-cuando-se-necesita
# El body debe contener "1732" (no "1888")
```

## Verificación de integridad del backup

- Hash global SHA-256 del backup: `cbf33a2ff9fc8c7979db27e55053453456cc52f23402e76eea21035bf5a51af5`.
- 15 artículos con hashes individuales únicos (ver `fase5a-lote3-estados-iniciales.json`).
- Restauración verificable: comparar `bodySha256` antes/después.

## Punto de no retorno

- **Antes del push a `origin/main`:** rollback local con `git reset --hard 3f9e9ccd` + restauración DB. Sin consecuencia externa.
- **Después del push:** rollback requiere `git revert` + push + revalidación productiva. Los deployments previos quedan en historial de Vercel.
