# 13 — Checklist de implementación

Use esta lista para verificar que el sistema está listo para producción.

## Seguridad

- [x] `JWT_SECRET` rotado y ≥32 caracteres en Neon/Vercel.
- [x] `DATABASE_URL` apunta a Neon producción con SSL.
- [-] Historial git limpio de `.env`: nunca fue commiteado (verificado con `git ls-files .env`).
- [x] Tabla `auditoria_eventos` creada en Neon.
- [x] Login con rate limit (5 req/min por IP) operativo (Neon DB, funciona en serverless).
- [x] `/api/calcular` con rate limit (30 req/min por usuario) operativo (Neon DB).
- [x] `__Host-token` cookie configurado en producción.
- [x] CSP y security headers verificados.
- [x] HTTPS forzado (HSTS habilitado en prod).
- [x] Variables de entorno NO commiteadas (verificado con `git ls-files .env`).
- [x] **Restricción de dominio**: solo emails `@pinedayasociadoshn.com` en `/api/auth/login` y `/api/auth/register` (Fase 11, 2026-06-05).
- [x] **Ruta única de login**: `/login` legacy redirige a `/intranet/login`; no hay links internos al path antiguo.

## Datos

- [x] `data/delitos.json` con 483 entradas (395 nuevas extracciones artículo-por-artículo del CP + 88 preservadas del catálogo histórico). Cubre los 362 artículos con `tema='delitos'` del CP Decreto 130-2017. 234 con auto-validación completa (artículo + pena + rama), 249 pendientes de revisión manual de pena.
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

- [x] `requireAuth` y `requireAdmin` aplicados en todos los endpoints que tocan datos.
- [x] Ownership check en `/api/casos/[id]` y `/api/casos/[id]/pdf`.
- [x] Ownership check en `/api/calculos` (POST valida que caso pertenece al usuario).
- [x] Endpoints admin: `/api/delitos/{POST,PUT,DELETE}`, `/api/cp/{POST,PUT}`, `/api/seed`.
- [x] `/api/seed` solo accesible por admin.
- [x] `lib/auth.ts` con `validateJwtSecret` activo en producción.

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
