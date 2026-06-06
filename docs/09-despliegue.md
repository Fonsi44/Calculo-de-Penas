# 05 — Despliegue

## Plataformas soportadas

- **Vercel** (recomendado, producción).
- **Local** (Node.js 20+).

## Variables de entorno requeridas

| Variable | Descripción | Ejemplo |
|----------|-------------|---------|
| `DATABASE_URL` | Connection string Neon | `postgresql://user:pass@ep-xxx.aws.neon.tech/db?sslmode=require` |
| `JWT_SECRET` | Secreto JWT (≥32 chars) | `openssl rand -hex 32` |
| `NODE_ENV` | `production` (Vercel lo inyecta) | `production` |

## Despliegue en Vercel

### Setup inicial

1. Crear proyecto en Vercel apuntando al repo.
2. Configurar variables de entorno en Settings → Environment Variables.
3. Vercel detecta Next.js automáticamente (no requiere `vercel.json`).
4. Branch de deploy: `main` (producción), PR branches → preview.

### Comandos

```bash
# Build command (auto)
npm run build

# Install command (auto)
npm install

# Output directory (auto)
.next
```

### Pre-deploy checklist

- [ ] `DATABASE_URL` apunta a Neon production branch.
- [ ] `JWT_SECRET` rotado (≥32 chars).
- [ ] Schema aplicado: `npx drizzle-kit push` (local contra Neon prod).
- [ ] Seed ejecutado (solo si BD vacía): `curl -X POST -H "Cookie: token=<admin>" $URL/api/seed`.
- [ ] `data/delitos-validacion.csv` regenerado.
- [ ] `data/delitos-estados.json` regenerado.

## Despliegue local

```bash
# 1. Clonar
git clone <repo>
cd calculo-de-penas

# 2. Instalar
npm install

# 3. Variables
cp .env.example .env
# Editar .env con DATABASE_URL y JWT_SECRET propios

# 4. Schema
npx drizzle-kit push

# 5. Seed (opcional, solo si BD vacía)
node scripts/seed.ts
# o vía API: curl -X POST http://localhost:3000/api/seed

# 6. Dev
npm run dev

# 7. Build prod
npm run build
npm start
```

## Generación de secretos

```bash
# JWT_SECRET
openssl rand -hex 32
# → 64 caracteres hexadecimales

# Password admin
node -e "console.log(require('bcryptjs').hashSync('tu-password', 10))"
```

## CI

`.github/workflows/ci.yml` ejecuta en cada push/PR:

1. Lint (`npm run lint`).
2. Typecheck (`tsc --noEmit`).
3. Tests (`npm test`).
4. Build (`npm run build`).
5. Validación de seeds (duplicados, totales).

## Monitoreo post-deploy

- Logs: Vercel Functions tab.
- Errores: revisar panel Vercel.
- BD: Neon dashboard (CPU, connections, storage).
- Advertencias de deprecación: `middleware` → `proxy` en Next 17.

## Rollback

- Vercel: instant rollback desde Deployments tab.
- BD: usar Neon branching para tests; producción no se revierte sin plan.

## Pendientes

- Configurar branch protection en GitHub para requerir CI verde.
- Alertas Vercel (errores 5xx, latency).
- Plan de disaster recovery (backup Neon automático diario).
