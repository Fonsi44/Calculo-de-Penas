# Propuesta de rediseño SGIE y Admin

**Estado:** `PROPUESTA`; no implementada.  
**Restricción:** conserva reglas de negocio, fuentes de verdad y separación privada.

## Principios compartidos

- Una pantalla responde a una tarea principal.
- Excepciones y próximos pasos antes que métricas decorativas.
- Navegación por capacidad y rol, no por estructura técnica.
- Estados humanos consistentes; el valor técnico permanece en API/DB.
- Toda acción destructiva muestra alcance, dependencias y confirmación.
- Teclado completo, foco visible, objetivos ≥44 px, contraste WCAG 2.2 AA.
- `rounded-lg`, sombras `.btn-shadow-*`, iconos `w-11 h-11` cuando corresponda y dorado solo como acento, conforme a AGENTS.md.

## Sistema de diseño propuesto

| Token | Propuesta |
|---|---|
| Fondo | neutro cálido muy claro; superficies blancas; oscuro equivalente |
| Texto | gris carbón; secundario ≥4.5:1 |
| Primario | azul petróleo institucional para acción/selección |
| Acento | dorado existente, limitado a énfasis y no como único estado |
| Estados | verde éxito, ámbar atención, rojo bloqueo, azul información; siempre texto+ícono |
| Tipografía | Manrope/UI; serif institucional solo en marcas o títulos editoriales, no tablas |
| Espaciado | base 4 px; bloques 16/24/32; densidad con opción cómoda/compacta |
| Componentes | Button, Input, Select, Combobox, DatePicker, FilterBar, DataTable, Drawer, Modal, Toast, Empty/Error/Skeleton |

## SGIE

### Problemas observados

- El cockpit mezcla 7 contadores, lista extensa, tendencias, vencimientos, cuellos de botella, eventos y acciones.
- Estados técnicos largos dificultan escaneo.
- “Nuevo cliente”, “Nuevo expediente” y “Nueva tarea” llevan a listados; no queda claro si abren formulario.
- La búsqueda global y notificaciones existen, pero no explicitan alcance/filtros.

### Arquitectura de información

1. **Mi trabajo**
   - Hoy
   - Pendientes de revisión
   - Vencidos y bloqueados
2. **Expedientes**
   - Todos mis expedientes
   - Por etapa
   - Archivados
3. **Clientes**
4. **Documentos**
   - Por revisar
   - Faltantes
   - Rechazados
5. **Tareas y agenda**
6. **Comunicaciones**
   - Alertas
   - Correos
   - Enlaces de carga
7. **Reportes**

### Dashboard SGIE

- Encabezado: saludo, selector de alcance temporal, búsqueda global y acción primaria “Nuevo expediente”.
- Fila de trabajo: “Revisar hoy”, “Vencidos”, “Esperando cliente”, “Listos para firma”.
- Cola priorizada única, ordenada por urgencia/plazo/bloqueo con explicación del criterio.
- Agenda de 7 días y actividad reciente en segundo nivel.
- Gráficos y productividad bajo pestaña “Reportes”, no en el primer viewport.

### Wireframe — cockpit

```text
┌ Menú ─────────────────────────────────────────── Buscar ⌘K  Alertas  Perfil ┐
│ Mi trabajo / Hoy                                      [Nuevo expediente]   │
│ [Revisar 2] [Vencidos 7] [Esperando cliente 3] [Firma 1]                  │
│                                                                            │
│ Prioridad de hoy                                      Agenda (7 días)      │
│ ┌ Urgente · vence hoy ──────────────────────────┐  ┌ 09:00 Audiencia ┐    │
│ │ Expediente • Cliente • etapa                  │  │ Mañana: plazo    │    │
│ │ Bloqueo: falta documento   [Abrir] [Asignar]  │  └──────────────────┘    │
│ └───────────────────────────────────────────────┘                          │
│ Esperando a terceros · 3                           [Ver todo mi trabajo]    │
└────────────────────────────────────────────────────────────────────────────┘
```

**Problema que resuelve:** reduce la competencia entre métricas y convierte el panel en una cola accionable.

### Wireframe — expediente

```text
┌ Expedientes / SGIE-2026-…              Estado: En revisión  [Más acciones] ┐
│ Cliente · Área · Responsable · Próximo plazo                                │
│ [Resumen] [Documentos 8] [Tareas 4] [Actividad] [Comunicaciones]             │
│                                                                              │
│ Siguiente paso recomendado                                                   │
│ Verificar documento de identidad                     [Abrir documento]       │
│                                                                              │
│ Checklist                         Línea de tiempo                             │
│ ✓ Poder                            Hoy · documento recibido                   │
│ ! Identidad — requiere revisión   Ayer · recordatorio enviado                │
└──────────────────────────────────────────────────────────────────────────────┘
```

**Problema que resuelve:** agrupa la información por decisión, evita saltos entre módulos y hace visible el próximo paso.

### Tablas y formularios SGIE

- Columnas configurables: número, cliente, etapa, siguiente acción, plazo, responsable, prioridad.
- Vistas guardadas por usuario; filtros en chips removibles; URL conserva estado.
- En móvil, cada fila se vuelve tarjeta; nunca tabla horizontal obligatoria.
- Formularios en pasos: cliente → procedimiento → responsables → checklist → revisión.
- Guardado borrador explícito; prevención de salida con cambios; errores junto al campo y resumen superior.

