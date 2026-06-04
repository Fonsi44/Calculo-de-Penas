# 13 — Checklist de implementación

Use esta lista para verificar que el sistema está listo para producción.

## Seguridad

- [ ] `JWT_SECRET` rotado y ≥32 caracteres en Neon/Vercel.
- [ ] `DATABASE_URL` apunta a Neon producción con SSL.
- [ ] Historial git limpio de `.env` (`git filter-repo` ejecutado).
- [ ] Tabla `auditoria_eventos` creada en Neon.
- [ ] Login con rate limit (5 req/min por IP) operativo.
- [ ] `/api/calcular` con rate limit (30 req/min por usuario) operativo.
- [ ] `__Host-token` cookie configurado en producción.
- [ ] CSP y security headers verificados con `curl -I https://app.example.com`.
- [ ] HTTPS forzado (HSTS habilitado en prod).
- [ ] Variables de entorno NO commiteadas (verificar con `git ls-files | grep .env`).

## Datos

- [x] `data/delitos.json` con 466 entradas verificadas; nota: contiene 32 grupos duplicados por `(nombre, articulo)` que se insertan una sola vez por el unique constraint de la BD (434 únicos reales). Deduplicación pendiente (Fase 1).
- [ ] `data/delitos-estados.json` generado y con totales correctos.
- [ ] Catálogo de delitos revisado por abogado HN (al menos los 112 verificados).
- [ ] Decidir tratamiento de los 323 delitos "rechazados": ¿inactivos? ¿corrección manual?
- [ ] Backup de Neon programado (al menos diario).

## Motor de cálculo

- [ ] Tests del motor en verde (53/53).
- [ ] Validación legal de Art. 66 (concurso real) por abogado HN.
- [ ] Validación legal de Art. 67 (concurso ideal) por abogado HN.
- [ ] Validación legal de Art. 68 (delito continuado) por abogado HN.
- [ ] Validación legal de Art. 70 (compensación agravantes/atenuantes).
- [ ] Validación de tratamiento de eximentes incompletas.
- [ ] Decisión sobre Art. 71 (reincidencia) — ¿implementar o documentar como pendiente?
- [ ] Tests de borde: pena máxima general (30 años) y excepcional (40 años).

## API

- [ ] `requireAuth` y `requireAdmin` aplicados en todos los endpoints que tocan datos.
- [ ] Ownership check en `/api/casos/[id]` y `/api/casos/[id]/pdf`.
- [ ] Ownership check en `/api/calculos` (POST valida que caso pertenece al usuario).
- [ ] Endpoints admin: `/api/delitos/{POST,PUT,DELETE}`, `/api/cp/{POST,PUT}`, `/api/seed`.
- [ ] `/api/seed` solo accesible por admin.
- [ ] `lib/auth.ts` con `validateJwtSecret` activo en producción.

## UI

- [ ] Calculadora de 8 pasos funciona end-to-end con delitos reales.
- [ ] Banner de calidad de datos visible con totales correctos.
- [ ] Checkbox de confirmación aparece para delitos no verificados.
- [ ] `goNext` bloquea el avance si no se confirma.
- [ ] Dark mode / light mode funciona.
- [ ] Atajos de teclado documentados en `/atajos`.
- [ ] PDF genera correctamente con todos los campos (pena, accesorias, fundamento).

## CI/CD

- [ ] GitHub Actions CI ejecuta en cada push (`.github/workflows/ci.yml`).
- [ ] Branch protection en `main` requiere CI verde.
- [ ] Vercel deploy automático desde `main`.
- [ ] Preview deployments para PRs activos.
- [ ] Rollback documentado en `docs/05-despliegue.md`.

## Documentación

- [ ] `docs/01-arquitectura.md` revisado.
- [ ] `docs/02-motor-calculo.md` revisado.
- [ ] `docs/03-trazabilidad-normativa.md` revisado.
- [ ] `docs/04-seguridad.md` revisado.
- [ ] `docs/05-despliegue.md` revisado.
- [ ] `docs/06-actualizacion-normativa.md` revisado.
- [ ] `CHANGELOG.md` actualizado con cada release.
- [ ] `README.md` (si existe) apunta a docs/.

## Monitoreo post-deploy

- [ ] Alertas Vercel configuradas (errores 5xx, latencia > 5s).
- [ ] Logs de Vercel revisados diariamente primera semana.
- [ ] Neon dashboard revisado (CPU, connections, storage).
- [ ] Eventos de auditoría revisados (`SELECT * FROM auditoria_eventos ORDER BY creado_en DESC LIMIT 100`).

## Rollback

- [ ] Plan de rollback documentado.
- [ ] Última migración reversible (Drizzle genera down automático).
- [ ] BD Neon con point-in-time recovery habilitado.

## Acciones externas pendientes (del usuario)

- [ ] Rotar secretos en Neon/Vercel.
- [ ] Limpiar `.env` del historial git.
- [ ] Contratar abogado HN colegiado para validación legal.
- [ ] Decidir presupuesto para Upstash/KV (rate limiting distribuido).
- [ ] Configurar backup automático Neon.
