# Política de scripts y tooling

Reglas para mantener los scripts del repositorio organizados, con propósito claro y sin duplicación.

---

## Principios

1. **Cada script tiene propósito y consumidor identificable**.
2. **Los scripts viven en `tools/` por categoría**, no en `scripts/` por fase histórica.
3. **Los comandos de `package.json` son la interfaz canónica** para ejecutar scripts.
4. **Scripts one-off tienen fecha de expiración** y se archivan tras su uso.

---

## Estructura

```text
tools/
├── ci/               # Integración continua y calidad
│   └── repo-hygiene.mjs
├── db/               # Migraciones y base de datos
│   ├── run-migrations.mjs
│   └── manual-migrations.json
├── ops/               # Operaciones (deploy, monitorización)
├── data/              # Procesamiento de datos
├── development/       # Herramientas de desarrollo
└── one-off/           # Scripts de una sola ejecución (archivados)
    └── archive/       # Scripts ya ejecutados, conservados como referencia
```

---

## Convención de nombres en `package.json`

Usar namespacing con `:` para agrupar:

```text
check           # Validación completa
check:ci        # Validación para CI
check:fast      # Validación rápida (desarrollo)
lint            # ESLint
typecheck       # TypeScript
test            # Tests unitarios
test:e2e        # Tests end-to-end
build           # Build de producción
db:status       # Estado de migraciones
db:validate     # Validar migraciones
db:apply        # Aplicar migraciones
ops:deploy      # Desplegar
```

---

## Qué eliminar

- Scripts de fases históricas cerradas (nombres como `fase3`, `fase4a`, `fase7c`).
- Scripts que solo generaban informes antiguos.
- Scripts que apuntan a rutas/archivos inexistentes.
- Scripts duplicados.
- Scripts sin consumidor conocido (ni `package.json`, ni docs, ni CI, ni otros scripts).
- Scripts dependientes de arquitecturas eliminadas.

---

## Qué conservar

- Scripts con propósito operativo claro y vigente.
- Scripts referenciados en `package.json`.
- Scripts usados por CI/CD.
- Scripts de una sola ejecución que aún no se han ejecutado (con dry-run).
- Herramientas de desarrollo activas.

---

## Para crear un script nuevo

1. Determinar categoría (ci, db, ops, data, development).
2. Ubicarlo en `tools/<categoria>/`.
3. Añadir comando en `package.json` con nombre namespaced.
4. Documentar propósito, inputs, outputs, entorno requerido.
5. Si es one-off, añadir fecha de expiración.