### Nomenclatura de estados

| Valor técnico | Etiqueta humana |
|---|---|
| `documentos_parcialmente_recibidos` | Documentación incompleta |
| `analisis_completado` | Análisis listo |
| `pendiente_validacion_abogado` | Requiere revisión del abogado |
| `pendiente_de_firma` | Listo para firma |
| `inconsistencias_detectadas` | Requiere corrección |

## Admin

### Problemas observados

- El dashboard mezcla 8 métricas, acciones rápidas, búsqueda jurídica, posts recientes, módulos y marco normativo.
- Navegación lateral presenta contenidos, usuarios, SEO, auditoría, configuración y herramientas al mismo nivel.
- Acciones rápidas duplican navegación y no destacan anomalías: borradores antiguos, fallos SEO, usuarios bloqueados o jobs fallidos.

### Arquitectura de información

1. **Resumen** — excepciones, salud y actividad
2. **Contenido** — Blog, FAQ, Páginas, Menús, Medios, Áreas
3. **Personas y acceso** — Usuarios, roles, bloqueos, 2FA
4. **SGIE** — Métricas, plantillas, reglas, retención, asignaciones
5. **SEO y analítica** — salud, sitemap, inspección, IndexNow
6. **Auditoría y seguridad** — eventos, export, alertas
7. **Configuración** — sitio, integraciones, perfil
8. **Herramientas jurídicas** — calculadora, CP, delitos, casos

### Dashboard Admin

- Banda de salud: seguridad, jobs, email, SEO freshness, DB/storage.
- “Requiere atención” priorizado por severidad con responsable y fecha.
- Actividad administrativa reciente, no actividad jurídica completa.
- Métricas agrupadas por pestañas Contenido / Usuarios / SGIE / SEO.
- Acción primaria contextual: “Crear contenido” con menú, no cinco botones equivalentes.

### Wireframe — Admin

```text
┌ Menú ───────────────────────────────────────────── Buscar  Ayuda  Perfil ┐
│ Resumen administrativo                              [Crear contenido ▾]  │
│ Salud: Seguridad ●  Jobs ●  Email ●  SEO actualizado hace 2 días        │
│                                                                          │
│ Requiere atención                                Actividad reciente      │
│ [ALTA] 2 usuarios bloqueados      [Revisar]      Usuario actualizado     │
│ [MEDIA] GSC/GA4 sin actualizar    [Reautorizar]  Post publicado          │
│ [MEDIA] 34 borradores antiguos    [Filtrar]      Regla SGIE editada      │
│                                                                          │
│ [Contenido] [Usuarios] [SGIE] [SEO]                                    │
│ Publicados 141  Borradores 34  FAQ 78  Páginas …                        │
└──────────────────────────────────────────────────────────────────────────┘
```

**Problema que resuelve:** convierte el dashboard en centro de control y separa salud de inventario.

### Wireframe — editor de contenido

```text
┌ Blog / Editar post                    Guardado 10:42  [Vista previa] [Publicar] ┐
│ Título                                                                       │
│ Slug · Categoría · Autor · Fecha                                              │
│ ┌ Editor principal ──────────────────────┐ ┌ Calidad y SEO ────────────────┐   │
│ │ H2…                                    │ │ Título 54/60 ✓                │   │
│ │ Contenido                              │ │ Meta 143/160 ✓                │   │
│ │                                        │ │ 1 H1 ✓ · disclaimer externo ✓ │   │
│ └────────────────────────────────────────┘ │ Citas legales: revisar 2       │   │
│                                            └────────────────────────────────┘   │
└────────────────────────────────────────────────────────────────────────────────┘
```

**Problema que resuelve:** integra calidad, SEO y cumplimiento sin obligar a cambiar de pantalla; el preview debe usar el mecanismo seguro del plan.

## Responsive y accesibilidad

- Desktop ≥1280: sidebar fija, contenido de 12 columnas.
- Tablet 768–1279: sidebar colapsable; panel secundario como drawer.
- Móvil <768: barra superior, bottom actions solo para acciones seguras, tablas a cards.
- Foco restaurado al cerrar modal/drawer; Escape cierra; títulos `aria-labelledby`.
- Live regions para guardado/errores; estados no dependen solo de color.
- Gráficos con tabla equivalente y resumen textual.
- Pruebas obligatorias: teclado, 200 % zoom, 320 CSS px, lector NVDA/VoiceOver, reduced motion, contraste y errores.

## Componentes reutilizables prioritarios

`AppShell`, `ModuleNav`, `CommandPalette`, `HealthStrip`, `WorkQueue`, `MetricCard`, `DataTable`, `SavedView`, `StatusBadge`, `NextAction`, `Timeline`, `AuditDiff`, `FormStepper`, `StickyActionBar`, `AsyncState` y `PermissionGate`.

## Métricas de éxito

- Tiempo mediano hasta abrir el expediente prioritario: −30 %.
- Tareas críticas completadas sin retroceso: ≥95 %.
- Errores de formulario: −25 %.
- Acciones administrativas encontradas al primer intento: ≥90 % en prueba de usabilidad.
- 0 defectos WCAG AA críticos y 0 desbordamientos a 320/390/768 px.

