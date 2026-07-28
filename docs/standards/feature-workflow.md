---
status: current
owner: engineering
created: 2026-07-28
last_reviewed: 2026-07-28
review_due: 2026-10-28
supersedes: null
superseded_by: null
---
# Flujo de nuevas funciones

Proceso estándar para añadir funcionalidad al repositorio.

---

## Checklist obligatorio

Antes de empezar:

1. **Identificar dominio**: ¿web pública, blog, intranet, admin, SGIE, herramienta?
2. **Ubicar código**: según `repository-layout.md`, determinar dónde va cada archivo.
3. **Definir alcance**: qué rutas, componentes, servicios, modelos y migraciones se necesitan.

Durante la implementación:

4. **Permisos**: definir rol requerido, capacidades, scope.
5. **Modelo de datos**: si hay nuevas tablas/columnas, crear migración.
6. **API**: Zod validation, rate limiting, CSRF en mutaciones.
7. **UI**: estados de carga, error, vacío; accesibilidad; feature flags si es experimental.

Después de implementar:

8. **Tests**: unitarios para lógica, integración para APIs, contrato para rutas críticas.
9. **Documentación**: actualizar el documento canónico del área, no crear uno nuevo.
10. **Validación**: `npm run lint && npx tsc --noEmit && npm test && npm run build`.
11. **Revisar diff**: `git diff --check && git diff --stat`.
12. **Limpiar**: eliminar logs, temporales, comentarios de debug.

---

## Feature flags

Las funcionalidades experimentales usan feature flags **con dueño y fecha de expiración**:

```typescript
// FLAG: sgie.documents.bulk_approve — owner: @equipo-sgie — expires: 2026-09-01
if (await featureFlags.isEnabled('sgie.documents.bulk_approve', context)) {
  // ...
}
```

- **Deny-by-default**: desactivadas por defecto.
- **Owner**: responsable que puede activar/desactivar.
- **Expiración**: fecha máxima; si no se promueve a permanente, se elimina el código.

---

## Nueva API endpoint

```text
1. Definir schema Zod (request + response)
2. Implementar handler con: auth → rate limit → validate → CSRF (si muta) → lógica → audit
3. Añadir a la clasificación del proxy (si requiere sesión)
4. Tests: 200, 400, 401, 403, 404, 409 (si aplica)
```

---

## Nueva migración

```bash
# 1. Modificar lib/schema.ts
# 2. Generar SQL
npx drizzle-kit generate
# 3. Verificar
npm run db:migrations:validate
# 4. La migración se registra automáticamente en el journal de Drizzle
```

---

## Definición de Done

Una función está completa cuando:

- [ ] Código implementado y revisado
- [ ] Tests pasan (unit + integration)
- [ ] Build pasa
- [ ] Sin código muerto ni temporales
- [ ] Documentación actualizada
- [ ] PR aprobado (si el flujo lo requiere)
- [ ] Feature flag documentado (si es experimental)
