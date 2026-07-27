# CONTRIBUTING — Pineda y Asociados / Justicia Verdadera

Flujo profesional de contribución al repositorio. Toda persona o agente que
modifique código debe seguir este proceso.

---

## Flujo de trabajo

1. **Crear rama corta** desde `main`:
   ```bash
   git switch -c feat/descripcion-breve
   # o fix/descripcion, chore/descripcion, docs/descripcion
   ```

2. **Definir alcance**: qué archivos, qué domino, qué impacto.

3. **Implementar** siguiendo el protocolo de `AGENTS.md`.

4. **Añadir tests** para la funcionalidad nueva o modificada.

5. **Actualizar documentación** existente (no crear documentos nuevos en raíz).

6. **Ejecutar validaciones**:
   ```bash
   npm run lint
   npx tsc --noEmit
   npm test
   npm run build
   npm run db:migrations:validate
   ```

7. **Revisar diff**:
   ```bash
   git diff --check
   git diff --stat
   ```

8. **Commit atómico** (un cambio lógico por commit, mensaje en español):
   ```bash
   git add <archivos-relacionados>
   git commit -m "feat(dominio): descripción breve"
   ```

9. **Pull request** (cuando el flujo del proyecto lo requiera).

10. **Limpiar artefactos temporales** después del merge.

---

## Prohibiciones

- ❌ Añadir archivos en la raíz sin justificación.
- ❌ Crear una auditoría nueva para cada cambio.
- ❌ Duplicar scripts existentes.
- ❌ Añadir dependencias sin revisar su necesidad.
- ❌ Dejar funciones a medias visibles (botones falsos, endpoints inexistentes).
- ❌ Feature flags permanentes sin propietario ni fecha de expiración.
- ❌ Código sin tests cuando la complejidad lo justifique.
- ❌ Actualizar esquema DB sin migración registrada.
- ❌ Push a `main` directamente.
- ❌ Despliegues sin autorización.
- ❌ Modificar secretos o variables de entorno.
- ❌ `git reset --hard`, `git clean -fd`, reescritura de historial.

---

## Commits

- **Idioma**: español.
- **Prefijos**: `feat`, `fix`, `chore`, `docs`, `refactor`, `test`, `security`.
- **Formato**: `prefijo(scope): descripción breve`.
- **Atómicos**: un cambio lógico por commit.

---

## Validación por tipo de cambio

| Tipo | Validación mínima |
|------|-------------------|
| Documentación (`.md`) | Formato, enlaces |
| Código localizado | `lint` + `tsc` + tests del módulo |
| Transversal/seguridad/DB | `lint` + `tsc` + `test` + `build` |

---

## Pull Requests

Cada PR debe incluir:
- [ ] Alcance definido y aceptado.
- [ ] Sin cambios no relacionados.
- [ ] Auth/scope/CSRF revisados.
- [ ] Migración reproducible (si aplica).
- [ ] Tests nuevos/actualizados.
- [ ] Sin mocks productivos.
- [ ] Sin archivos huérfanos/generados/backups.
- [ ] Documentación actualizada.
- [ ] Feature flags con owner y fecha de expiración.
- [ ] `npm run build` verde.
