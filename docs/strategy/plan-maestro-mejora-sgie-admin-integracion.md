# Plan maestro de mejora funcional SGIE + Admin + Integración

**Fecha:** 9 de julio de 2026
**Base documental:** `docs/audits/archive/2026-08-06/auditoria-descriptiva-intranet-sgie-admin.md`
**Tipo de documento:** Estratégico, funcional y accionable. No contiene código ni diseño visual final.
**Estado de evidencia:** Toda la base descriptiva proviene de una auditoría **NO VALIDADA en sesión autenticada**. Las afirmaciones marcadas como funcionalidad actual son estructurales (rutas, menús, controles presentes en el repositorio); su comportamiento real en producción está `PENDIENTE DE VALIDAR` salvo que se indique lo contrario.

---

## 1. Título

Plan maestro de mejora funcional SGIE + Admin + Integración — Segunda fase estratégica para la intranet de Pineda y Asociados.

Este plan define, sin implementación de código ni diseño visual, una hoja de ruta para:

- mejorar SGIE como sistema operativo interno del despacho;
- mejorar Admin como sistema de administración, gobierno y configuración;
- interrelacionar SGIE y Admin para que funcionen como una intranet unificada, coherente y basada en roles;
- mantener explícitamente aislada la web pública de cualquier cambio derivado de este plan.

---

## 2. Objetivo

El plan persigue **cinco objetivos simultáneos y no negociables**:

1. **Mejorar SGIE internamente.** Aclarar, simplificar y automatizar la operación diaria de clientes, expedientes, documentos, tareas, agenda, alertas, comunicaciones, reportes e inteligencia del expediente.
2. **Mejorar Admin internamente.** Reordenar un panel que hoy mezcla herramientas jurídicas, contenido público, usuarios, SEO, auditoría y configuración, separándolo por dominios y perfiles.
3. **Conectar SGIE y Admin de forma lógica, segura y productiva.** Definir los datos compartidos, los permisos, las automatizaciones y las trazas que deben existir entre ambos sistemas.
4. **Mantener aislada la web pública.** Ninguna mejora propuesta debe afectar el funcionamiento, contenido, SEO, navegación, estructura, diseño o experiencia de la web pública de Pineda & Asociados sin aprobación específica y expresa.
5. **Convertir SGIE en un sistema semi-autónomo de documentación y relación con el cliente.** SGIE debe preparar expedientes completos antes de escalar al abogado, de modo que este actúe principalmente como **revisor, validador y firmante**, no como operador de tareas manuales.

### 2.1 Principio rector del nuevo SGIE

La visión de fondo de este plan es que **SGIE debe trabajar para que el abogado intervenga lo mínimo posible en tareas operativas**. SGIE no se concibe como una mera herramienta de gestión, sino como un **sistema operativo autónomo de documentación y relación con el cliente** que:

- reduce el trabajo manual del abogado (solicitudes, recordatorios, clasificación, seguimiento documental);
- **prepara expedientes completos** antes de escalarlos al abogado;
- convierte al abogado en **revisor, validador y firmante** de valor, no en recolector de documentos;
- deja a Admin como **centro de gobierno** de toda esa autonomía (checklists, reglas, plantillas, estados, permisos y auditoría).

El corolario operativo es claro: el abogado debe dedicarse a **revisar expedientes completos, resolver excepciones, firmar/aprobar y avanzar al siguiente expediente**. El resto del trabajo operativo lo asume SGIE, dentro de los límites y permisos que defina Admin.

El plan es **estratégico y funcional**, no técnico ni visual. No propone componentes, no redacta código y no define estilos. Toda propuesta que pudiera tener efecto en la web pública se marca explícitamente como **“Impacto potencial, requiere aprobación específica”** y queda excluida de la ejecución directa del plan.

### 2.2 Definición de “expediente completo”

Un expediente solo debe marcarse como **completo** (y, por tanto, escalable al abogado como “Listo para revisión”) cuando se cumplan **todos** estos criterios:

1. cliente identificado;
2. datos básicos del expediente completos;
3. documentación requerida recibida según el tipo de procedimiento;
4. **checklist documental validado**;
5. documentos **clasificados**;
6. documentos **revisados o prevalidables** (por reglas o por IA con confianza suficiente);
7. tareas críticas cerradas;
8. comunicaciones importantes registradas;
9. **resumen del expediente generado** (con confianza y fuentes);
10. alertas críticas resueltas o marcadas deliberadamente;
11. **siguiente acción recomendada** propuesta;
12. **trazabilidad/auditoría** disponible.

La marca “Listo para revisión” es el evento central del modelo: indica que SGIE ha hecho todo el trabajo preparatorio y el expediente está en condiciones de ser decidido por el abogado. Hasta que no se cumple el checklist completo, el expediente **no debe escalar** al abogado como tarea de revisión.

### 2.3 Modelo de autonomía de SGIE

La autonomía de SGIE se describe por **niveles**, para que el despliegue sea progresivo, medible y reversible. Admin gobierna en qué nivel opera cada tipo de expediente.

| Nivel | Nombre | Qué hace SGIE | Qué hace el abogado | Estado |
|---|---|---|---|---|
| **Nivel 0** | Gestión manual | Solo registra | Opera todo manualmente | Estado actual asumido (`PENDIENTE DE VALIDAR`) |
| **Nivel 1** | Asistido | Recordatorios y estados visibles | Sigue gestionando, pero con avisos | Mejora propuesta a corto plazo |
| **Nivel 2** | Autómata de reglas | Genera tareas, alertas y correos por reglas | Revisa excepciones y decide | Objetivo de la fase de implementación |
| **Nivel 3** | Preparador de expedientes | Prepara el expediente completo y lo marca “Listo para revisión” | Revisa, valida, firma o devuelve | **Objetivo estratégico central de este plan** |
| **Nivel 4** *(futuro)* | Propone decisiones | Propone decisiones operativas, siempre con validación humana | Aprueba o rechaza la propuesta | Futuro, fuera del alcance de este plan |

El **Nivel 3 es la meta funcional** del plan: SGIE como motor operativo que entrega expedientes listos para decisión. El Nivel 4 queda explícitamente como futuro y nunca ejecuta decisiones sin validación humana.

### 2.4 Relación SGIE–cliente

SGIE debe encargarse de toda la comunicación documental rutinaria con el cliente, para que **el abogado no tenga que perseguir documentación básica**. Concretamente, SGIE gestiona:

- solicitar documentación (mediante enlaces de carga y plantillas);
- enviar recordatorios escalonados;
- informar de la recepción de cada documento;
- pedir correcciones cuando un documento no es válido o está incompleto;
- avisar de documentos faltantes contra el checklist;
- mantener el historial de comunicaciones con el cliente;
- escalar al abogado solo cuando el cliente no responde tras los recordatorios definidos.

El objetivo es que la relación documental cliente–despacho sea **mayoritariamente automática, trazable y auditable**, y que el abogado solo intervenga en comunicaciones de valor jurídico o en bloqueos reales.

### 2.5 Relación SGIE–abogado

El abogado no debe recibir un flujo indiscriminado de tareas. Debe recibir una **bandeja de expedientes listos para revisión**, donde cada ítem le entrega:

- **resumen ejecutivo** del expediente;
- **checklist documental** con su estado;
- documentos pendientes de validación (los que la IA o las reglas marcan como dudosos);
- **riesgos o dudas** detectados (contradicciones, plazos, baja confianza);
- **recomacción de siguiente acción**;
- botones de acción directa: **aprobar, devolver, firmar o pedir más información**.

El principio es que el abogado siempre sepa **qué revisar ahora** y pueda decidir en el menor número de pasos posible, con toda la información preparada por SGIE.

### 2.6 Reparto de papeles (resumen estratégico)

| Actor | Papel en el nuevo modelo |
|---|---|
| **SGIE** | Motor operativo semi-autónomo: prepara expedientes completos, gestiona la relación documental con el cliente y escala solo lo necesario. |
| **Admin** | Centro de gobierno: define checklists, reglas, plantillas, estados, permisos, qué automatiza SGIE, qué requiere abogado, audita y mide cuellos de botella. |
| **Abogado** | Revisor final de valor: revisa expedientes completos, resuelve excepciones, firma/aprueba y avanza al siguiente. |
| **Cliente** | Interactúa con SGIE para entregar documentación; recibe recordatorios y confirmaciones automáticas. |
| **IA interna** | Prepara y sugiere (resume, clasifica, extrae, detecta, recomienda); **nunca firma, aprueba, cierra ni sustituye** al abogado. |

---

## 3. Diagnóstico base

### 3.1 Qué es SGIE hoy

SGIE es el sistema operativo interno para la gestión diaria del bufete. Se accede por `/intranet/sgie` y su pantalla inicial es el **Cockpit del abogado**, orientado a señales de trabajo pendiente. Admite perfiles de **abogado** y **administrador** (este último con vista de supervisión de todos los expedientes y enlace a Admin).

Módulos identificados: Cockpit, Clientes, Expedientes, Documentos, Alertas, Tareas, Agenda, Correos, más **Reportes**, **Productividad**, **Inteligencia del expediente** y **Enlaces de carga** (estos últimos no todos visibles en el menú principal).

### 3.2 Qué es Admin hoy

Admin es el panel de administración del ecosistema digital del bufete. Se accede por `/intranet/admin` y combina herramientas jurídicas, contenido público, usuarios, SEO, auditoría y configuración, además de módulos especializados de supervisión SGIE (métricas, plantillas de correo, reglas, retención documental).

Grupos del menú: Inicio, Herramientas jurídicas, Administración, Gestión de contenido, Configuración. Existen además rutas no visibles en el menú: Agravantes específicas y los módulos de administración SGIE.

### 3.3 Qué problemas tiene SGIE

- **Rutas relevantes fuera del menú:** Productividad, Reportes (solo accesible desde el cockpit) e Inteligencia del expediente no son plenamente descubribiles.
- **Densidad operativa alta:** el cockpit y las fichas de expediente concentran muchas señales, estados y acciones.
- **Permisos y feedback no validados:** no se ha comprobado la matriz de permisos real, ni los mensajes posteriores a operaciones, ni el comportamiento de estados numerosos (expedientes, documentos, tareas, agenda).
- **Procesos posiblemente manuales:** reportes, correos, clasificación documental y cambios de estado podrían depender de seguimiento manual (`PENDIENTE DE VALIDAR`).
- **Inteligencia del expediente sin validación:** el resumen asistido y los datos extraídos con IA no han sido verificados en producción.

### 3.4 Qué problemas tiene Admin

