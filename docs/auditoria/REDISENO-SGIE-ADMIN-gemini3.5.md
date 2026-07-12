# PROPUESTA DE REDISEÑO DE UI/UX — SGIE & ADMIN
**Repositorio:** Justicia Verdadera (Pineda y Asociados)  
**Fecha:** 12 de Julio de 2026  
**Auditor Principal:** Diseñador Experto en UI/UX y Arquitecto Frontend (Gemini 3.5)  

---

## 1. Problemas Identificados en la Interfaz Actual
1.  ** layouts Duplicados y Complejidad Innecesaria:** La navegación actual utiliza layouts separados para el Administrador y el Abogado sin un sistema de diseño consolidado, lo que genera duplicidad de componentes y transiciones bruscas.
2.  **Densidad de Información Excesiva:** Las tablas de delitos, expedientes y bitácoras carecen de espacios en blanco (padding) adecuados y no implementan un sistema jerárquico claro, lo que eleva la carga cognitiva del abogado al buscar expedientes urgentes.
3.  **Alertas y Notificaciones de IA Poco Claras:** El sistema de extracción de documentos con IA en cola carece de un canal de feedback de progreso en vivo, forzando al usuario a refrescar la página manualmente para ver si la extracción de texto concluyó.
4.  **Falta de Accesibilidad:** El contraste del color dorado de acento sobre fondos claros no cumple con las pautas WCAG 2.1 AA, dificultando el uso del sistema con luz natural.

---

## 2. Nueva Arquitectura de la Información y Navegación
Se propone una estructura de navegación lateral (Sidebar) retráctil, unificada para ambos entornos, con aislamiento visual de elementos condicionado al rol de usuario.

```
[Sidebar Unificado]
 ├── Cockpit (Dashboard Abogado)
 ├── Clientes (Directorio y Ficha)
 ├── Expedientes (Listado y Detalle)
 ├── Documentos (Buzón de Cargas)
 ├── Tareas y Agenda (Calendario)
 ├── Alertas de IA (Gobernanza)
 └── [Sección Admin - Solo si rol === 'admin']
      ├── Usuarios (Gobernanza de Roles)
      ├── Calculadora Legal (Gestión de Reglas)
      ├── Delitos (Base de Conocimiento)
      ├── Configuración del Sitio (CMS)
      └── Bitácora de Auditoría
```

---

## 3. Especificaciones del Sistema de Diseño Premium

### 3.1 Paleta de Colores Curada (Modo Oscuro Sleek por Defecto)
*   **Fondo Principal (Background):** HSL `224, 25%, 12%` (Azul medianoche profundo y relajante para largas horas de lectura legal).
*   **Superficie (Surface):** HSL `224, 22%, 16%` (Gris azulado texturizado con bordes finos).
*   **Color Primario (Textos y Títulos):** HSL `0, 0%, 98%` (Blanco puro o gris ultra-claro).
*   **Color de Acento Legal (Dorado):** HSL `43, 70%, 55%` (Oro cálido, usado con moderación para botones primarios, bordes de foco y estados activos).
*   **Semántica:**
    *   *Éxito (Success):* HSL `142, 70%, 45%` (Verde esmeralda para expedientes aprobados).
    *   *Peligro (Danger/Alerta):* HSL `350, 80%, 55%` (Rojo carmesí para plazos vencidos).
    *   *Cargando (Info/Proceso):* HSL `200, 80%, 50%` (Azul celeste para procesamiento IA).

### 3.2 Tipografía y Espaciado
*   **Fuente Principal:** *Outfit* (Google Fonts) para títulos y elementos de interfaz comercial; *Inter* para tablas y textos de alta lectura.
*   **Escala de Espaciado:** Basada en múltiplos de 4px (`rem` equivalentes a 8px, 12px, 16px, 24px, 32px, 48px).
*   **Bordes:** Redondeado canónico `rounded-xl` (12px) para tarjetas y modales; `rounded-lg` (8px) para botones y entradas de formulario.

### 3.3 Accesibilidad (WCAG 2.1 AA)
*   Contraste de texto principal de al menos 4.5:1.
*   Indicadores de foco (`focus-visible:ring-2 focus-visible:ring-accent`) en todos los elementos interactivos para navegación con teclado.
*   Uso de etiquetas ARIA claras (`aria-busy`, `aria-live="polite"`) para estados de procesamiento IA y carga.

