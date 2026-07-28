---
status: current
owner: engineering
created: 2026-07-28
last_reviewed: 2026-07-28
review_due: 2026-10-28
supersedes: null
superseded_by: null
---
# Estructura del repositorio

Reglas de organización del código y la documentación en Justicia Verdadera.

---

## Estructura canónica

```text
/
├── app/                  # Next.js App Router (rutas, páginas, APIs)
│   ├── (public)/         # Web pública
│   ├── blog/             # Blog público
│   ├── intranet/         # Intranet (login, admin, SGIE)
│   └── api/              # API routes
├── components/           # Componentes React
│   ├── ui/               # Componentes de interfaz genéricos (design system)
│   ├── shared/           # Componentes compartidos entre áreas
│   ├── public/           # Componentes de la web pública
│   ├── blog/             # Componentes del blog
│   ├── auth/             # Componentes de autenticación
│   ├── intranet/         # Componentes de intranet (genéricos)
│   ├── admin/            # Componentes de administración
│   └── sgie/             # Componentes del SGIE
├── lib/                  # Lógica de negocio y utilidades
│   ├── core/             # Utilidades centrales (tipos, constantes)
│   ├── auth/             # Autenticación y autorización
│   ├── db/               # Acceso a base de datos
│   ├── validation/       # Schemas Zod y validación
│   ├── email/            # Correo electrónico
│   ├── sgie/             # Lógica de negocio SGIE
│   ├── blog/             # Lógica del blog
│   └── public/           # Utilidades de la web pública
├── hooks/                # React hooks
├── tools/                # Herramientas y scripts organizados
│   ├── ci/               # CI/CD
│   ├── db/               # Migraciones y base de datos
│   ├── ops/              # Operaciones
│   └── development/      # Desarrollo
├── tests/                # Tests
│   ├── unit/             # Unitarios
│   ├── integration/      # Integración
│   ├── contract/         # Contrato de APIs
│   ├── e2e/              # End-to-end
│   ├── fixtures/         # Fixtures y datos de prueba
│   └── helpers/          # Utilidades de test
├── docs/                 # Documentación
│   ├── README.md         # Índice documental
│   ├── architecture/     # Arquitectura
│   ├── adr/              # Decisiones arquitectónicas (ADR)
│   ├── operations/       # Operaciones
│   ├── security/         # Seguridad
│   ├── standards/        # Estándares
│   └── audits/           # Auditorías
│       └── archive/      # Auditorías históricas
├── drizzle/              # Migraciones Drizzle
├── public/               # Assets estáticos públicos
├── data/                 # Datos canónicos (delitos, códigos legales)
├── AGENTS.md             # Protocolo para agentes IA
├── CHANGELOG.md          # Historial de cambios
├── CONTRIBUTING.md       # Guía de contribución
├── README.md             # Entrada técnica del proyecto
└── package.json          # Dependencias y scripts
```

---

## Reglas de organización

1. **Un dominio por archivo**: cada módulo tiene una responsabilidad clara.
2. **No archivos en raíz**: solo canónicos (`README`, `AGENTS`, `CHANGELOG`, `CONTRIBUTING`, `package.json`, configuraciones técnicas).
3. **No outputs en el repositorio**: logs, backups, exports, reports viven fuera del árbol o en carpetas ignoradas.
4. **Documentación viva**: `docs/` contiene la documentación canónica; las auditorías van a `docs/audits/archive/`.
5. **Tests junto al código que prueban**: los tests reflejan la estructura del código que validan.
6. **Tools organizadas**: `tools/` agrupa scripts por propósito, no por fase histórica.
7. **Sin código muerto**: si un módulo no tiene consumidor, se elimina o integra.

---

## Dónde poner cada cosa

| ¿Qué es? | ¿Dónde va? |
|----------|------------|
| Una página nueva | `app/` según su dominio (público, blog, intranet, admin) |
| Un componente reutilizable | `components/ui/` si es genérico, `components/<dominio>/` si es específico |
| Lógica de negocio | `lib/<dominio>/` |
| Un script de una sola ejecución | `tools/development/` con fecha de expiración |
| Un script operativo | `tools/ops/` con documentación |
| Una migración nueva | `drizzle/migrations/` vía `npx drizzle-kit generate` |
| Un ADR | `docs/adr/` con número secuencial |
| Una auditoría completada | `docs/audits/archive/YYYY-MM-DD/` |