- **Mezcla de dominios:** reúne bajo un mismo panel funciones operativas jurídicas, editoriales, SEO, técnicas y de seguridad, lo que eleva la carga cognitiva y dificulta que cada perfil identifique su área.
- **Rutas fuera del menú:** Agravantes específicas y los módulos de administración SGIE no aparecen en la navegación principal.
- **Límites de rol poco evidentes:** no se aprecia separación clara entre administrador técnico, editor, analista SEO, abogado y supervisor.
- **Doble administración de usuarios:** existen “Usuarios” (general) y “Usuarios y accesos SGIE”; su diferencia funcional no es clara.
- **Terminología inconsistente:** conviven “Panel general”, “Panel de Administración”, “Cockpit” y “dashboard”.
- **Retención documental marcada `NO VALIDADO`:** no debe considerarse operativa; la exportación previa y la eliminación no pueden asumirse.

### 3.5 Qué problemas existen entre ambos

- **Asimetría de navegación:** SGIE enlaza a Admin (para administradores), pero Admin no muestra acceso directo a SGIE.
- **Usuarios duplicados:** dos superficies de gestión de usuarios con frontera difusa.
- **Métricas dispersas:** Admin SGIE tiene métricas, pero el cockpit también muestra señales; la relación y la fuente única no están claras.
- **Plantillas de correo:** existen en Admin SGIE, pero el módulo de Correos de SGIE no se ha validado contra ellas.
- **Reglas y retención:** módulos administrativos que afectarían a SGIE, pero su vigencia funcional está sin validar.

### 3.6 Qué está pendiente de validar por falta de sesión autenticada

Todo lo siguiente está `PENDIENTE DE VALIDAR` o `NO VALIDADO` según la auditoría:

- apariencia interna real en producción autenticada;
- datos mostrados en cada módulo;
- permisos efectivos por módulo, registro y acción;
- persistencia de operaciones y de cálculos;
- éxito, fallos parciales y mensajes posteriores a operaciones;
- exportaciones, descargas, cargas, reportes y formatos;
- integraciones reales (IA, correo, descargas);
- cobertura de confirmaciones, filtros, paginación y notificaciones;
- responsive y accesibilidad autenticados (sin auditoría WCAG ejecutada);
- retención documental (`NO VALIDADO`).

### 3.7 Módulos de Admin con relación con la web pública (tratamiento especial)

Estos módulos administran contenido o configuración que se proyecta hacia la web pública y deben tratarse con cuidado para no afectar producción:

- **Blog**, **FAQ**, **Páginas**, **Menús**, **Biblioteca de medios**, **Áreas jurídicas**, **SEO** y **Sitio** (configuración global).

Para este plan, estos módulos se analizan **exclusivamente como funciones internas de administración**. Cualquier mejora propuesta queda **limitada a la administración interna** y, si pudiera tener efecto visible en la web pública, se marca como **“Impacto potencial, requiere aprobación específica”** y no se incluye como acción directa del plan.

---

## 4. Visión futura

La intranet se concibe como un **ecosistema de tres capas**, con la web pública explícitamente fuera del alcance.

### 4.1 Capa SGIE — motor operativo semi-autónomo

Soporta el trabajo del despacho: clientes, expedientes, documentos, tareas, agenda, alertas, comunicaciones, reportes e inteligencia del expediente. Es la capa donde se ejecuta el trabajo real. En el modelo objetivo, SGIE es **semi-autónomo**: prepara expedientes completos, gestiona la relación documental con el cliente y escala al abogado solo lo que requiere decisión jurídica. La meta funcional es el **Nivel 3 de autonomía** (sección 2.3).

### 4.2 Capa Admin — centro de gobierno, configuración y supervisión

Soporta el gobierno del sistema: usuarios, roles, permisos, configuración SGIE, plantillas, reglas, auditoría, retención, métricas globales, contenido web (como función interna), SEO (como función interna) y herramientas jurídicas. En el modelo objetivo, Admin **gobierna la autonomía de SGIE**: define qué automatiza SGIE, qué requiere abogado, y mide cuellos de botella y los KPIs de autonomía (sección 14.1).

### 4.3 Capa común — servicios transversales

Servicios compartidos por SGIE y Admin:

- **identidad:** usuarios, roles y permisos unificados;
- **auditoría:** trazabilidad de acciones críticas;
- **métricas:** indicadores consistentes entre cockpit y Admin;
- **notificaciones:** alertas y avisos por rol;
- **plantillas:** correos y comunicaciones;
- **reglas de negocio:** versionadas y trazables;
- **búsqueda:** unificada sobre clientes, expedientes, documentos, tareas y corpus jurídico;
- **IA interna:** asistencia con límites claros y trazabilidad.

### 4.4 Web pública — fuera del alcance

La web pública **queda fuera del rediseño de esta fase**. La intranet puede **administrar** contenido o SEO como función interna, pero este plan no propone modificar ni replantear la web pública. Cualquier mejora que pudiera proyectarse externamente se separa como **“Fase futura independiente: revisión web pública”** (sección 15.11) y queda fuera de la ejecución del plan.

---

## 5. Plan de mejora de SGIE

Para cada módulo: función actual, problema detectado, mejora propuesta, automatizaciones posibles, relación con Admin, prioridad, beneficio esperado y confirmación de impacto sobre la web pública.

> **Nota de evidencia:** la “función actual” describe estructura observada en el repositorio; el comportamiento real está `PENDIENTE DE VALIDAR`.

### 5.1 Cockpit del abogado

- **Función actual:** pantalla inicial con métricas de expedientes, documentos, alertas, tareas y correos; expedientes recientes; tendencia por estado; tareas vencidas; cuellos de botella; eventos próximos; acciones rápidas.
- **Problema detectado:** densidad visual alta; no se ha validado cuáles señales son prioritarias por rol; métricas de cockpit y de Admin SGIE podrían solaparse.
- **Mejora propuesta:** definir un **conjunto canónico de señales por rol** (abogado, supervisor, administrador SGIE) y reducir la densidad inicial mostrando solo lo crítico, con acceso a vistas detalladas.
- **Automatizaciones posibles:** cálculo automático de tareas vencidas, detección de expedientes bloqueados y badges en tiempo real.
- **Relación con Admin:** las métricas deben alimentarse de la misma fuente que las métricas globales de Admin (capa común).
- **Prioridad:** P0.
- **Beneficio esperado:** menor carga cognitiva al inicio de jornada y priorización clara del trabajo.
- **Impacto web pública:** sin impacto.

### 5.2 Clientes

- **Función actual:** listado y ficha de clientes con nombre/razón social, identidad/RTN, contacto, notas, fecha, estado y expedientes vinculados. Acciones: buscar, crear, editar, desactivar/reactivar, crear expediente.
- **Problema detectado:** permisos, validación y feedback no validados; posible duplicidad de identidades; relación con cuentas de usuario poco clara.
- **Mejora propuesta:** estandarizar la ficha, validar unicidad de identidad/RTN, enlazar el cliente con el historial de auditoría y definir estados claros (activo, inactivo, archivado).
- **Automatizaciones posibles:** alertas de cliente sin expediente abierto, recordatorios de contacto y detección de datos incompletos.
- **Relación con Admin:** permisos, historial y auditoría compartidos.
- **Prioridad:** P1.
- **Beneficio esperado:** datos limpios, trazabilidad y menos errores de duplicación.
- **Impacto web pública:** sin impacto.

### 5.3 Expedientes

- **Función actual:** listado con número interno, cliente, procedimiento, estado, prioridad, responsable y actualización; ficha con aprobación/rechazo de pasos y documentos, y gestión de enlaces de carga.
- **Problema detectado:** número elevado de estados sin nomenclatura validada; aprobación/rechazo no validados; posible ambigüedad de estados.
- **Mejora propuesta:** definir un **catálogo de estados canónico** con descripción, transiciones permitidas y responsable de cada transición; mostrar siempre el siguiente paso recomendado.
- **Automatizaciones posibles:** generación de tareas al cambiar de estado, alertas de expediente parado y notificaciones al responsable.
- **Relación con Admin:** usuarios, permisos, reglas de negocio, métricas y auditoría.
- **Prioridad:** P0.
- **Beneficio esperado:** flujos predecibles y menor ambigüedad operativa.
- **Impacto web pública:** sin impacto.

### 5.4 Documentos

- **Función actual:** documentos asociados a expedientes con estado de procesamiento; consultar, procesar, abrir detalle, previsualizar PDF y descargar.
- **Problema detectado:** clasificación documental posiblemente manual; estados de procesamiento no validados; relación con retención documental no operativa.
- **Mejora propuesta:** estandarizar estados (pendiente, en revisión, aprobado, rechazado, archivado), mostrar checklist de documentos requeridos por tipo de expediente y registrar revisor y fecha.
- **Automatizaciones posibles:** detección de documentos faltantes, clasificación con IA (siempre sugerida, no ejecutiva) y alertas de vencimiento documental.
- **Relación con Admin:** retención documental, IA, permisos y auditoría.
- **Prioridad:** P0.
- **Beneficio esperado:** revisión documental trazable y menos documentos perdidos.
- **Impacto web pública:** sin impacto.

### 5.5 Tareas

- **Función actual:** tareas con estado, responsable, fechas y comentarios. Crear, editar, completar, reabrir y gestionar comentarios.
- **Problema detectado:** origen de las tareas (manual vs. automático) no está claro; feedback y permisos no validados.
- **Mejera propuesta:** distinguir visualmente tareas **manuales** y **generadas automáticamente** por reglas; mostrar el desencadenante de cada tarea automática.
- **Automatizaciones posibles:** creación automática desde cambios de estado de expediente, recordatorios escalonados y reasignación por rol.
- **Relación con Admin:** roles, usuarios, alertas y métricas.
- **Prioridad:** P1.
- **Beneficio esperado:** trabajo predecible y menor dependencia de seguimiento manual.
- **Impacto web pública:** sin impacto.

### 5.6 Agenda

- **Función actual:** eventos y estados; consultar, reprogramar con motivo, confirmar, completar y cancelar.
- **Problema detectado:** relación con expedientes y tareas no clara; reprogramaciones no validadas.
- **Mejora propuesta:** vincular cada evento a expediente o tarea, registrar motivo de reprogramación y mostrar conflictos de agenda.
- **Automatizaciones posibles:** recordatorios previos, bloqueo de solapamientos y notificaciones al cliente interno.
- **Relación con Admin:** plantillas de correo y métricas.
- **Prioridad:** P2.
- **Beneficio esperado:** agenda fiable y menos citas perdidas.
- **Impacto web pública:** sin impacto.

### 5.7 Alertas