---

## 4. Wireframes Textuales de Vistas Clave

### 4.1 Vista: Cockpit del Abogado (Dashboard Principal)
```
+------------------------------------------------------------------------------------+
|  [Logo] Pineda y Asociados  |  Buscador Global (⌘K)          | (Alertas RAG) [User]|
+------------------------------------------------------------------------------------+
|  Sidebar        |  ¡Buenos días, Abogado Carlos!                                   |
|  [ ] Cockpit    |  Resumen del día: 3 Expedientes requieren atención.              |
|  [ ] Clientes   |                                                                  |
|  [ ] Expedientes|  +-------------------+  +-------------------+  +---------------+ |
|  [ ] Documentos |  | Actividad RAG IA  |  | Expedientes Act.  |  | Tareas Hoy    | |
|  [ ] Tareas     |  | 98% Precisión     |  | 24 Casos Asignados|  | 4 Pendientes  | |
|  [ ] Config     |  +-------------------+  +-------------------+  +---------------+ |
|                 |                                                                  |
|  [Admin Section]|  TABLA: EXPEDIENTES CRÍTICOS (PRÓXIMAS ALERTAS VENCIDAS)          |
|  [ ] Usuarios   |  +-------------------------------------------------------------+ |
|  [ ] Delitos    |  | Expediente | Cliente     | Estado      | Plazo     | Acción | |
|                 |  +------------+-------------+-------------+-----------+--------+ |
|                 |  | EXP-2026   | Juan Pérez  | [Pend_Docs] | Quedan 2d | [Ver]  | |
|                 |  | EXP-2021   | María Ruiz  | [Proces_IA] | Quedan 5d | [Ver]  | |
|                 |  +-------------------------------------------------------------+ |
+------------------------------------------------------------------------------------+
```

### 4.2 Vista: Detalle de Expediente y Carga Inteligente
```
+------------------------------------------------------------------------------------+
|  < Volver a Expedientes  |  Expediente: EXP-2026 (Homicidio Simple)  | [Calcular]  |
+------------------------------------------------------------------------------------+
|  FICHA CLIENTE: Juan Pérez  |  REQUISITOS DOCUMENTALES (Gobernanza)                |
|  Email: j.perez@email.com   |  [x] Documento de Identidad (Verificado)             |
|                             |  [/] Antecedentes Penales (IA Procesando - 60% ...)  |
|  ESTADO: Inconsistencias    |  [ ] Acta Policial (Pendiente de Cliente)            |
|                             |                                                      |
|  +------------------------+ |  ENLACES MÁGICOS ACTIVOS                             |
|  | [Generar Enlace]       | |  - j.perez@email.com (Expira en 4 días) [Revocar]    |
|  +------------------------+ |                                                      |
|                             |  HISTORIAL DE CARGAS RECIENTES                       |
|  [ Chat de Contexto RAG ]   |  - acta_policial_v2.pdf (1.2 MB) [Ver OCR]           |
|  "¿Qué artículos agravan    |  - dni_anverso.png (450 KB) [Verificado]             |
|   el caso del detenido?"    |                                                      |
+------------------------------------------------------------------------------------+
```

---

## 5. Estrategia de Migración Gradual (Bajo Riesgo)
Para evitar regresiones funcionales y caídas de servicio, el rediseño se dividirá en tres fases técnicas:

1.  **Fase 1: Consolidación del Sistema de Diseño (Tailwind Tokens):**
    *   Definir los tokens de color HSL y clases CSS de utilidad de forma centralizada en `app/globals.css`.
    *   No se tocan las pantallas; se preparan los componentes de UI básicos (Botones, Tarjetas, Entradas de texto).
2.  **Fase 2: Rediseño Modular de Pantallas SGIE (Abogado):**
    *   Migrar el layout del cockpit del abogado al nuevo diseño oscuro.
    *   Las pantallas de administración siguen usando el layout clásico para minimizar colisiones de datos.
3.  **Fase 3: Rediseño del Panel Admin y Unificación Final:**
    *   Migrar las pantallas del administrador (Usuarios, Catálogo de delitos, Auditoría) al nuevo sistema de diseño.
    *   Eliminar layouts duplicados e interfaces obsoletas de Next.js.
