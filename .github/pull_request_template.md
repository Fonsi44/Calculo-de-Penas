## Alcance

<!-- Qué cambia y qué queda explícitamente fuera. -->

## Riesgo y rollback

<!-- Riesgos, flags, migraciones y procedimiento concreto de reversión. -->

## Validación

- [ ] `npm run verify`
- [ ] Tests focalizados relevantes
- [ ] E2E aislado, si afecta auth/SGIE/admin/rutas críticas
- [ ] Sin escrituras productivas ni secretos
- [ ] Documentación viva actualizada
- [ ] Feature flags con owner, expiración, default y cleanup
- [ ] Migraciones reproducibles y reversibles, si aplica
- [ ] Diff limitado al alcance declarado