- **Función actual:** alertas activas con contexto; consultar y resolver.
- **Problema detectado:** origen configurable vs. fijo no claro; resolución no validada.
- **Mejora propuesta:** tipificar alertas (vencimiento, documento, tarea, expediente bloqueado, sistema), mostrar origen y acción recomendada, y registrar resolución.
- **Automatizaciones posibles:** generación desde reglas configurables en Admin y escalado por inactividad.
- **Relación con Admin:** reglas configurables y auditoría.
- **Prioridad:** P1.
- **Beneficio esperado:** alertas accionables, no solo informativas.
- **Impacto web pública:** sin impacto.

### 5.8 Correos / comunicaciones

- **Función actual:** comunicaciones y estados, incluidos fallos; consultar y revisar resultados.
- **Problema detectado:** relación con plantillas de Admin no validada; tratamiento de fallos no claro.
- **Mejora propuesta:** mostrar plantilla utilizada, destinatario, estado de entrega y motivo de fallo; permitir reenvío desde la ficha.
- **Automatizaciones posibles:** envío automático desde eventos del expediente usando plantillas y reintentos programados.
- **Relación con Admin:** plantillas de correo gestionadas en Admin.
- **Prioridad:** P1.
- **Beneficio esperado:** comunicaciones trazables y recuperables.
- **Impacto web pública:** sin impacto.

### 5.9 Reportes

- **Función actual:** selección y resumen de expedientes; generar reportes; formato y descarga `PENDIENTES DE VALIDAR`.
- **Problema detectado:** formato, descarga y exportación no confirmados; audiencia no clara.
- **Mejora propuesta:** definir un catálogo de reportes por perfil, con parámetros, formato y destinatario, y registrar cada generación.
- **Automatizaciones posibles:** reportes programados y entrega por correo.
- **Relación con Admin:** métricas globales y auditoría.
- **Prioridad:** P2.
- **Beneficio esperado:** reportes reproducibles y auditables.
- **Impacto web pública:** sin impacto.

### 5.10 Inteligencia del expediente

- **Función actual:** resumen asistido, datos extraídos y nivel de confianza; generar o actualizar con IA. `PENDIENTE DE VALIDAR`.
- **Problema detectado:** confianza y fuentes no validadas; sin límites operativos claros.
- **Mejora propuesta:** mostrar siempre **confianza y fuentes**, marcar el resultado como borrador no ejecutivo y registrar quién lo revisa.
- **Automatizaciones posibles:** resumen periódico, detección de faltantes y sugerencia de próximas acciones (siempre sugeridas).
- **Relación con Admin:** reglas de IA y auditoría.
- **Prioridad:** P2.
- **Beneficio esperado:** IA útil y trazable, sin reemplazar criterio humano.
- **Impacto web pública:** sin impacto.

### 5.11 Enlaces de carga documental

- **Función actual:** enlaces activos con vigencia, usos y email opcional; generar, copiar y revocar.
- **Problema detectado:** seguridad y vigencia no validados; relación con documentos recibidos no clara.
- **Mejora propuesta:** vincular cada enlace al expediente y al checklist documental, registrar usos y caducidad, y notificar al recibir.
- **Automatizaciones posibles:** caducidad automática, notificación de recepción y clasificación inicial del fichero.
- **Relación con Admin:** permisos, retención y auditoría.
- **Prioridad:** P1.
- **Beneficio esperada:** captura documental segura y trazable.
- **Impacto web pública:** sin impacto.

### 5.12 Productividad (ruta no visible en menú)

- **Función actual:** indicadores de productividad; alcance y audiencia `PENDIENTES DE VALIDAR`.
- **Problema detectado:** módulo no descubrible; audiencia incierta.
- **Mejora propuesta:** **validar primero** si el módulo está vigente; si lo está, integrarlo en el menú o en el dashboard por rol; si no, retirar la ruta.
- **Relación con Admin:** métricas globales.
- **Prioridad:** P2 (condicionada a validación previa).
- **Beneficio esperado:** navegación coherente, sin rutas huérfanas.
- **Impacto web pública:** sin impacto.

---

## 6. Plan de mejora de Admin

Para cada módulo: función actual, problema detectado, mejora propuesta, relación con SGIE, prioridad, beneficio esperado e **impacto sobre la web pública** con la taxonomía exigida:

- **Sin impacto en web pública**
- **Impacto potencial, requiere aprobación específica**
- **Pendiente de validar**

Las mejoras en Blog, FAQ, Páginas, Menús, Biblioteca de medios, Áreas jurídicas y SEO se limitan a la **administración interna**. No se proponen cambios visibles en la web pública.

### 6.1 Dashboard Admin (Panel general)

- **Función actual:** totales de delitos, artículos CP, ramas, pasos, posts y FAQ; sesión; posts recientes; módulos; acciones rápidas; búsqueda de artículos CP.
- **Problema detectado:** mezcla de dominios en una sola pantalla; compite visualmente.
- **Mejora propuesta:** segmentar el dashboard por **dominio** (operación SGIE, contenido, juridical, técnico) y mostrar solo lo relevante al rol.
- **Relación con SGIE:** consume métricas de operación.
- **Prioridad:** P1.
- **Beneficio esperado:** orientación rápida por perfil.
- **Impacto web pública:** sin impacto.

### 6.2 Usuarios y accesos

- **Función actual:** cuentas, roles, estado, último acceso y vínculos SGIE/corporativos; buscar, filtrar, crear/editar, bloquear, desbloquear y generar contraseña temporal.
- **Problema detectado:** posible solapamiento con “Usuarios y accesos SGIE”; permisos efectivos no validados.
- **Mejora propuesta:** **unificar la gestión de usuarios** en una sola superficie o, si se mantienen dos, documentar claramente la frontera; alinear roles con la matriz de la sección 8.
- **Relación con SGIE:** identidad y permisos compartidos.
- **Prioridad:** P0.
- **Beneficio esperado:** una sola fuente de verdad de identidad.
- **Impacto web pública:** sin impacto.

### 6.3 Roles y permisos

- **Función actual:** distinción de roles en layouts; matriz no validada.
- **Problema detectado:** permisos poco visibles; no se comprobó la matriz por módulo y acción.
- **Mejora propuesta:** implementar la **matriz de la sección 8** como fuente canónica, comunicar por qué una acción está disponible/deshabilitada y registrar cambios de permisos.
- **Relación con SGIE:** aplica a todos los módulos SGIE.
- **Prioridad:** P0.
- **Beneficio esperado:** gobierno claro y reversible.
- **Impacto web pública:** sin impacto.

### 6.4 Configuración SGIE

- **Función actual:** módulos de administración SGIE (métricas, plantillas, reglas, retención) **no visibles en el menú principal**.
- **Problema detectado:** rutas no descubribles; vigencia funcional sin validar; retención `NO VALIDADO`.
- **Mejora propuesta:** agruparlos en un **espacio “Configuración SGIE”** visible y separado, con permiso restringido a administrador SGIE/dirección; dejar retención como `PENDIENTE DE VALIDAR` y no operativa hasta aprobación.
- **Relación con SGIE:** gobierno directo de la operación.
- **Prioridad:** P1.
- **Beneficio esperado:** configuración descubrible y controlada.
- **Impacto web pública:** sin impacto.

### 6.5 Métricas SGIE

- **Función actual:** expedientes, documentos, IA, correos, alertas, tareas y distribución por estado/abogado; consultar. No visible en menú.
- **Problema detectado:** no visible; relación con cockpit no clara.
- **Mejora propuesta:** usar la **misma fuente de métricas** que el cockpit y exponer vistas de supervisión (por estado, por abogado, por cuello de botella).
- **Relación con SGIE:** agregación de operación.
- **Prioridad:** P1.
- **Beneficio esperado:** supervisión consistente.
- **Impacto web pública:** sin impacto.

### 6.6 Plantillas de correo

- **Función actual:** plantillas con variables, estado y vista previa; buscar, filtrar, crear, editar, previsualizar, activar/desactivar. No visible en menú.
- **Problema detectado:** no visible; relación con Correos SGIE no validada.
- **Mejora propuesta:** hacerlas descubribles, versionarlas y validarlas con envío de prueba; documentar variables disponibles.
- **Relación con SGIE:** las usa el módulo Correos y las automatizaciones.
- **Prioridad:** P1.
- **Beneficio esperado:** comunicaciones consistentes.
- **Impacto web pública:** sin impacto.

### 6.7 Reglas de negocio

- **Función actual:** versión/configuración de reglas; guardar nueva versión. No visible en menú.
- **Problema detectado:** no visible; alcance y efectos no validados.
- **Mejora propuesta:** gobernar las reglas que disparan automatizaciones SGIE (tareas, alertas, correos), versionar y auditar cada cambio.
- **Relación con SGIE:** motor de automatizaciones.
- **Prioridad:** P1.
- **Beneficio esperado:** automatizaciones reversibles y trazables.
- **Impacto web pública:** sin impacto.

### 6.8 Auditoría

- **Función actual:** registro de acciones administrativas; consultar y filtrar; exportación `PENDIENTE DE VALIDAR`.
- **Problema detectado:** exportación y cobertura no confirmadas; no claro qué acciones quedan registradas.
- **Mejora propuesta:** definir el **catálogo de acciones críticas** que deben auditar (sección 10.12), permitir filtrado y exportación, y proteger contra borrado.
- **Relación con SGIE:** audita acciones críticas SGIE.
- **Prioridad:** P0.
- **Beneficio esperado:** trazabilidad legal y operativa.
- **Impacto web pública:** sin impacto.

### 6.9 Retención documental

- **Función actual:** política prevista de retención documental; pantalla marcada `NO VALIDADO`; exportación previa y eliminación no deben asumirse operativas.
- **Problema detectado:** no validada; riesgo legal y documental alto.
- **Mejora propuesta:** **no activar funcionalmente** hasta aprobación legal; mientras tanto, dejarla visible solo como borrador de política, con advertencia clara.
- **Relación con SGIE:** afectaría documentos y enlaces de carga.
- **Prioridad:** P2 (bloqueada por validación legal).
- **Beneficio esperado:** evitar destrucción no autorizada de documentos.
- **Impacto web pública:** sin impacto.

### 6.10 Contenido público (gestión interna)

- **Función actual:** módulo agrupador de gestión de contenido (Blog, FAQ, Páginas, Menús, Biblioteca de medios, Áreas jurídicas).
- **Problema detectado:** mezcla con funciones técnicas y jurídicas; límites de rol poco claros.
- **Mejora propuesta:** segregar el dominio editorial bajo un rol **Editor de contenido**, con flujo de revisión/estados/aprobación interno antes de cualquier publicación.
- **Relación con SGIE:** ninguna directa.
- **Prioridad:** P1.
- **Beneficio esperado:** gobierno editorial claro.
- **Impacto web pública:** **Impacto potencial, requiere aprobación específica** (solo en la medida en que se ejecuten publicaciones; las mejoras internas de administración no modifican la web por sí mismas).

### 6.11 Blog (administración interna)

- **Función actual:** posts, categorías, publicación y estado; buscar/filtrar, crear, editar, duplicar, publicar o gestionar estado, ver en web y eliminar.
- **Problema detectado:** flujo editorial y permisos no validados.
- **Mejora propuesta:** definir estados editoriales (borrador, en revisión, aprobado, programado, publicado, archivado), separar redactor, revisor y publicador, y auditar publicaciones.
- **Relación con SGIE:** ninguna.
- **Prioridad:** P2.
- **Beneficio esperado:** publicación controlada.
- **Impacto web pública:** **Impacto potencial, requiere aprobación específica** (la mejora interna no altera la web; la publicación sí proyecta externamente).

### 6.12 FAQ (administración interna)

- **Función actual:** preguntas, categorías y publicación; crear, editar, gestionar estado y eliminar.
- **Problema detectado:** igual que Blog.
- **Mejora propuesta:** mismo flujo editorial que Blog.
- **Relación con SGIE:** ninguna.
- **Prioridad:** P2.
- **Beneficio esperado:** contenido revisado.
- **Impacto web pública:** **Impacto potencial, requiere aprobación específica**.

### 6.13 Páginas (administración interna)

- **Función actual:** páginas públicas con estado, contenido, SEO y fecha; buscar, abrir editor visual, editar metadatos/SEO, ver página pública y eliminar.
- **Problema detectado:** editor y SEO no validados; riesgo alto por naturaleza del módulo.
- **Mejora propuesta:** flujo de borrador/revisión/aprobación, versionado y previsualización antes de publicar; bloquear eliminación sin doble confirmación.
- **Relación con SGIE:** ninguna.
- **Prioridad:** P1.
- **Beneficio esperado:** cambios controlados y reversibles.
- **Impacto web pública:** **Impacto potencial, requiere aprobación específica**.

### 6.14 Menús (administración interna)

- **Función actual:** menús y elementos con etiqueta y URL; crear, renombrar, añadir/quitar elementos, guardar y eliminar.
- **Problema detectado:** impacto directo en navegación pública; permisos no validados.
- **Mejora propuesta:** restringir a rol específico, requerir aprobación para cambios y auditar toda modificación.
- **Relación con SGIE:** ninguna.
- **Prioridad:** P1.
- **Beneficio esperado:** navegación pública protegida.
- **Impacto web pública:** **Impacto potencial, requiere aprobación específica**.

### 6.15 Biblioteca de medios (administración interna)

- **Función actual:** archivos multimedia; copiar URL, descargar y eliminar; carga `PENDIENTE DE VALIDAR`.
- **Problema detectado:** carga y permisos no validados.
- **Mejora propuesta:** estandarizar carga, metadatos y versiones; auditar eliminaciones.
- **Relación con SGIE:** ninguna.
- **Prioridad:** P2.
- **Beneficio esperado:** medios organizados.
- **Impacto web pública:** **Impacto potencial, requiere aprobación específica**.

### 6.16 SEO (función interna)

- **Función actual:** analítica, Search Console, indexación y sitemap; consultar métricas y controles SEO.
- **Problema detectado:** acciones externas concretas `PENDIENTES DE VALIDAR`; riesgo si se ejecutan sin control.
- **Mejora propuesta:** segregación bajo rol **Responsable SEO**, con acciones sensibles (indexación, envío a buscadores) sujetas a aprobación y auditoría.
- **Relación con SGIE:** ninguna.
- **Prioridad:** P2.
- **Beneficio esperado:** SEO controlado y trazable.
- **Impacto web pública:** **Impacto potencial, requiere aprobación específica**.

### 6.17 Herramientas jurídicas (Calculadora, Mis casos)

- **Función actual:** cálculo técnico de penas y reglas; casos guardados y cálculos asociados. Persistencia `PENDIENTE DE VALIDAR`.
- **Problema detectado:** persistencia y audiencia no claras; relación con casos SGIE no evidente.
- **Mejora propuesta:** aclarar si los “casos” se vinculan a expedientes SGIE; documentar las reglas jurídicas y su versión.
- **Relación con SGIE:** potencial vínculo con expedientes.
- **Prioridad:** P2.
- **Beneficio esperado:** herramientas jurídicas coherentes con la operación.
- **Impacto web pública:** sin impacto.

### 6.18 Biblioteca Código Penal

- **Función actual:** artículos del Código Penal; buscar, consultar listado y detalle.
- **Problema detectado:** ninguno crítico; `PENDIENTE DE VALIDAR`.
- **Mejora propuesta:** enlazar artículos con delitos y con expedientes que los invoquen.
- **Relación con SGIE:** referencia en expedientes.
- **Prioridad:** P3.
- **Beneficio esperado:** navegación jurídica cruzada.
- **Impacto web pública:** sin impacto.

### 6.19 Catálogo de delitos

- **Función actual:** delitos, artículos y datos penales; buscar, filtrar, consultar y editar; alta mediante formulario.
- **Problema detectado:** permisos de edición no validados.
- **Mejora propuesta:** restringir edición a rol autorizado y auditar cambios; los datos canónicos son fuente de verdad del sistema (no se inventan).
- **Relación con SGIE:** referencia en expedientes.
- **Prioridad:** P2.
- **Beneficio esperado:** corpus jurídico confiable.
- **Impacto web pública:** sin impacto (la fuente canónica `data/delitos.json` también alimenta la web pública, pero este plan no propone alterarla).

---

## 7. Plan de integración SGIE + Admin

La integración se entiende como **datos compartidos, permisos comunes, automatizaciones y trazas**, no como fusión visual.

| Módulo SGIE | Módulo Admin relacionado | Datos compartidos | Permisos necesarios | Automatización posible | Beneficio de la integración | Impacto web pública |
|---|---|---|---|---|---|---|
| Expedientes | Usuarios, Roles, Reglas, Métricas, Auditoría | número, estado, responsable, transiciones | abogado/responsable + supervisor | tareas y alertas por cambio de estado | flujos predecibles y supervisables | sin impacto |
| Documentos | Retención, IA, Permisos, Auditoría | documento, estado, revisor, vigencia | abogado + administrador SGIE | clasificación IA sugerida, alertas de faltantes | revisión trazable | sin impacto |
| Correos | Plantillas | plantilla, variables, destinatario, estado | abogado + editor plantillas | envío automático por evento | comunicaciones consistentes | sin impacto |
| Tareas | Roles, Usuarios, Alertas, Métricas | tarea, origen, responsable, fechas | por rol | generación desde reglas | trabajo predecible | sin impacto |
| Alertas | Reglas | tipo, origen, severidad, resolución | administrador SGIE | generación configurable | alertas accionables | sin impacto |
| Reportes | Métricas globales | parámetros, agregaciones, destinatario | supervisor + dirección | reportes programados | supervisión reproducible | sin impacto |
| Clientes | Permisos, Historial, Auditoría | identidad, estado, vínculos | abogado + administrador SGIE | alertas de datos incompletos | datos limpios | sin impacto |
| Inteligencia expediente | Reglas IA, Auditoría | resumen, confianza, fuentes | abogado + supervisor IA | resumen periódico sugerido | IA trazable | sin impacto |
| Enlaces de carga | Retención, Permisos, Auditoría | enlace, vigencia, usos, expediente | abogado + administrador SGIE | caducidad y notificación | captura segura | sin impacto |

### 7.1 Ejemplos obligatorios (narrativa)

- **Expedientes SGIE ↔ Admin:** cada transición de estado queda sujeta a permisos por rol, dispara reglas de negocio versionadas en Admin, alimenta métricas globales y queda en auditoría con autor, fecha y motivo.
- **Documentos SGIE ↔ Admin:** la revisión usa reglas de retención (no operativas hasta validación legal), IA de clasificación (sugerida, no ejecutiva), permisos por expediente y trazabilidad completa.
- **Correos SGIE ↔ Admin:** todo envío usa plantillas activas gestionadas en Admin, con variables validadas y registro de fallos y reintentos.
- **Tareas SGIE ↔ Admin:** las tareas pueden originarse manualmente o desde reglas Admin; respetan roles y usuarios y generan alertas y métricas.
- **Alertas SGIE ↔ Admin:** las alertas se generan según reglas configurables en Admin, con tipo, severidad y acción recomendada.
- **Reportes SGIE ↔ Admin:** los reportes usan las mismas agregaciones que las métricas globales de Admin, garantizando coherencia de cifras.
- **Clientes SGIE ↔ Admin:** el cliente es entidad única con permisos, historial y auditoría compartidos; no se duplica entre superficies.

---

## 8. Modelo de roles y permisos

Matriz propuesta. Debe **validarse** contra el comportamiento real antes de implementarse. Cada rol define visión y acción en SGIE y Admin, prohibiciones, acciones que requieren auditoría y acciones sensibles para la web pública.

### 8.1 Administrador general

- **SGIE ver:** todo.
- **SGIE hacer:** supervisión global; no intervención operativa rutinaria.
- **Admin ver:** todo.
- **Admin hacer:** usuarios, roles, configuración global, auditoría.
- **Prohibido:** elminar datos sin doble confirmación y motivo.
- **Requiere auditoría:** cambios de permisos, configuración global y retención.
- **Web pública:** puede aprobar publicaciones; requiere aprobación específica para cambios visibles.

### 8.2 Administrador SGIE

- **SGIE ver:** todo.
- **SGIE hacer:** configurar métricas, plantillas, reglas; supervisar cuellos de botella.
- **Admin ver:** configuración SGIE, métricas, plantillas, reglas, retención.
- **Admin hacer:** gestionar configuración SGIE y reglas.
- **Prohibido:** editar contenido público y usuarios generales (salvo delegación).
- **Requiere auditoría:** cambios de reglas y plantillas.
- **Web pública:** sin impacto.

### 8.3 Abogado

- **SGIE ver:** sus clientes, expedientes, documentos, tareas, agenda, correos.
- **SGIE hacer:** crear/editar expedientes y tareas, procesar documentos, enviar correos con plantilla.
- **Admin ver:** herramientas jurídicas, biblioteca CP, catálogo de delitos (consulta).
- **Admin hacer:** usar calculadora y casos.
- **Prohibido:** configurar reglas, usuarios y contenido público.
- **Requiere auditoría:** aprobar/rechazar pasos y documentos.
- **Web pública:** sin impacto.

### 8.4 Asistente legal

- **SGIE ver:** expedientes asignados, tareas, agenda, documentos, clientes.
- **SGIE hacer:** crear tareas, recibir documentos, gestionar agenda, comentarios.
- **Admin ver:** herramientas jurídicas (consulta).
- **Admin hacer:** usar calculadora.
- **Prohibido:** aprobar/rechazar pasos críticos, configurar reglas.
- **Requiere auditoría:** recepción documental y enlaces de carga.
- **Web pública:** sin impacto.

### 8.5 Supervisor

- **SGIE ver:** todos los expedientes y métricas.
- **SGIE hacer:** reasignar, resolver alertas, generar reportes.
- **Admin ver:** métricas SGIE y auditoría.
- **Admin hacer:** consultar y exportar métricas.
- **Prohibido:** cambiar configuración global.
- **Requiere auditoría:** reasignaciones y resoluciones de alertas.
- **Web pública:** sin impacto.

### 8.6 Editor de contenido

- **SGIE ver:** sin acceso (salvo lectura de expedientes si se autoriza).
- **SGIE hacer:** nada.
- **Admin ver:** Blog, FAQ, Páginas, Menús, Biblioteca de medios, Áreas jurídicas.
- **Admin hacer:** redactar y editar borradores; no publicar sin aprobación.
- **Prohibido:** publicar, editar SEO y modificar configuración técnica.
- **Requiere auditoría:** edición de páginas y menús.
- **Web pública:** **Impacto potencial, requiere aprobación específica**; la publicación siempre requiere aprobador.

### 8.7 Responsable SEO

- **SGIE ver:** sin acceso.
- **SGIE hacer:** nada.
- **Admin ver:** SEO, biblioteca de medios, páginas (metadatos).
- **Admin hacer:** consultar métricas SEO, proponer cambios de indexación.
- **Prohibido:** publicar contenido sin flujo editorial; modificar diseño público.
- **Requiere auditoría:** envíos a buscadores y cambios de sitemap/indexación.
- **Web pública:** **Impacto potencial, requiere aprobación específica**.

### 8.8 Usuario solo lectura

- **SGIE ver:** lo autorizado por rol superior.
- **SGIE hacer:** nada.
- **Admin ver:** lo autorizado (consulta).
- **Admin hacer:** nada.
- **Prohibido:** toda acción de escritura.
- **Requiere auditoría:** no aplica.
- **Web pública:** sin impacto.

---

## 9. Nuevo modelo de navegación

Propuesta de navegación. **No propone cambios en la navegación de la web pública.**

### 9.1 SGIE (navegación propuesta)

- Inicio operativo (cockpit)
- Clientes
- Expedientes
- Documentos
- Tareas
- Agenda
- Comunicaciones (Correos)
- Alertas
- Reportes

### 9.2 Admin (navegación propuesta)

- Panel de control
- Usuarios y permisos
- Configuración SGIE (métricas, plantillas, reglas, retención)
- Plantillas
- Reglas
- Auditoría
- Métricas
- Contenido web (Blog, FAQ, Páginas, Menús, Biblioteca de medios, Áreas jurídicas)
- SEO
- Herramientas jurídicas (Calculadora, Mis casos, Biblioteca CP, Catálogo delitos, Agravantes)
- Configuración general (Perfil, Sitio)

### 9.3 Decisión por rutas

- **Subir al menú:** Reportes y Productividad (SGIE, si este último se valida vigente); Configuración SGIE, Métricas SGIE, Plantillas, Reglas, Agravantes (Admin).
- **Ocultar (o retirar si están obsoletas):** rutas huérfanas tras validación (p. ej., Productividad si no está vigente).
- **Fusionar:** “Usuarios” y “Usuarios y accesos SGIE” en una sola superficie, o documentar la frontera si se mantienen.
- **Pasar a segundo nivel:** retención documental (dentro de Configuración SGIE, marcada no operativa), Agravantes (dentro de Catálogo de delitos o Herramientas jurídicas).
- **Sensibles para web pública (aisladas/marcadas):** Blog, FAQ, Páginas, Menús, Biblioteca de medios, Áreas jurídicas, SEO y Sitio. Deben mostrar advertencia de impacto potencial y requerir rol/permiso especial.

---

## 10. Flujos rediseñados

Para cada flujo: actor principal, módulos implicados, pasos recomendados, relación SGIE/Admin, automatizaciones, permisos, riesgos, mejora esperada e impacto sobre la web pública.

### 10.1 Alta de cliente

- **Actor:** abogado/asistente.
- **Módulos:** Clientes (SGIE), Permisos/Historial (Admin).
- **Pasos:** crear ficha → validar unicidad RTN → asignar responsable → registrar en auditoría.
- **SGIE/Admin:** escritura en SGIE, trazabilidad en Admin.
- **Automatizaciones:** alerta de datos incompletos.
- **Permisos:** abogado/asistente.
- **Riesgos:** duplicación de identidad.
- **Mejora esperada:** clientes únicos y trazables.
- **Web pública:** sin impacto.

### 10.2 Creación de expediente

- **Actor:** abogado.
- **Módulos:** Expedientes, Clientes, Reglas.
- **Pasos:** seleccionar cliente → definir procedimiento → estado inicial → responsable → checklist documental por tipo.
- **SGIE/Admin:** reglas definidas en Admin disparan tareas iniciales.
- **Automatizaciones:** tareas y alertas iniciales.
- **Permisos:** abogado.
- **Riesgos:** estados ambiguos.
- **Mejora esperada:** apertura estandarizada.
- **Web pública:** sin impacto.

### 10.3 Asignación de abogado

- **Actor:** supervisor/administrador SGIE.
- **Módulos:** Expedientes, Usuarios, Auditoría.
- **Pasos:** elegir expediente → seleccionar abogado → registrar motivo → notificar.
- **Automatizaciones:** notificación al abogado y actualización de carga.
- **Permisos:** supervisor/administrador SGIE.
- **Riesgos:** sobrecarga de un abogado.
- **Mejora esperada:** reparto equilibrado.
- **Web pública:** sin impacto.

### 10.4 Solicitud documental

- **Actor:** abogado/asistente.
- **Módulos:** Enlaces de carga, Documentos, Expedientes.
- **Pasos:** generar enlace con vigencia/usos → enviar al cliente → notificar recepción → clasificar.
- **Automatizaciones:** caducidad y notificación.
- **Permisos:** abogado/asistente.
- **Riesgos:** vigencia o seguridad del enlace.
- **Mejora esperada:** captura segura.
- **Web pública:** sin impacto.

### 10.5 Recepción documental

- **Actor:** asistente.
- **Módulos:** Documentos, Enlaces de carga, Auditoría.
- **Pasos:** recibir → registrar origen → estado “pendiente de revisión” → notificar al abogado.
- **Automatizaciones:** clasificación inicial sugerida por IA.
- **Permisos:** asistente.
- **Riesgos:** clasificación errónea.
- **Mejora esperada:** entrada trazable.
- **Web pública:** sin impacto.

### 10.6 Revisión documental

- **Actor:** abogado.
- **Módulos:** Documentos, Auditoría.
- **Pasos:** abrir detalle → aprobar/rechazar con motivo → actualizar checklist → registrar revisor.
- **Automatizaciones:** alerta de faltantes.
- **Permisos:** abogado.
- **Riesgos:** rechazos sin motivo.
- **Mejora esperada:** revisión auditable.
- **Web pública:** sin impacto.

### 10.7 Generación automática de tareas

- **Actor:** sistema (reglas).
- **Módulos:** Reglas, Tareas, Alertas.
- **Pasos:** evento del expediente → regla → tarea con origen → responsable → notificación.
- **Automatizaciones:** creación y escalado.
- **Permisos:** administrador SGIE gestiona reglas.
- **Riesgos:** reglas mal configuradas.
- **Mejora esperada:** trabajo predecible.
- **Web pública:** sin impacto.

### 10.8 Envío de correos con plantilla

- **Actor:** abogado/sistema.
- **Módulos:** Correos, Plantillas.
- **Pasos:** evento/manual → selección de plantilla → validación de variables → envío → registro de estado.
- **Automatizaciones:** reintentos y notificación de fallo.
- **Permisos:** abogado + editor de plantillas.
- **Riesgos:** variables inválidas.
- **Mejora esperada:** comunicaciones consistentes.
- **Web pública:** sin impacto.

### 10.9 Gestión de alertas

- **Actor:** abogado/supervisor.
- **Módulos:** Alertas, Reglas.
- **Pasos:** recibir → revisar contexto → resolver con acción/motivo → registrar.
- **Automatizaciones:** escalado por inactividad.
- **Permisos:** según severidad.
- **Riesgos:** alertas ignoradas.
- **Mejora esperada:** alertas accionables.
- **Web pública:** sin impacto.

### 10.10 Agenda y reprogramaciones

- **Actor:** asistente/abogado.
- **Módulos:** Agenda, Expedientes, Plantillas.
- **Pasos:** crear evento vinculado → confirmar → reprogramar con motivo si procede → notificar.
- **Automatizaciones:** recordatorios previos.
- **Permisos:** asistente/abogado.
- **Riesgos:** solapamientos.
- **Mejora esperada:** agenda fiable.
- **Web pública:** sin impacto.

### 10.11 Cierre de expediente

- **Actor:** abogado/supervisor.
- **Módulos:** Expedientes, Documentos, Reportes, Auditoría.
- **Pasos:** verificar checklist → cierre con estado final → archivar documentos → generar reporte.
- **Automatizaciones:** reporte de cierre.
- **Permisos:** abogado + supervisor.
- **Riesgos:** cierre con faltantes.
- **Mejora esperada:** cierre controlado.
- **Web pública:** sin impacto.

### 10.12 Auditoría de acciones críticas

- **Actor:** sistema + administrador general.
- **Módulos:** Auditoría.
- **Pasos:** acción crítica → registro (autor, fecha, motivo) → consulta/exportación.
- **Automatizaciones:** alertas de acciones inusuales.
- **Permisos:** administrador general/auditoría.
- **Riesgos:** omisión de registros.
- **Mejora esperada:** trazabilidad legal.
- **Web pública:** sin impacto.
- **Acciones críticas a auditar (catálogo propuesto):** aprobar/rechazar pasos y documentos, cambios de estado de expediente, bloqueo/desbloqueo de usuarios, cambios de permisos, cambios de reglas y plantillas, publicación/eliminación de contenido público, envíos a buscadores, generación y eliminación de enlaces de carga, reprogramaciones de agenda, cierre de expediente.

### 10.13 Administración de usuarios

- **Actor:** administrador general.
- **Módulos:** Usuarios y permisos, Auditoría.
- **Pasos:** crear/editar → asignar rol → estado → credenciales → registro.
- **Automatizaciones:** último acceso y expiración de sesión.
- **Permisos:** administrador general.
- **Riesgos:** privilegios excesivos.
- **Mejora esperada:** identidad gobernada.
- **Web pública:** sin impacto.

### 10.14 Configuración de reglas

- **Actor:** administrador SGIE.
- **Módulos:** Reglas, Auditoría.
- **Pasos:** definir → validar en seco → versionar → activar → auditar.
- **Automatizaciones:** validación previa.
- **Permisos:** administrador SGIE.
- **Riesgos:** reglas con efectos no previstos.
- **Mejora esperada:** automatizaciones reversibles.
- **Web pública:** sin impacto.

### 10.15 Publicación de contenido web

- **Actor:** editor de contenido + aprobador.
- **Módulos:** Blog/FAQ/Páginas/Menús, Auditoría.
- **Pasos:** redactar borrador → revisión → aprobación → programar/publicar → registro. **No se proponen cambios en la web pública**; el flujo describe únicamente el gobierno interno de permisos, revisión, estados, aprobación y auditoría antes de cualquier publicación.
- **Automatizaciones:** validación de campos y enlaces internos.
- **Permisos:** editor (borrador) + aprobador (publicación).
- **Riesgos:** publicación sin revisión.
- **Mejora esperada:** publicación controlada.
- **Web pública:** **Impacto potencial, requiere aprobación específica**; el plan no ejecuta la publicación, solo define el gobierno interno.

### 10.16 Revisión de métricas

- **Actor:** supervisor/dirección.
- **Módulos:** Métricas, Reportes.
- **Pasos:** seleccionar dominio → filtrar → analizar → decidir → registrar acciones derivadas.
- **Automatizaciones:** paneles en tiempo real.
- **Permisos:** supervisor/dirección.
- **Riesgos:** métricas inconsistentes.
- **Mejora esperada:** decisiones con datos.
- **Web pública:** sin impacto.

### 10.17 Flujo ideal semi-autónomo (modelo Nivel 3)

Este es el flujo estratégico de referencia del plan: describe cómo SGIE prepara un expediente completo **antes** de escalarlo al abogado. Combina y orquesta los flujos anteriores (10.1–10.11) en un recorrido continuo.

- **Actor principal:** SGIE (sistema), con intervención puntual del cliente y revisión final del abogado.
- **Módulos implicados:** Clientes, Expedientes, Documentos, Enlaces de carga, Correos/Plantillas, Tareas, Alertas, Inteligencia del expediente, Reglas, Auditoría.
- **Pasos recomendados:**
  1. **alta de cliente** (datos básicos, identidad/RTN, responsable);
  2. **apertura de expediente** (procedimiento, estado inicial, tipo);
  3. SGIE **genera el checklist documental** según el tipo de expediente (reglas definidas en Admin);
  4. SGIE **solicita la documentación** al cliente mediante enlace de carga y plantilla;
  5. el cliente **sube la documentación**;
  6. SGIE **clasifica y valida preliminarmente** (reglas + IA con confianza);
  7. SGIE **detecta faltantes** contra el checklist;
  8. SGIE **envía recordatorios** escalonados por faltantes;
  9. SGIE **crea tareas internas** para el equipo operativo cuando hace falta acción humana no jurídica;
  10. SGIE **prepara el resumen** del expediente (confianza y fuentes);
  11. cuando se cumple la definición de “expediente completo” (sección 2.2), SGIE **marca el expediente como “Listo para revisión”**;
  12. el **abogado revisa** el resumen ejecutivo, el checklist, los documentos dudosos y la recomendación;
  13. el abogado **aprueba, firma o devuelve** con observaciones;
  14. SGIE **continúa el flujo** según la decisión (cierre, siguiente fase, reintento documental, etc.).
- **Relación SGIE/Admin:** Admin define los checklists, las reglas de validación, las plantillas, los estados y los permisos que hacen posible la autonomía.
- **Automatizaciones:** generación de checklist, solicitud y recordatorios, clasificación preliminar, detección de faltantes, generación de resumen, marca “Listo para revisión” y continuación del flujo tras decisión del abogado.
- **Permisos:** el abogado solo interviene en los pasos 12 y 13; todo lo anterior es operativo o del cliente.
- **Riesgos:** checklist o reglas mal configuradas, IA con confianza sobreestimada, cliente que no responde.
- **Mejora esperada:** el abogado recibe exclusivamente expedientes completos y decide en pocos pasos; la carga operativa manual desaparece del rol jurídico.
- **Web pública:** sin impacto.

### 10.18 Excepciones que sí deben escalar al abogado

SGIE debe escalar al abogado (sacar el expediente del flujo automático y llevarlo a la bandeja de decisiones) en estos casos:

- **documento dudoso** o no prevalidable por reglas/IA;
- **contradicción entre documentos** detectada;
- **falta crítica** de documentación necesaria;
- **plazo vencido** o próximo a vencer;
- **cliente que no responde** tras los recordatorios definidos;
- **baja confianza de la IA** (por debajo del umbral configurado en Admin);
- **acción jurídica sensible** (p. ej., cambio de estrategia, acto procesal relevante);
- **cierre de expediente**;
- **firma o aprobación final**.

En todos estos casos, SGIE **no decide**: prepara el contexto, explica la excepción y entrega la decisión al abogado. La enumeración de excepciones es en sí misma una regla de negocio gobernable desde Admin.

---

## 11. Automatizaciones recomendadas

Clasificadas en A (SGIE), B (Admin) y C (entre SGIE y Admin). Para cada una: impacto, complejidad, dependencia, prioridad e impacto sobre web pública. **Ninguna publica, modifica o altera automáticamente la web pública.**

### 11.1 Automatizaciones internas de SGIE (A)

| Automatización | Impacto | Complejidad | Dependencia | Prioridad | Web pública |
|---|---|---|---|---|---|
| Creación automática de tareas por cambio de estado | alto | media | reglas versionadas | P0 | sin impacto |
| Alertas por vencimiento | alto | baja | fechas y reglas | P0 | sin impacto |
| Recordatorios documentales | medio | baja | checklist por tipo | P1 | sin impacto |
| Detección de expedientes bloqueados | alto | media | métricas de actividad | P1 | sin impacto |
| Resumen periódico de expediente (IA, sugerido) | medio | alta | IA con confianza y fuentes | P2 | sin impacto |

### 11.2 Automatizaciones internas de Admin (B)

| Automatización | Impacto | Complejidad | Dependencia | Prioridad | Web pública |
|---|---|---|---|---|---|
| Auditoría automática de acciones críticas | alto | media | catálogo de acciones | P0 | sin impacto |
| Métricas en tiempo real | medio | media | fuente única de métricas | P1 | sin impacto |
| Validación en seco de reglas | medio | media | motor de reglas | P1 | sin impacto |
| Detección de cuellos de botella | medio | media | métricas SGIE | P2 | sin impacto |
| Sugerencias de mejora de plantillas (IA) | bajo | alta | IA con trazabilidad | P3 | sin impacto |

### 11.3 Automatizaciones entre SGIE y Admin (C)

| Automatización | Impacto | Complejidad | Dependencia | Prioridad | Web pública |
|---|---|---|---|---|---|
| Correos automáticos mediante plantillas | alto | media | plantillas activas | P0 | sin impacto |
| Notificaciones por rol | medio | media | matriz de roles | P1 | sin impacto |
| Revisión documental con IA (sugerida) | medio | alta | IA + permisos | P2 | sin impacto |
| Reportes programados | medio | media | métricas compartidas | P2 | sin impacto |
| Reasignación automática por carga | medio | alta | métricas por abogado | P3 | sin impacto |

---

## 12. IA interna

Propuesta de uso de IA con límites estrictos. La IA **no publica ni modifica contenido visible en la web pública** y **no ejecuta acciones críticas sin validación humana**.

### 12.1 IA en SGIE

La IA en SGIE está **al servicio de la autonomía**: prepara el expediente para que el abogado solo revise y decida. Sus funciones son de **preparación, sugerencia y alerta**, nunca de decisión jurídica.

- **Resumen de expedientes:** generar borrador con confianza y fuentes; revisión humana obligatoria.
- **Extracción de datos de documentos:** sugerir campos estructurados; confirmación del revisor.
- **Detección de documentos faltantes:** comparar checklist vs. recibidos.
- **Detección de contradicciones:** señalar inconsistencias entre documentos.
- **Sugerencia de próximas acciones:** recomendaciones no ejecutivas.
- **Clasificación documental:** etiquetado sugerido, no vinculante.
- **Generación de borradores de comunicación:** usando plantillas activas, pendiente de revisión.
- **Alertas inteligentes:** priorización de alertas por contexto y confianza.

### 12.2 IA en Admin

- **Análisis de métricas:** detección de patrones y cuellos de botella.
- **Sugerencias de mejora de plantillas:** propuestas internas.
- **Revisión de actividad:** identificación de acciones inusuales en auditoría.
- **Apoyo interno para contenido/SEO:** **solo borradores internos**; cualquier sugerencia sobre contenido público o SEO queda como borrador pendiente de revisión humana.
- **Búsqueda jurídica asistida:** sobre corpus jurídico con fuentes citadas.

### 12.3 Límites

**Reglas funcionales:**

- No ejecuta acciones críticas sin validación humana.
- Respeta la matriz de permisos.
- Deja trazabilidad (autor, modelo, confianza, fuentes, fecha).
- Marca confianza y fuentes en cada salida.
- No publica ni modifica contenido visible en la web pública.
- Las sugerencias sobre contenido público o SEO son siempre borradores internos.

**Prohibiciones absolutas de la IA (la IA solo prepara, sugiere y alerta):**

- **la IA no firma**;
- **la IA no aprueba jurídicamente**;
- **la IA no cierra expedientes**;
- **la IA no sustituye al abogado**.

Estas prohibiciones son de diseño del sistema: ninguna automatización de Nivel 2 o 3 puede ejecutar estas acciones, y el Nivel 4 (futuro) tampoco las ejecutará sin validación humana explícita.

---

## 13. Modelo de dashboards

Dashboards separados por perfil. Cada uno con objetivo, métricas principales, acciones rápidas, alertas visibles, relación con SGIE/Admin y confirmación de impacto sobre la web pública.

### 13.1 Dashboard abogado

- **Objetivo:** que el abogado **sepa exactamente qué revisar ahora**, no ver un cuadro de mando genérico. El eje del dashboard es la **bandeja de “siguiente expediente”**, no un agregado de métricas.
- **Métricas principales (orientadas a acción, no a volumen):**
  - expedientes **listos para revisión** (cola prioritaria);
  - expedientes **bloqueados que requieren decisión** (excepciones de la sección 10.18);
  - documentos **dudosos** pendientes de validación;
  - **firmas pendientes**;
  - **tareas críticas reales** (no ruido operativo);
  - **vencimientos próximos**.
- **Acciones rápidas:** abrir el siguiente expediente listo, aprobar/devolver/firmar/pedir información, y resolver una excepción.
- **Alertas:** solo las que requieren decisión jurídica (excepciones), no todos los eventos del sistema.
- **Principio de diseño:** evitar un dashboard lleno de métricas agregadas que no conducen a una acción inmediata. El abogado debe poder entrar, ver el siguiente expediente revisable, decidir y avanzar.
- **SGIE:** principal consumidor de la bandeja de revisión.
- **Admin:** ninguno.
- **Web pública:** sin impacto.

### 13.2 Dashboard asistente legal

- **Objetivo:** gestionar entradas y agenda.
- **Métricas:** documentos por clasificar, enlaces activos, eventos del día.
- **Acciones rápidas:** recibir documentos, agendar, generar enlaces.
- **Alertas:** recepciones y recordatorios.
- **SGIE:** documentos, agenda, enlaces.
- **Admin:** ninguno.
- **Web pública:** sin impacto.

### 13.3 Dashboard supervisor

- **Objetivo:** equilibrar carga y desbloquear.
- **Métricas:** carga por abogado, expedientes bloqueados, alertas sin resolver.
- **Acciones rápidas:** reasignar, resolver alertas, generar reportes.
- **Alertas:** cuellos de botella.
- **SGIE:** supervisión global.
- **Admin:** métricas y auditoría.
- **Web pública:** sin impacto.

### 13.4 Dashboard administrador SGIE

- **Objetivo:** gobernar la operación.
- **Métricas:** cumplimiento de reglas, uso de plantillas, volumen por estado.
- **Acciones rápidas:** editar reglas/plantillas, ver métricas.
- **Alertas:** reglas con errores o baja adopción.
- **SGIE:** configuración.
- **Admin:** configuración SGIE.
- **Web pública:** sin impacto.

### 13.5 Dashboard administrador general

- **Objetivo:** gobierno del sistema.
- **Métricas:** usuarios activos, cambios de permisos, acciones críticas auditadas.
- **Acciones rápidas:** gestionar usuarios, revisar auditoría.
- **Alertas:** acciones inusuales.
- **SGIE:** consulta global.
- **Admin:** todo.
- **Web pública:** sin impacto (salvo aprobación de publicaciones, marcada como sensible).

### 13.6 Dashboard contenido/SEO

- **Objetivo:** gobierno editorial interno.
- **Métricas:** borradores en revisión, publicaciones programadas, métricas SEO.
- **Acciones rápidas:** revisar borradores, proponer cambios SEO.
- **Alertas:** contenido sin aprobar, problemas de indexación.
- **SGIE:** ninguno.
- **Admin:** contenido y SEO.
- **Web pública:** **Impacto potencial, requiere aprobación específica** (la publicación siempre requiere aprobador).

### 13.7 Dashboard dirección

- **Objetivo:** visión global.
- **Métricas:** agregados de operación, contenido y técnico.
- **Acciones rápidas:** consultar reportes y auditoría.
- **Alertas:** indicadores críticos.
- **SGIE:** agregados.
- **Admin:** agregados.
- **Web pública:** sin impacto.

---

## 14. Priorización

### 14.1 Métricas de autonomía (KPIs del nuevo modelo)

Estos KPIs miden el éxito del SGIE semi-autónomo. Deben estar disponibles en Admin (métricas SGIE) y son la base para decidir el paso de un nivel de autonomía a otro (sección 2.3).

| KPI | Qué mide | Mejor cuanto |
|---|---|---|
| % de expedientes preparados sin intervención manual | cuántos llegan a “Listo para revisión” sin trabajo humano no jurídico | más alto |
| Tiempo medio desde alta hasta expediente completo | cuánto tarda SGIE en preparar el expediente | más bajo |
| Documentos faltantes por expediente | calidad de la captura documental | más bajo |
| Recordatorios automáticos enviados | volumen de comunicación documental automatizada con el cliente | indicador de actividad |
| Expedientes bloqueados | cola de excepciones que requieren decisión | más bajo |
| Expedientes listos para revisión | throughput del flujo de revisión | indicador de actividad |
| Tiempo medio de revisión del abogado | eficiencia de la revisión gracias al expediente preparado | más bajo |
| % de expedientes devueltos por documentación incompleta | calidad de la preparación previa | más bajo |
| Ahorro estimado de tareas manuales | horas de trabajo operativo liberadas del rol jurídico | más alto |

Estos KPIs son `PENDIENTE DE VALIDAR` en su capacidad de cálculo real hasta que se confirme la persistencia y los orígenes de datos en sesión autenticada.

### 14.2 Matriz de priorización P0–P3

| ID | Área | Módulo | Mejora | Prioridad | Impacto | Esfuerzo | Dependencia | Riesgo si no se hace | Web pública |
|---|---|---|---|---|---|---|---|---|---|
| P0-1 | SGIE | Cockpit | señales canónicas por rol | P0 | alto | medio | matriz de roles | sobrecarga cognitiva | sin impacto |
| P0-2 | SGIE | Expedientes | catálogo de estados canónico | P0 | alto | medio | validación de estados | ambigüedad operativa | sin impacto |
| P0-3 | SGIE | Documentos | estados y checklist estandarizados | P0 | alto | medio | tipos de expediente | documentos perdidos | sin impacto |
| P0-4 | Admin | Usuarios | unificación de superficies | P0 | alto | alto | matriz de roles | identidad duplicada | sin impacto |
| P0-5 | Admin | Roles/Permisos | matriz canónica | P0 | alto | alto | entrevistas | permisos incontrolados | sin impacto |
| P0-6 | Admin | Auditoría | catálogo de acciones críticas | P0 | alto | medio | definición legal/operativa | sin trazabilidad | sin impacto |
| P1-1 | SGIE | Clientes | unicidad RTN e historial | P1 | medio | medio | usuarios unificados | duplicación | sin impacto |
| P1-2 | SGIE | Tareas | origen manual vs. automático | P1 | medio | bajo | reglas | trabajo manual | sin impacto |
| P1-3 | SGIE | Alertas | tipificación y escalado | P1 | medio | medio | reglas | alertas ignoradas | sin impacto |
| P1-4 | SGIE | Correos | integración con plantillas | P1 | medio | medio | plantillas Admin | comunicaciones perdidas | sin impacto |
| P1-5 | SGIE | Enlaces de carga | vinculación y caducidad | P1 | medio | bajo | documentos | captura insegura | sin impacto |
| P1-6 | Admin | Dashboard | segmentación por dominio | P1 | medio | medio | roles | carga cognitiva | sin impacto |
| P1-7 | Admin | Configuración SGIE | agrupar y hacer visible | P1 | medio | bajo | permisos | rutas ocultas | sin impacto |
| P1-8 | Admin | Métricas SGIE | fuente única con cockpit | P1 | medio | medio | métricas comunes | cifras inconsistentes | sin impacto |
| P1-9 | Admin | Plantillas | visibilidad y versionado | P1 | medio | bajo | Correos SGIE | inconsistencia | sin impacto |
| P1-10 | Admin | Reglas | gobierno y versionado | P1 | medio | medio | automatizaciones | efectos no previstos | sin impacto |
| P1-11 | Admin | Páginas | flujo editorial y versionado | P1 | alto | medio | roles editoriales | cambios no controlados | **Impacto potencial, requiere aprobación específica** |
| P1-12 | Admin | Menús | restricción y aprobación | P1 | alto | bajo | roles editoriales | navegación pública rota | **Impacto potencial, requiere aprobación específica** |
| P1-13 | Integración | SGIE/Admin | datos compartidos y permisos comunes | P1 | alto | alto | matriz de roles y métricas | silos | sin impacto |
| P2-1 | SGIE | Agenda | vínculo con expedientes/tareas | P2 | medio | medio | expedientes | citas perdidas | sin impacto |
| P2-2 | SGIE | Reportes | catálogo por perfil | P2 | medio | medio | métricas | reportes manuales | sin impacto |
| P2-3 | SGIE | Inteligencia expediente | confianza y fuentes | P2 | medio | alto | IA trazable | IA opaca | sin impacto |
| P2-4 | SGIE | Productividad | validar vigencia | P2 | bajo | bajo | validación | ruta huérfana | sin impacto |
| P2-5 | Admin | Retención | mantener no operativa | P2 | alto | bajo | aprobación legal | destrucción no autorizada | sin impacto |
| P2-6 | Admin | Blog/FAQ | flujo editorial | P2 | medio | medio | roles editoriales | publicación sin control | **Impacto potencial, requiere aprobación específica** |
| P2-7 | Admin | Biblioteca medios | carga y metadatos | P2 | medio | medio | roles editoriales | desorden | **Impacto potencial, requiere aprobación específica** |
| P2-8 | Admin | SEO | segregación por rol | P2 | medio | medio | roles | indexación incontrolada | **Impacto potencial, requiere aprobación específica** |
| P2-9 | Admin | Catálogo delitos | permisos de edición | P2 | medio | bajo | auditoría | corrupción de corpus | sin impacto |
| P3-1 | Admin | Biblioteca CP | enlaces cruzados | P3 | bajo | bajo | delitos | navegación pobre | sin impacto |
| P3-2 | Integración | Herramientas jurídicas | vincular casos a expedientes | P3 | medio | alto | expedientes | silo jurídico | sin impacto |
| P3-3 | Admin | IA | sugerencias de plantillas | P3 | bajo | alto | IA trazable | mejora lenta | sin impacto |
| P3-4 | Integración | Reportes | programados y compartidos | P3 | medio | media | métricas | supervisión manual | sin impacto |

---

## 15. Roadmap por fases

Para cada fase: objetivo, entregables, módulos afectados, criterios de aceptación y confirmación de que **no modifica la web pública**.

### 15.1 Fase 1 — Validación autenticada y entrevistas

- **Objetivo:** convertir lo `NO VALIDADO` en `VALIDADO` y obtener la matriz real de uso.
- **Entregables:** informe de validación autenticada, entrevistas por perfil, matriz de permisos real, decisión sobre rutas huérfanas (Productividad, Agravantes, retención).
- **Módulos:** todos (observación).
- **Criterios:** sesión autenticada controlada, flujos críticos observados con datos representativos, permisos verificados.
- **Web pública:** no se modifica.

### 15.2 Fase 2 — Arquitectura funcional SGIE

- **Objetivo:** definir estados, señales, checklists y orígenes de tareas.
- **Entregables:** catálogo de estados de expediente, señales por rol, checklist por tipo, modelo de tareas automáticas.
- **Módulos:** Cockpit, Expedientes, Documentos, Tareas, Alertas.
- **Criterios:** aprobación de la arquitectura funcional antes de implementar.
- **Web pública:** no se modifica.

### 15.3 Fase 3 — Arquitectura funcional Admin

- **Objetivo:** segregar dominios y roles.
- **Entregables:** mapa de dominios, unificación de usuarios, gobierno editorial interno, configuración SGIE agrupada.
- **Módulos:** Dashboard, Usuarios, Roles, Configuración SGIE, Contenido, SEO.
- **Criterios:** matriz de roles aprobada, frontera de usuarios documentada.
- **Web pública:** no se modifica (el gobierno editorial es interno; cualquier publicación queda fuera de esta fase).

### 15.4 Fase 4 — Modelo de integración SGIE/Admin

- **Objetivo:** definir datos compartidos, permisos comunes y automatizaciones.
- **Entregables:** modelo de datos compartidos, permisos comunes, catálogo de automatizaciones.
- **Módulos:** integración transversal.
- **Criterios:** fuente única de métricas y permisos verificable.
- **Web pública:** no se modifica.

### 15.5 Fase 5 — Roles, permisos y auditoría

- **Objetivo:** implementar la matriz y el catálogo de auditoría.
- **Entregables:** matriz operativa, catálogo de acciones críticas, exportación de auditoría.
- **Módulos:** Usuarios, Roles, Auditoría.
- **Criterios:** permisos comprobados por módulo y acción.
- **Web pública:** no se modifica.

### 15.6 Fase 6 — Navegación y flujos

- **Objetivo:** reorganizar navegación interna y rediseñar flujos operativos.
- **Entregables:** navegación propuesta (sección 9), flujos rediseñados (sección 10), retirada/validación de rutas huérfanas.
- **Módulos:** navegación SGIE y Admin.
- **Criterios:** ningún módulo necesario fuera del menú; flujos probados con usuarios.
- **Web pública:** no se modifica.

### 15.7 Fase 7 — Rediseño UX/UI interno de intranet

- **Objetivo:** mejorar jerarquía, densidad y consistencia **de la intranet**.
- **Entregables:** sistema de diseño interno, cabeceras/tablas/filtros/feedback normalizados, dashboards por rol.
- **Módulos:** todos los internos.
- **Criterios:** coherencia visual interna y pruebas de usabilidad.
- **Web pública:** no se modifica.

### 15.8 Fase 8 — Implementación incremental

- **Objetivo:** construir sin romper la operación.
- **Entregables:** módulos por orden de prioridad (P0 → P1 → P2 → P3), pruebas automatizadas, feature flags.
- **Módulos:** según priorización.
- **Criterios:** validaciones `lint`, `tsc`, `test`, `build` en verde; sin regresión.
- **Web pública:** no se modifica.

### 15.9 Fase 9 — Pruebas con usuarios

- **Objetivo:** validar con perfiles reales.
- **Entregables:** plan de pruebas, sesiones con abogados/asistentes/supervisores/editores, ajustes.
- **Módulos:** todos los implementados.
- **Criterios:** flujos críticos completados sin ayuda por cada perfil.
- **Web pública:** no se modifica.

### 15.10 Fase 10 — Despliegue y formación

- **Objetivo:** poner en producción interna y formar.
- **Entregables:** despliegue gradual, materiales de formación, soporte.
- **Módulos:** todos.
- **Criterios:** adopción por perfil y métricas de uso positivas.
- **Web pública:** no se modifica.

### 15.11 Fase futura independiente — Revisión web pública

- **Objetivo:** revisar, **por separado y con aprobación específica**, cualquier mejora que afecte a la web pública.
- **Alcance:** fuera de este plan. Cualquier propuesta sobre Blog, FAQ, Páginas, Menús, Biblioteca de medios, Áreas jurídicas o SEO que tenga efecto visible en la web pública se traslada aquí y **no se ejecuta** como parte de este plan.

---

## 16. Riesgos y decisiones pendientes

### 16.1 Riesgos SGIE

- Estados ambiguos sin nomenclatura validada.
- Densidad operativa alta en cockpit y fichas.
- Procesos manuales no confirmados (reportes, correos, clasificación).
- IA sin confianza/fuentes validadas.

### 16.2 Riesgos Admin

- Mezcla de dominios y carga cognitiva.
- Rutas no descubribles (Configuración SGIE, Agravantes, métricas/plantillas/reglas).
- Doble administración de usuarios.
- Retención documental `NO VALIDADO`.

### 16.3 Riesgos de integración

- Métricas dispares entre cockpit y Admin.
- Plantillas no conectadas con Correos.
- Reglas con efectos no trazados.

### 16.4 Riesgos de permisos

- Matriz no validada.
- Privilegios excesivos por defecto.
- Acciones críticas sin auditoría.

### 16.5 Riesgos de datos

- Duplicación de clientes/identidades.
- Documentos sin trazabilidad de revisión.
- Métricas sin fuente única.

### 16.6 Riesgos legales/documentales

- Retención documental sin aprobación legal.
- Eliminación no reversible asumida por error.
- Confianza en IA sin revisión humana.

### 16.7 Riesgos de adopción

- Resistencia al cambio por densidad visual.
- Rutas ocultas que generan desconfianza.
- Falta de formación por perfil.

### 16.8 Riesgos de impacto accidental en web pública

- Publicaciones editoriales sin aprobación.
- Cambios de menús/páginas/SEO que rompen navegación pública.
- Eliminación de contenido administrable sin doble confirmación.
- Uso de IA para modificar contenido público.

### 16.9 Decisiones pendientes

- Qué módulos de Admin pueden afectar la web pública (decidir el alcance exacto de cada uno).
- Qué perfiles pueden publicar o editar contenido público (definir aprobadores).
- Qué acciones requieren aprobación previa (catálogo de acciones sensibles).
- Cómo evitar que cambios internos rompan navegación, SEO o contenido público (cortafuegos editorial y técnico).
- Vigencia de Productividad y Agravantes.
- Aprobación legal de retención documental.

---

## 17. Conclusión ejecutiva

**Visión de fondo.** El objetivo final de este plan es convertir SGIE en un **sistema operativo semi-autónomo de documentación y relación con el cliente**. Eso significa: menos carga operativa para el abogado, más autonomía documental, mejor relación automática con el cliente y **expedientes preparados antes de llegar al abogado**. En el modelo resultante, **Admin es el centro de gobierno**, **SGIE es el motor operativo** y **el abogado es el revisor final de valor**.

**Cómo debe mejorar SGIE.** SGIE debe dejar de ser una herramienta de gestión pasiva para convertirse en un preparador de expedientes: catálogo canónico de estados, checklists documentales estandarizados, clasificación y validación preliminar por reglas/IA, solicitud y recordatorios automáticos al cliente, resumen con confianza y fuentes, y la marca **“Listo para revisión”** como evento central. La meta funcional es el **Nivel 3 de autonomía** (sección 2.3): el abogado recibe expedientes completos y solo revisa, resuelve excepciones, firma/aprueba y avanza al siguiente.

**Cómo debe mejorar Admin.** Admin debe segregarse por dominios y roles, unificar la gestión de usuarios, hacer descubribles los módulos de configuración SGIE, completar la auditoría de acciones críticas y establecer un gobierno editorial interno claro. Sobre todo, Admin debe **gobernar la autonomía de SGIE**: definir checklists, reglas, plantillas, estados, permisos, qué acciones automatiza SGIE, qué acciones requieren abogado, auditar y medir cuellos de botella. La retención documental debe permanecer no operativa hasta aprobación legal.

**Qué papel queda para el abogado.** El abogado deja de perseguir documentación y de gestionar tareas operativas. Recibe una **bandeja de “siguiente expediente”**, revisa el resumen ejecutivo y el checklist, resuelve las excepciones tipificadas (sección 10.18) y decide: aprobar, devolver, firmar o pedir más información. Su tiempo se concentra en decisión jurídica de valor, no en gestión documental.

**Cómo deben conectarse.** SGIE y Admin deben compartir identidad, permisos, métricas, plantillas, reglas y auditoría a través de la capa común. Cada automatización debe respetar permisos, versionarse y dejar trazabilidad. Las cifras de cockpit y de métricas SGIE deben provenir de la misma fuente. El éxito del modelo se mide con los KPIs de autonomía (sección 14.1).

**Beneficios del rediseño.** Menos carga operativa para el abogado, expedientes completos y trazables, relación documental automática con el cliente, permisos gobernados, trazabilidad legal, comunicaciones consistentes, navegación coherente, IA útil y controlada, y dashboards por perfil orientados a la acción inmediata.

**Qué debe validarse antes de implementar.** Sesión autenticada controlada, entrevistas por perfil, matriz real de permisos, observación de flujos críticos con datos representativos, decisión sobre rutas huérfanas, capacidad real de cálculo de los KPIs de autonomía, y aprobación legal de la retención documental.

**La web pública queda explícitamente fuera del alcance de este plan y no debe verse afectada.** Las mejoras relacionadas con Blog, FAQ, Páginas, Menús, Biblioteca de medios, Áreas jurídicas y SEO se limitan a la administración interna; cualquier efecto visible en la web pública se marca como **“Impacto potencial, requiere aprobación específica”** y se traslada a la fase futura independiente de revisión web pública, fuera de la ejecución de este plan.

---

## Registro de certeza

- **VALIDADO (estructura):** rutas, menús, pantallas y controles descritos en la auditoría base, presentes en el repositorio.
- **NO VALIDADO:** comportamiento real en producción autenticada, datos mostrados, permisos efectivos, persistencia, integraciones y éxito de acciones.
- **PENDIENTE DE VALIDAR:** todos los flujos que requieren autenticación, datos reales o escritura; en particular, Productividad, Agravantes, retención documental y la matriz de permisos propuesta.

Este plan es estratégico y funcional. No contiene código ni diseño visual final. No inventa funciones no confirmadas. Cuando algo no está claro, se marca como **Pendiente de validar**.
