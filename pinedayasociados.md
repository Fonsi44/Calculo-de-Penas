# Pineda y Asociados — Plan de Acción SGIE Autopilot

> **Documento maestro de transformación operativa.**
> Versión 4.0 — Plan técnico-operativo preciso, ejecutable y alineado con una
> herramienta real de trabajo para abogados.
>
> **Objetivo central:** que el abogado dedique su tiempo a **validar, decidir,
> asesorar y firmar**. El sistema debe encargarse del resto: pedir documentos,
> recibir archivos, clasificarlos, hacer OCR cuando sea necesario, extraer datos,
> detectar faltantes, validar coherencia, generar alertas, enviar correos, crear
> tareas, proponer agenda y dejar trazabilidad completa.
>
> **Honestidad operativa:** este documento es un plan de acción y diseño. No es
> código ni implica que el sistema ya esté implementado. Todo dato legal,
> requisito documental o plazo procesal debe validarse por abogado antes de
> incorporarse como regla activa. Los costes de proveedores deben re-verificarse
> antes de contratar o desarrollar.

---

## Índice

1. Resultado esperado
2. Principio rector: abogado valida y firma; sistema opera
3. Visión refinada del producto — SGIE Autopilot
4. Estado de partida y restricciones reales
5. Objetivos medibles
6. Roles, accesos y panel admin de Usuarios / Accesos
7. Niveles de automatización del bufete
8. Flujo extremo a extremo del expediente
9. Mapa de módulos del SGIE Autopilot
10. Cockpit del abogado
11. Base de procedimientos y checklists inteligentes
12. Motor documental
13. IA / OCR con DeepSeek
14. Motor de confianza inteligente
15. Motor de reglas
16. Aprendizaje controlado
17. Automatizaciones por fase
18. Correos y comunicación con clientes
19. Agenda, plazos y tareas
20. Datos, almacenamiento y trazabilidad
21. Retención documental (Honduras)
22. Seguridad, privacidad y gobierno
23. Arquitectura técnica sobre la intranet actual
24. Backlog técnico por fases (Fase 0–10)
25. Plan de 30 / 60 / 90 / 180 días
26. Métricas de éxito
27. Costes y control financiero
28. Riesgos y mitigaciones
29. Decisiones que debe tomar el despacho
30. Reglas de implementación
31. Criterios de aceptación globales
32. Formato de respuesta final por fase

---

## 1. Resultado esperado

Pineda y Asociados debe evolucionar de una operación basada en correos,
WhatsApp, carpetas, recordatorios manuales y revisión documento por documento a
una **plataforma de gestión documental de expedientes con copiloto operativo
para abogados**.

El resultado buscado es claro:

- Cada solicitud se convierte en un expediente trazable.
- Cada expediente sabe qué documentos necesita.
- Cada documento solicitado se pide automáticamente al cliente.
- Cada archivo recibido se clasifica, almacena, resume y valida.
- Cada dato extraído queda asociado a su fuente documental.
- Cada faltante, contradicción, vencimiento o baja confianza genera alerta.
- Cada fase relevante envía correos automáticos o notificaciones internas.
- Cada plazo o audiencia detectada genera tarea y evento propuesto.
- El abogado recibe una pantalla consolidada para revisar, corregir, validar y
  firmar.

La meta no es sustituir al abogado. La meta es que el abogado deje de perseguir
documentos, copiar datos, buscar vencimientos y escribir correos repetitivos.

---

## 2. Principio rector: abogado valida y firma; sistema opera

### 2.1 Lo que hace el sistema

El sistema asume toda tarea repetible, verificable y trazable:

- Crear expediente desde una solicitud o registro manual.
- Detectar si el cliente ya existe.
- Sugerir el procedimiento jurídico aplicable.
- Instanciar checklist documental según procedimiento.
- Generar enlaces seguros de carga documental.
- Enviar correos automáticos al cliente.
- Recibir documentos sin que el cliente tenga cuenta.
- Validar tipo, tamaño, MIME, magic bytes, hash SHA-256 y duplicados.
- Extraer texto del documento.
- Clasificar el documento.
- Extraer campos con IA y/o heurísticas.
- Guardar cada campo con confianza calculada y cita fuente.
- Ejecutar reglas deterministas.
- Detectar faltantes, vencimientos, contradicciones e ilegibles.
- Crear tareas y alertas.
- Proponer eventos de agenda.
- Preparar resumen ejecutivo del expediente.
- Medir completitud y riesgo.
- Construir la bandeja de revisión del abogado.

### 2.2 Lo que hace el abogado

El abogado conserva las decisiones críticas:

- Confirmar el procedimiento cuando haya duda.
- Aprobar o ajustar el checklist en casos no estándar.
- Confirmar o corregir campos sensibles.
- Aprobar o rechazar documentos.
- Resolver contradicciones.
- Definir estrategia jurídica.
- Validar el expediente.
- Firmar escritos, contratos, poderes o presentaciones.
- Decidir presentación, trámite, cierre o archivo.

### 2.3 Regla inviolable

La IA y las automatizaciones **nunca** aprueban, firman, presentan ni cierran un
expediente, ni toman decisiones jurídicas finales. El sistema prepara; el
abogado decide. Aun con confianza alta, las transiciones críticas requieren
acción explícita del abogado.

---

## 3. Visión refinada del producto — SGIE Autopilot

El SGIE Autopilot es una **plataforma de gestión documental de expedientes
jurídicos con copiloto operativo para abogados**. No es una carpeta de
archivos ni un simple visor de PDF; es una herramienta real de ayuda al
abogado que trabaja con Pineda y Asociados.

El producto se articula en tres planos:

### 3.1 Plano operativo (lo hace el sistema)

- Pedir documentación al cliente por enlaces seguros.
- Recibir, validar, clasificar y almacenar archivos.
- Hacer OCR sólo cuando sea necesario.
- Extraer datos estructurados con IA.
- Detectar faltantes, contradicciones, vencimientos e ilegibles.
- Generar alertas, tareas y eventos de agenda.
- Redactar y enviar correos transaccionales por fase.
- Construir el resumen ejecutivo y la bandeja de revisión.

### 3.2 Plano de decisión (lo hace el abogado)

- Valida, corrige, aprueba, rechaza, firma y decide.
- Resuelve inconsistencias y define estrategia jurídica.
- Aprueba o ajusta checklists, campos y plazos críticos.
- Confirma eventos de agenda y transiciones de estado.

### 3.3 Plano de gobierno (lo hace el admin)

- Gestiona usuarios, accesos, roles y vínculos de abogados.
- Versiona procedimientos y aprueba su validación legal.
- Reajusta umbrales de confianza y reglas desde panel.
- Supervisa auditoría, métricas y costes.

**La IA ayuda, pero no sustituye al abogado.** El abogado valida, corrige,
aprueba, firma y decide. El sistema prepara, organiza, alerta, recomienda y
automatiza tareas repetibles.

---

## 4. Estado de partida y restricciones reales

### 4.1 Stack actual aprovechable

| Capa | Estado actual | Aprovechamiento para SGIE |
|---|---|---|
| Framework | Next.js App Router | Panel interno, APIs y portal de carga |
| DB | Neon PostgreSQL + Drizzle ORM | Nuevas tablas SGIE |
| Auth | JWT + bcrypt, roles `admin` / `abogado` | Acceso privado y scope por abogado |
| Storage | Vercel Blob | Documentos y texto extraído |
| Email | Resend | Correos transaccionales por fase |
| Auditoría | `auditoria_eventos` | Extender con acciones SGIE |
| Seguridad | proxy, CSP, Zod, rate limit | Extender a `/api/sgie/*` y carga pública |
| IA/OCR | (a integrar) | DeepSeek V4 Flash vía capa configurable |

### 4.2 Restricciones que no se deben ignorar

- Vercel serverless no es adecuado para procesos largos de OCR/IA dentro de un
  request. El procesamiento pesado debe ir a cola, cron o worker.
- Las rutas de intranet y datos de expedientes son privadas. No aparecen en web
  pública, sitemap, robots, schemas ni enlaces públicos.
- Toda persistencia final debe estar en DB y object storage, no en mocks.
- No inventar requisitos legales, plazos ni citas. Todo procedimiento se
  versiona y queda pendiente de validación legal hasta aprobación humana.
- Los proveedores de IA y sus precios cambian. El sistema usa una capa
  abstracta configurable; no depende rígidamente de un modelo concreto.
- **No añadir más proveedores ni complicar el stack.** Perfeccionamos lo que ya
  tenemos. Cualquier proveedor adicional queda como fase futura opcional, nunca
  como requisito del MVP.

---

## 5. Objetivos medibles

### 5.1 Objetivos de negocio

| Objetivo | Indicador objetivo |
|---|---:|
| Reducir trabajo administrativo repetitivo | -60 % de tiempo manual por expediente |
| Evitar pérdida de documentos | 100 % de documentos requeridos con estado visible |
| Evitar pérdida de plazos | 100 % de fechas relevantes generan tarea o evento propuesto |
| Mejorar respuesta al cliente | 100 % de fases críticas con correo automático |
| Aumentar capacidad operativa | +2x expedientes simultáneos sin duplicar personal |
| Mejorar trazabilidad | 100 % de acciones críticas auditadas |

### 5.2 Objetivos de producto

- Panel admin con módulo **Usuarios / Accesos** completo.
- Acceso por rol abogado: cuando un usuario con rol `abogado` entra en la
  intranet, ve el módulo SGIE completo (cockpit, expedientes, checklist,
  documentos, alertas, tareas, agenda, correos y acciones de validación).
- Scope por abogado: cada abogado sólo accede a sus clientes y expedientes
  asignados, salvo permiso adicional concedido por admin.
- Portal de carga documental sin cuenta para clientes.
- Checklists por procedimiento editables y versionados.
- Motor de extracción IA con confianza calculada y cita fuente.
- Motor de reglas determinista, reajustable desde panel admin.
- Motor de confianza inteligente basado en evidencias verificables.
- Aprendizaje controlado por correcciones del abogado.
- Automatización de correos por fase, idempotente.
- Bandeja de validación y firma consolidada.

### 5.3 Objetivos de control

- Ningún expediente pasa a `validado`, `pendiente_de_firma`, `en_tramite`,
  `finalizado` o `archivado` sin acción explícita del abogado.
- Ningún campo extraído por IA se considera definitivo sin confirmación o sin
  regla de confianza aprobada.
- Ningún documento se re-procesa (IA/OCR) si su hash SHA-256 no cambió.
- Ningún correo automático se envía dos veces por el mismo disparador.
- Ningún cambio de rol, umbral o regla se aplica sin auditoría.

---

## 6. Roles, accesos y panel admin de Usuarios / Accesos

### 6.1 Roles

| Rol | Acceso | Responsabilidad |
|---|---|---|
| Admin | Todo `/intranet/*` y panel admin | Configura usuarios, accesos, procedimientos, plantillas, reglas, umbrales, auditoría y reportes |
| Abogado | `/intranet/sgie/*` (módulo SGIE completo) | Valida expedientes, documentos, campos, estrategia y firma; sólo sus clientes/asignaciones |
| Asistente legal | (futura fase opcional) | Carga documentos, corrige datos y prepara expedientes si se habilita con RBAC fino |
| Cliente | `/cargar/{token}` (sin cuenta) | Sube documentos por enlace mágico |
| Sistema | Interno | Orquesta estados, correos, tareas, alertas, IA y reglas |

### 6.2 Módulo admin: Usuarios / Accesos

Función **nueva** del panel admin (`/intranet/admin/usuarios`). El admin debe
poder:

- Ver correos registrados en el sistema.
- Activar o desactivar usuarios (toggle de acceso).
- Asignar o quitar rol `abogado` a un usuario.
- Vincular un usuario abogado a un correo corporativo `@pinedayasociadoshn.com`.
- Bloquear acceso de un usuario (revocación temporal o definitiva).
- Ver último acceso (fecha, IP si está registrada).
- Ver expedientes asignados a cada abogado (conteo y listing acotado).
- Auditar cambios de rol y de vínculos de correo (tabla `auditoria_eventos` con
  campo extendido para acciones SGIE de gobernanza).

**Regla de acceso por rol abogado:** cuando un usuario con rol `abogado` entra
en la intranet, debe ver el módulo SGIE completo: cockpit del abogado,
expedientes, checklist, documentos, alertas, tareas, agenda, correos y
acciones de validación.

**Regla de scope:** cada abogado sólo accede a sus clientes y expedientes
asignados. El admin puede conceder permiso adicional (caso: revisión por
supervisión, sustitución o reasignación) mediante una tabla
`expediente_permisos` con `(expediente_id, abogado_id, tipo_permiso,
concedido_por, concedido_en, revocado_en)`.

### 6.3 RACI operativo

| Actividad | Sistema | Abogado | Admin | Cliente |
|---|:---:|:---:|:---:|:---:|
| Crear checklist sugerido | R | A | C | - |
| Pedir documentos | R | A configurable | - | C |
| Subir documentos | C | C | - | R |
| Clasificar documentos | R | A si duda | - | - |
| Extraer datos | R | A si baja confianza | - | - |
| Validar requisitos | R | A | C | - |
| Firmar / presentar | - | R/A | - | - |
| Auditar acciones | R | C | A | - |
| Gestionar usuarios/roles | - | - | R/A | - |
| Reajustar reglas/umbrales | R (sugiere) | C | A | - |

R = realiza, A = responsable final, C = consultado.

---

## 7. Niveles de automatización del bufete

| Nivel | Nombre | Descripción | Fase objetivo |
|---:|---|---|---|
| 0 | Manual | Correos, carpetas y revisión manual | Estado anterior |
| 1 | Digitalizado | Expedientes y documentos en sistema | Fase 1 |
| 2 | Guiado | Checklists, estados y tareas automáticas | Fase 3 |
| 3 | Automatizado | Correos, recordatorios, alertas y agenda propuesta | Fase 5 |
| 4 | Asistido por IA | Clasificación, extracción, resumen y validación preliminar | Fase 7–8 |
| 5 | Autopilot jurídico supervisado | Sistema prepara todo; abogado revisa, valida y firma; aprendizaje controlado activo | Fase 10+ |

El objetivo realista para la primera versión productiva es alcanzar el **Nivel
3** con bases sólidas, subir a **Nivel 4** con IA controlada y alcanzar el
**Nivel 5** cuando el flujo completo es estable, medido y auditado, con
aprendizaje controlado aprobado por el admin.

---

## 8. Flujo extremo a extremo del expediente

### 8.1 Flujo canónico

1. **Entrada de solicitud** — cliente contacta; abogado o asistente registra.
2. **Alta o detección de cliente existente** — valida identidad/RTN/correo,
   detecta duplicados y propone vincular o crear.
3. **Selección de procedimiento** — abogado elige; sistema sugiere si hay texto
   suficiente, pero la selección final es humana.
4. **Creación de expediente** — número interno, responsable, área, prioridad,
   estado inicial, historial y auditoría.
5. **Checklist inteligente** — instancia requisitos del procedimiento vigente:
   obligatorios, opcionales y condicionales.
6. **Confirmación del checklist** — abogado aprueba o ajusta. Desde aquí el
   sistema puede operar automáticamente.
7. **Solicitud documental automática** — enlaces mágicos y correo al cliente
   con instrucciones, vencimiento y lista clara de documentos.
8. **Carga segura del cliente** — valida token, expiración, usos máximos,
   tamaño, MIME, magic bytes, hash SHA-256; almacena en Blob.
9. **Clasificación documental** — primero heurística, IA sólo si no basta.
10. **Extracción de datos** — texto + campos estructurados con confianza y
    cita fuente. Si no hay texto, OCR selectivo o marca ilegible.
11. **Validación de reglas** — completitud, vigencia, formato, duplicados,
    coherencia entre documentos y contra datos del cliente.
12. **Cálculo de confianza inteligente** — por documento, campo y expediente.
13. **Automatizaciones de seguimiento** — correos, tareas y notificaciones al
    abogado según faltantes, vencimientos o inconsistencias.
14. **Cockpit de revisión** — abogado ve resumen, checklist, documentos, campos,
    alertas, plazos, tareas y evidencia fuente en una sola pantalla.
15. **Validación y firma** — abogado corrige, aprueba/rechaza, valida y firma.
    El sistema registra todo y cambia estado sólo por acción humana.
16. **Trámite y seguimiento** — sistema mantiene tareas, agenda, recordatorios y
    comunicaciones.
17. **Cierre y archivo** — el abogado cierra; el sistema aplica política de
    retención configurable y archivado.

### 8.2 Estados principales del expediente

| Estado | Responsable de transición |
|---|---|
| `creado` | Sistema tras alta |
| `pendiente_de_checklist` | Sistema |
| `pendiente_de_documentos` | Abogado tras aprobar checklist |
| `enlace_enviado` | Sistema o abogado según configuración |
| `documentos_parcialmente_recibidos` | Sistema |
| `documentos_completos` | Sistema |
| `analisis_pendiente` | Sistema |
| `analisis_completado` | Sistema |
| `inconsistencias_detectadas` | Sistema |
| `pendiente_validacion_abogado` | Sistema |
| `validado` | Sólo abogado |
| `pendiente_de_firma` | Sólo abogado |
| `en_tramite` | Sólo abogado |
| `en_seguimiento` | Sólo abogado / sistema crea tareas |
| `finalizado` | Sólo abogado |
| `archivado` | Sólo abogado o política aprobada |

---

## 9. Mapa de módulos del SGIE Autopilot

| Módulo | Propósito | Prioridad | Fase |
|---|---|---|---|
| Usuarios / Accesos (admin) | Gestionar usuarios, roles, vínculos y auditoría | P0 | Fase 2 |
| Clientes | Maestro de personas, duplicados, contacto | P0 | Fase 1 |
| Expedientes | Unidad central de trabajo | P0 | Fase 3 |
| Procedimientos | Catálogo versionado de servicios y requisitos | P0 | Fase 1 |
| Checklist | Instancia documental por expediente | P0 | Fase 3 |
| Enlaces mágicos | Carga externa sin cuenta | P1 | Fase 4 |
| Documentos | Storage, metadatos, hash, estados | P1 | Fase 6 |
| Plantillas de correo | Comunicación automatizada | P1 | Fase 5 |
| Automatizaciones | Disparadores, jobs, idempotencia | P1 | Fase 5+ |
| IA documental (DeepSeek) | Clasificación, extracción, resumen | P2 | Fase 7 |
| OCR | Sólo si documento no tiene texto | P2 | Fase 7 |
| Motor de confianza | Confianza por evidencias verificables | P2 | Fase 8 |
| Motor de reglas | Validación determinista reajustable | P2 | Fase 8 |
| Aprendizaje controlado | Mejora por correcciones del abogado | P2 | Fase 10 |
| Cockpit abogado | Revisión y validación consolidada | P2 | Fase 9 |
| Agenda / tareas | Plazos, audiencias, seguimiento | P2/P3 | Fase 9 |
| Retención documental | Política configurable de archivo/borrado | P2 | Fase 10 |
| Reportes | Productividad, costes, cuellos de botella | P3 | Fase 10 |
| Auditoría avanzada | Exportación, filtros, cumplimiento | P3 | Fase 10 |

---

## 10. Cockpit del abogado

El cockpit es la pieza que hace real el objetivo de delegar todo lo operativo.
Debe evitar que el abogado abra diez pantallas o revise archivo por archivo.

### 10.1 Vista principal (bandeja consolidada)

Tarjetas/señales que debe mostrar:

- **Expedientes listos para revisar** (sin errores bloqueantes).
- **Expedientes con documentos faltantes** (checklist incompleto).
- **Documentos pendientes de aprobación** (subidos, no revisados).
- **Alertas de baja confianza** (documentos/campos en rango 0–70).
- **Inconsistencias detectadas** (coherencia entre documentos/cliente).
- **Tareas de hoy** (auto y manuales).
- **Próximos plazos** (7 / 30 días y vencidos).
- **Clientes sin respuesta** (enlace enviado sin carga > N días).
- **Correos fallidos** (Resend error en últimas 24 h).
- **Expedientes listos para firma** (`validado` pendiente de firma).

Filtros por abogado (scope), área, prioridad, estado, fecha. Sin acceso a
expedientes de otros abogados, salvo permiso concedido por admin.

### 10.2 Pantalla de revisión de expediente

Debe mostrar:

1. **Resumen ejecutivo**: cliente, procedimiento, estado, riesgo, completitud y
   próximos pasos sugeridos.
2. **Checklist documental**: requerido/opcional/condicional, recibido/faltante,
   aprobado, rechazado o vencido.
3. **Documentos**: visor, metadatos, hash, estado, tipo clasificado, origen.
4. **Campos extraídos**: valor, confianza calculada, cita fuente, documento
   origen, observaciones.
5. **Alertas**: faltantes, baja confianza, contradicciones, vencimientos, con
   severidad `info`/`advertencia`/`error`/`critico`.
6. **Plazos y agenda**: fechas detectadas y eventos propuestos (confirmar /
   descartar).
7. **Tareas**: automáticas y manuales.
8. **Correos enviados**: registro por expediente.
9. **Historial**: línea de tiempo del expediente (audit trail).
10. **Acciones finales**: validar, enviar a firma, marcar en trámite,
    finalizar.

### 10.3 Acciones rápidas

- Aprobar documento.
- Rechazar documento con motivo.
- Solicitar reemplazo con un clic (genera nuevo enlace + correo).
- Confirmar campo extraído.
- Corregir campo extraído (queda registrado como corrección del abogado).
- Resolver alerta.
- Crear tarea manual.
- Confirmar evento de agenda.
- Generar correo desde plantilla.
- Mandar a firma.
- Marcar en trámite.
- Validar expediente.

Cada acción rápida registra en `historial_expediente` y `auditoria_eventos`.

---

## 11. Base de procedimientos y checklists inteligentes

### 11.1 Función

La base de procedimientos convierte el conocimiento operativo del despacho en
flujos reutilizables. No es una lista estática: es el cerebro declarativo del
SGIE.

### 11.2 Estructura mínima

Cada procedimiento debe tener:

- Nombre, slug, área jurídica, descripción.
- Versión y estado (`borrador`, `activo`, `desactivado`,
  `pendiente_validacion_legal`).
- Documentos requeridos.
- Documentos opcionales.
- Documentos condicionales.
- Campos esperados.
- Reglas de validación.
- Plazos internos.
- Tareas automáticas.
- Plantillas de correo asociadas.
- Criterios de completitud.
- Responsable de validación legal.

### 11.3 Reglas de gobierno

- Ningún procedimiento nuevo se activa sin revisión del abogado responsable.
- Un expediente queda anclado a la versión del procedimiento vigente al crearse.
- Cambiar un procedimiento no altera expedientes en curso.
- Los seeds iniciales se marcan como `pendiente_validacion_legal` hasta que un
  abogado los apruebe.
- El admin gestiona el catálogo; el abogado lo consume y puede ajustar el
  checklist sólo dentro de un expediente concreto.

### 11.4 Generación inicial desde el catálogo del sitio

Como tarea de la **Fase 0/1**, se debe crear un procedimiento por cada servicio
ofrecido en `https://www.pinedayasociadoshn.com/servicios-juridicos`, entrando
en cada rama del derecho (familia, laboral, civil y notarial, etc.) y por cada
servicio (divorcio por mutuo acuerdo, etc.) creando un procedimiento con sus
documentos requeridos. Luego, el sistema permite modificarlos agregando o
quitando documentos en cada expediente concreto.

### 11.5 Ejemplo no normativo

Procedimiento: "Divorcio voluntario".

- Documentos requeridos: acta de matrimonio, identidades, propuesta de
  convenio, actas de nacimiento de hijos si aplica.
- Campos esperados: nombres, identidades, fecha de matrimonio, hijos, domicilio.
- Reglas: coincidencia de identidades, presencia de documentos requeridos,
  legibilidad, vigencia si el despacho la exige.
- Estado legal: pendiente de validación por abogado antes de activar.

---

## 12. Motor documental

### 12.1 Responsabilidades

- Recibir archivos por enlace mágico.
- Validar token, expiración, máximo de usos.
- Validar tamaño, MIME permitido, magic bytes cuando sea posible.
- Calcular hash SHA-256 del contenido.
- Detectar duplicados por hash (en el expediente y de forma global configurable).
- **No procesar con IA/OCR archivos duplicados si el hash ya existe.**
- Guardar originales en Vercel Blob (rutas privadas).
- Registrar metadatos en PostgreSQL.
- Extraer texto si existe (capa de texto en PDF).
- Enviar a OCR sólo si no hay texto y la regla lo autoriza.
- Clasificar documento (heurística primero, IA si no basta).
- Mantener estados y trazabilidad completa.

### 12.2 Atributos obligatorios de todo documento

Todo documento debe tener asociados:

- `expediente_id`: a qué expediente pertenece.
- `requisito_id`: a qué requisito del checklist satisface (si aplica).
- `estado`: estado documental (ver §12.3).
- `hash_sha256`: identificación de contenido.
- `origen`: `cliente` / `abogado` / `admin` / `sistema`.
- `metadatos`: tamaño, MIME, nombre original saneado, páginas (si aplica),
  almacenamiento (Blob URL/path privado).
- `trazabilidad`: fecha de carga, usuario o token, IP, user-agent, acciones
  posteriores (auditadas).

### 12.3 Estados de documento

| Estado | Significado |
|---|---|
| `solicitado` | Requisito pendiente |
| `subido` | Archivo recibido |
| `clasificando` | En análisis de tipo |
| `clasificado` | Tipo identificado |
| `texto_extraido` | Texto disponible |
| `ocr_pendiente` | Requiere OCR |
| `ilegible` | No se pudo leer |
| `duplicado` | Hash ya existe |
| `incorrecto` | No corresponde al requisito |
| `vencido` | Regla de vigencia falló |
| `ia_procesada` | IA devolvió extracción |
| `pendiente_abogado` | Requiere revisión humana |
| `aprobado` | Abogado aprueba |
| `rechazado` | Abogado rechaza |

### 12.4 Reglas técnicas mínimas

- Tamaño máximo configurable por admin.
- MIME permitido configurable por admin.
- Verificación por magic bytes cuando sea posible.
- Nombres saneados (`sanitize`).
- Rutas privadas en Blob; acceso firmado o mediado por API autorizada.
- Descarga autorizada por expediente y rol (scope por abogado).
- Hash obligatorio **antes** de procesar IA/OCR.
- Cache de texto y extracción por hash.
- Auditoría de apertura, descarga, aprobación, rechazo y reemplazo.

### 12.5 Detección de duplicados

- Al recibir un archivo, calcular `hash_sha256` antes de cualquier proceso.
- Si el hash existe para otro documento del mismo expediente o del mismo
  requisito: marcar `duplicado`, no ejecutar IA/OCR, notificar al abogado y al
  cliente (correo de "documento duplicado" configurable).
- Politica de duplicados globales configurable por admin (permitir asociar a
  otro expediente, sólo citar el hash, o bloquear).

---

## 13. IA / OCR con DeepSeek

### 13.1 Capa IA configurable

La IA es una **capa intercambiable**, configurable vía variables de entorno y
una interfaz interna. Proveedor inicial: **DeepSeek V4 Flash** (o un modelo
inferior de DeepSeek si cumple la función). No hay dependencia rígida del
modelo.

Variables orientativas:

```env
IA_DOCUMENTAL_PROVIDER=deepseek
IA_DOCUMENTAL_MODEL=deepseek-v4-flash
IA_DOCUMENTAL_BASE_URL=https://api.deepseek.com/v1
IA_DOCUMENTAL_API_KEY=<env, nunca hardcodeada>
IA_DOCUMENTAL_MODE=ai           # heuristic | ai | disabled
IA_DOCUMENTAL_TIMEOUT_MS=60000
IA_DOCUMENTAL_MAX_RETRIES=2
```

- `IA_DOCUMENTAL_MODE=heuristic`: sólo heurísticas locales, sin llamadas IA.
- `IA_DOCUMENTAL_MODE=ai`: heurísticas + DeepSeek si la heurística no basta.
- `IA_DOCUMENTAL_MODE=disabled`: sin IA externa; los documentos quedan en
  `pendiente_abogado` para revisión manual.

### 13.2 Funciones permitidas

- Clasificar documento cuando la heurística no baste.
- Extraer datos estructurados (campos).
- Generar resumen descriptivo del documento.
- Detectar ilegibilidad, incompletitud o señales de vencimiento textual.
- Sugerir próximos pasos operativos.

### 13.3 Funciones prohibidas

- Aprobar o rechazar documentos definitivamente.
- Firmar, presentar trámites, cerrar expedientes.
- Inventar requisitos legales, plazos, jurisprudencia, conclusiones jurídicas o
  datos no presentes en el documento.
- Mezclar datos entre expedientes.
- Tomar estrategia jurídica.

### 13.4 Esquema de salida (JSON estricto validado por Zod)

```json
{
  "documento_id": "...",
  "tipo_documento": "identidad|acta|poder|contrato|otro",
  "confianza_tipo": 0.91,
  "campos": [
    {
      "clave": "identidad",
      "valor": "0801-1990-01234",
      "tipo": "identidad",
      "confianza": 0.97,
      "cita_fragmento": "...",
      "observaciones": []
    }
  ],
  "alertas_sugeridas": [],
  "resumen_descriptivo": "...",
  "proximos_pasos_sugeridos": []
}
```

**Regla:** si un dato no está en el documento, la IA devuelve `null`. Prohibido
inventar. La confianza por campo es una señal **inicial**; la confianza final
la calcula el motor de confianza inteligente (§14) combinando evidencias.

### 13.5 Medidas anti-alucinación

- Un documento por llamada.
- Un expediente por contexto.
- Sin memoria cruzada entre llamadas.
- Prompt restrictivo: "si no está en el documento, devuelve null".
- JSON schema obligatorio y validación Zod en el backend antes de persistir.
- Cita fuente obligatoria para campos críticos.
- Reintentos limitados (`IA_DOCUMENTAL_MAX_RETRIES`).
- Fallback a `pendiente_abogado` si falla.
- Logs de tokens, prompt hash, duración, proveedor, modelo y estado.
- Reglas deterministas antes de que un dato alimente automatizaciones.
- API key **siempre** de variables de entorno `IA_DOCUMENTAL_API_KEY`; nunca
  hardcodeada ni commiteada. Si se compromete, requiere rotación en el panel
  del proveedor (el código no resuelve una clave comprometida).

### 13.6 OCR

- OCR se ejecuta **sólo cuando el documento no tiene capa de texto**.
- Se realiza de forma asíncrona (jobs/cron), nunca dentro de un route handler.
- Si OCR falla o la calidad es insuficiente, el documento se marca `ilegible` y
  se dispara el flujo de solicitud de reemplazo.
- Proveedor/con motor de OCR queda como decisión de Fase 7; si no se decide,
  MVP marca `ilegible` y pide reemplazo.

---

## 14. Motor de confianza inteligente

La confianza **no depende sólo del modelo IA**. Se calcula en base a evidencias
verificables, combinando señales:

### 14.1 Señales de evidencia

| Señal | Peso orientativo |
|---|---|
| Coincidencia entre documento y datos del cliente | alta |
| Coincidencia entre varios documentos del expediente | alta |
| Formato válido (identidad, RTN, fecha, moneda, correo, teléfono) | media |
| Presencia de cita fuente en campos críticos | alta |
| Calidad OCR / texto legible | media |
| Ausencia de contradicciones | alta |
| Documento no duplicado (hash único) | media |
| Vigencia válida si aplica | alta |
| Tipo documental esperado coincide con el clasificado | media |

### 14.2 Escala de confianza

| Rango | Etiqueta | Comportamiento |
|---|---|---|
| 0–40 | Baja | Requiere revisión humana obligatoria |
| 41–70 | Media | Genera alerta; revisión recomendada |
| 71–89 | Alta | Revisable; auto-apto para bandeja del abogado |
| 90–100 | Muy alta | Candidata a validación asistida |

### 14.3 Regla inviolable

Aun con confianza alta o muy alta, las **transiciones críticas** (validar,
firmar, presentar, cerrar, archivar) requieren **acción explícita** del
abogado. La confianza alta reduce fricción, no elimina responsabilidad humana.

### 14.4 Implementación

- Cálculo por campo (`confianza_campo`), por documento (`confianza_documento`)
  y por expediente (`confianza_expediente`).
- Algoritmo determinista, idempotente, configurable en pesos por admin (umbrales
  y pesos se reajustan desde panel y quedan en `reglas_config` versionada).
- Resultado persistido con evidencias: lista de señales activadas y su peso.
- Re-cálculo automático al corregir campo, aprobar/rechazar documento o
  actualizar expediente.

---

## 15. Motor de reglas

### 15.1 Responsabilidades

El motor de reglas es el corazón de la confiabilidad. Debe ser **determinista,
idempotente y auditable**.

Valida:

- Formato de identidad, RTN, fechas, montos, correos y teléfonos.
- Completitud documental (obligatorios, condicionales, opcionales).
- Vencimientos (documentos y enlaces).
- Duplicados por hash.
- Incoherencias entre documentos y contra datos del cliente.
- Confianza mínima de campos extraídos.
- Existencia de cita fuente en campos críticos.
- Documentos obligatorios vs condicionales según contexto del expediente.
- Transiciones de estado permitidas.

### 15.2 Severidades

| Severidad | Efecto |
|---|---|
| `info` | No bloquea, sólo informa |
| `advertencia` | Requiere atención, no bloquea por defecto |
| `error` | Bloquea paso a validación final |
| `critico` | Bloquea y notifica de inmediato |

### 15.3 Propiedades

- **Deterministas**: misma entrada → misma salida.
- **Idempotentes**: repetir una validación no duplica alertas, correos ni
  tareas. Clave sugerida: `expediente_id + regla_id + documento_id +
  ventana_temporal`.
- **Auditables**: cada ejecución registra regla, severidad, evidencias,
  resultado, actor (sistema/abogado/admin) y fecha.

### 15.4 Reajuste desde panel admin

- Reglas y umbrales **deben poder reajustarse desde el panel admin**, con
  historial de versiones (`reglas_config_version`) y auditoría de cambios.
- cambios de reglas críticas (severidad `error`/`critico`) requieren
  confirmación del admin y pueden marcarse como "requiere revalidación de
  expedientes en curso".
- Las reglas se aplican en orden de severidad descendente; una regla `critico`
  detiene el flujo automático hasta resolución humana.

---

## 16. Aprendizaje controlado

Queremos **inteligencia real, pero segura**. La mejora continua se basa en
correcciones del abogado **sin auto-modificar reglas críticas en producción**.

### 16.1 Registro de correcciones

Por cada corrección del abogado sobre un campo propuesto por IA, registrar:

- Campo propuesto por IA (valor + confianza inicial).
- Corrección del abogado (valor final).
- Motivo de la corrección (seleccionable por catálogo + texto libre).
- Documento origen (`documento_id`, hash, cita fuente).
- Regla afectada (si aplica).
- Resultado posterior (re-ejecución de reglas y confianza nueva).

Tabla: `correcciones_ia` (`id`, `extraccion_id`, `campo`, `valor_propuesto`,
`valor_corregido`, `motivo`, `documento_id`, `regla_id`, `abogado_id`,
`confianza_anterior`, `confianza_posterior`, `created_at`).

### 16.2 Detección de patrones

El sistema, en jobs asíncronos (no en línea), analiza las correcciones para
detectar patrones:

- Campos sistemáticamente mal extraídos por tipo de documento.
- Documentos con baja confianza recurrente.
- Reglas que generan falsos positivos/negativos frecuentes.
- Umbrales de confianza que conviene ajustar.

### 16.3 Aprobación humana

El sistema **puede sugerir** ajustes de umbrales o reglas al detectar
patrones, pero el **admin o el abogado responsable debe aprobarlos antes de
aplicarlos**. Nada de auto-modificación de reglas críticas en producción. Las
sugerencias quedan en una cola `sugerencias_ajuste` con estado
`pendiente`/`aprobada`/`rechazada` y auditoría de quién decidió.

### 16.4 Backtesting

Antes de aplicar un ajuste, el sistema puede ejecutar un backtest sobre
expedientes ya cerrados para estimar el impacto (positivo o negativo) y
mostrarlo al aprobador. El resultado del backtest es informativo; la decisión
final es humana.

---

## 17. Automatizaciones por fase

| Fase | Disparador | Automatización |
|---|---|---|
| Expediente creado | Alta de expediente | Crear historial, checklist inicial y tareas base |
| Checklist aprobado | Abogado confirma | Generar enlaces mágicos y correo documental |
| Enlace próximo a vencer | Cron diario | Recordatorio al cliente y alerta interna |
| Cliente sube archivo | Upload correcto | Acuse de recibo, notificación, clasificación |
| Documento duplicado | Hash repetido | Marcar duplicado, evitar IA, notificar |
| Documento ilegible | OCR fallido | Solicitar reemplazo o revisión manual |
| Faltan documentos | Checklist incompleto | Correo de faltantes + tarea de seguimiento |
| Documento rechazado | Abogado rechaza | Correo con motivo + nuevo enlace |
| IA termina | Extracción ok | Ejecutar reglas y actualizar completitud/confianza |
| Regla detecta error | Validación error | Alerta + tarea + posible correo sugerido |
| Expediente listo | Sin errores bloqueantes | Pasar a bandeja de validación del abogado |
| Fecha detectada | Confianza alta + regla ok | Crear evento propuesto + tarea |
| Caso atascado | Sin cambios N días | Alerta interna y resumen al abogado |
| Día laboral inicia | Cron diario | Resumen de expedientes críticos |

---

## 18. Correos y comunicación con clientes

### 18.1 Principio

El cliente recibe instrucciones claras y oportunas sin que el abogado redacte
cada correo manualmente. Todo correo queda registrado, es idempotente y evita
duplicados. Se usa **Resend** (proveedor actual).

### 18.2 Plantillas administrables

| Plantilla | Cuándo se envía |
|---|---|
| Solicitud documental | Al generar enlaces mágicos |
| Acuse de recibo | Tras subir cada documento |
| Faltantes | Si el checklist sigue incompleto |
| Recordatorio | Antes de expirar token |
| Enlace expirado | Al vencer token sin carga |
| Documento rechazado | Cuando abogado rechaza documento |
| Reemplazo | Documento ilegible/vencido/incorrecto |
| Expediente en revisión | Cuando pasa a validación del abogado |
| Cita / audiencia | Cuando abogado confirma evento |
| Cierre | Cuando abogado finaliza |

### 18.3 Variables permitidas

- `cliente_nombre`
- `expediente_numero`
- `procedimiento_nombre`
- `documentos_faltantes`
- `enlace_carga`
- `fecha_expiracion`
- `abogado_nombre`
- `telefono_despacho`
- `email_despacho`

Plantillas con HTML sanitizado (sanitize-html) y vista previa antes de activar.

### 18.4 Control anti-spam y anti-duplicado

- Rate limit por expediente y destinatario.
- Idempotencia por `plantilla + expediente + ventana_temporal` (tabla
  `correos_enviados` con UNIQUE idempotencia).
- Registro completo en `correos_enviados`.
- Reintentos con backoff si Resend falla.
- Alerta interna si un correo crítico falla.
- Recordatorios **configurables** (frecuencia, máximos por expediente, ventanas
  horarias) para no ser invasivos pero mantener presión operativa suficiente.

---

## 19. Agenda, plazos y tareas

### 19.1 Tipos de fecha

| Tipo | Origen | Estado inicial |
|---|---|---|
| Interna | Procedimiento / manual | Confirmada |
| Procesal detectada | Documento / IA | Propuesta |
| Audiencia | Documento / manual | Propuesta o confirmada |
| Recordatorio | Regla automática | Confirmada |
| Vencimiento de enlace | Sistema | Confirmada |

### 19.2 Regla de seguridad

Una fecha detectada por IA puede crear un evento **propuesto**, no definitivo,
salvo que una regla aprobada lo permita y el abogado lo confirme.

### 19.3 Bandejas operativas

- Hoy.
- Próximos 7 días.
- Vencidos.
- Expedientes sin movimiento.
- Pendiente de cliente.
- Pendiente de abogado.
- Listo para firma.

---

## 20. Datos, almacenamiento y trazabilidad

### 20.1 Entidades principales

| Entidad | Propósito |
|---|---|
| `usuarios_sgie` | Usuarios con rol SGIE y vínculo de correo corporativo |
| `clientes` | Maestro de clientes |
| `tipos_procedimiento` | Catálogo versionado |
| `expedientes` | Unidad de trabajo |
| `expediente_asignaciones` | Asignación abogado ↔ expediente |
| `expediente_permisos` | Permisos extra (revisión, sustitución) |
| `requisitos_expediente` | Checklist instanciado |
| `documentos_expediente` | Metadatos de documentos |
| `enlaces_magicos` | Tokens de carga |
| `extracciones_ia` | Resultado versionado de IA |
| `campos_extraidos` | Datos por campo y cita fuente |
| `confianza_resultados` | Confianza calculada por documento/campo/expediente |
| `validaciones` | Resultados del motor de reglas |
| `alertas` | Riesgos y faltantes |
| `tareas` | Trabajo pendiente |
| `eventos_agenda` | Plazos y audiencias |
| `plantillas_correo` | Comunicación configurable |
| `correos_enviados` | Registro de emails con idempotencia |
| `historial_expediente` | Línea de tiempo |
| `correcciones_ia` | Correcciones del abogado para aprendizaje |
| `sugerencias_ajuste` | Sugerencias de ajuste de reglas/umbrales |
| `reglas_config_version` | Versionado de reglas y umbrales |
| `jobs_sgie` | Cola de jobs idempotentes |
| `auditoria_eventos` | Auditoría transversal (extendida con acciones SGIE) |
| `retencion_politicas` | Políticas configurables de retención/archivado |

### 20.2 Qué se guarda dónde

| Dato | Ubicación |
|---|---|
| Bytes originales | Vercel Blob (rutas privadas) |
| Texto extraído | Blob `.txt` referenciado desde DB |
| Metadatos | PostgreSQL |
| Hash SHA-256 | PostgreSQL |
| Campos extraídos | PostgreSQL |
| Citas fuente | PostgreSQL, referenciando texto/documento |
| Confianza y evidencias | PostgreSQL |
| Auditoría | PostgreSQL |
| Correos enviados | PostgreSQL + Resend |
| Resultados IA | PostgreSQL + logs de tokens |

### 20.3 Trazabilidad mínima por acción crítica

Cada acción registra: usuario o sistema actor; expediente; documento si aplica;
acción; estado anterior y nuevo; fecha/hora; IP/user-agent en acciones
públicas; metadatos relevantes; hash del archivo si aplica.

---

## 21. Retención documental (Honduras)

### 21.1 Tarea pendiente: investigación normativa

Como tarea explícita de la **Fase 10**, se debe **investigar la normativa
aplicable en Honduras** sobre:

- Conservación de documentación sensible (expedientes legales, identidades,
  Poderes, contratos).
- Protección de datos personales (principios, derechos ARCO, base jurídica,
  transferencias internacionales a proveedores IA).
- Obligaciones del despacho en cuanto a archivo, conservación y eventual
  destrucción segura.
- Plazos mínimos/máximos de conservación según tipo documental.

**No inventar conclusiones legales.** La investigación debe apoyarse en fuentes
oficiales (Secretaría de Salud, Tribunal Supremo Electoral, Congreso Nacional,
leyes vigentes en Honduras). El resultado es **una propuesta de política** que
el despacho aprueba antes de activarse.

### 21.2 Política configurable

El sistema debe permitir una **política configurable** de retención, archivo y
eliminación segura, con reglas aprobadas por el despacho:

- Tiempo de conservación por tipo documental / estado del expediente.
- Migración a almacenamiento más económico tras `finalizado` / `archivado`.
- Eliminación segura (soft delete + purga tras ventana aprobada).
- Exportación o entrega al cliente al cierre.
- Logs de destrucción con hash previo y responsable.

### 21.3 Estado

**NO VALIDADO** hasta completar la investigación normativa y la aprobación del
despacho.

---

## 22. Seguridad, privacidad y gobierno

### 22.1 Rutas privadas

- `/intranet/sgie/*`: sólo autenticados con rol autorizado y scope por abogado.
- `/intranet/admin/usuarios`: sólo rol `admin`.
- `/api/sgie/*`: sólo sesión interna; protegido por proxy + JWT.
- `/cargar/{token}`: pública por token, no indexable, sin revelar datos más
  allá de lo estrictamente necesario.

### 22.2 Enlaces mágicos

- Token aleatorio de 256 bits.
- Expiración obligatoria.
- Máximo de usos configurable.
- Revocación manual.
- Scope a expediente/requisito.
- Rate limit por IP y token.
- Auditoría de apertura y carga.

### 22.3 Documentos

- No exponer URLs públicas permanentes.
- Acceso firmado o mediado por API autorizada.
- Validación MIME/tamaño/magic bytes.
- Rechazo de extensiones peligrosas.
- Hash antes de procesar.
- Política de retención definida por el despacho (§21).
- Acceso por expediente y rol (scope).

### 22.4 IA y confidencialidad

- No enviar documentos innecesarios al proveedor.
- Un documento por llamada.
- No enviar expedientes completos si no hace falta.
- Minimizar datos en prompts.
- Registrar proveedor/modelo usado.
- Permitir modo `heuristic` o `disabled` si no hay autorización para IA externa.
- Evaluar contrato, región y política de tratamiento de datos del proveedor
  antes de producción.

---

## 23. Arquitectura técnica sobre la intranet actual

### 23.1 Estructura propuesta

```txt
app/
  intranet/
    sgie/                    # panel del abogado (módulo SGIE)
      page.tsx               # cockpit abogado
      expedientes/
      documentos/
      alertas/
      tareas/
      agenda/
      correos/
    admin/
      usuarios/              # módulo Usuarios / Accesos
      procedimientos/
      plantillas/
      reglas/
      retencion/
  api/
    sgie/                    # APIs internas SGIE
    public/
      cargar/                # endpoints por token
lib/
  sgie/
    usuarios-db.ts
    clientes-db.ts
    expedientes-db.ts
    procedimientos-db.ts
    documentos-db.ts
    enlaces-magicos.ts
    motor-documental.ts
    motor-reglas.ts
    motor-confianza.ts
    ia-documental.ts        # capa IA configurable (DeepSeek)
    ocr.ts
    aprendizaje.ts
    automatizaciones.ts
    email-sgie.ts
    agenda.ts
    auditoria-sgie.ts
    retencion.ts
components/
  sgie/
    cockpit-abogado.tsx
    expediente-review.tsx
    checklist-documental.tsx
    documento-viewer.tsx
    campos-extraidos.tsx
    alertas-panel.tsx
    admin-usuarios.tsx
```

### 23.2 Procesamiento asíncrono

Fase inicial:

- Tabla `jobs_sgie` en DB.
- Vercel Cron con `CRON_SECRET`.
- Jobs idempotentes (clave por `job_tipo + ref_id + ventana`).
- Procesamiento por lotes pequeños.

Fase escalada (futura opcional):

- Cola/worker externo para OCR e IA pesada.
- Reintentos con backoff.
- Dead-letter queue.
- Dashboard de jobs fallidos.

**Regla técnica:** no ejecutar OCR o análisis IA pesado dentro de route
handlers que deban responder al usuario.

### 23.3 Endpoints iniciales

| Endpoint | Uso |
|---|---|
| `GET /api/sgie/expedientes` | Listado privado (scope por abogado) |
| `POST /api/sgie/expedientes` | Crear expediente |
| `GET /api/sgie/expedientes/:id` | Detalle (verifica scope) |
| `PATCH /api/sgie/expedientes/:id` | Actualizar |
| `POST /api/sgie/expedientes/:id/checklist/confirmar` | Activar checklist |
| `POST /api/sgie/enlaces` | Crear enlace mágico |
| `POST /api/sgie/enlaces/:id/revocar` | Revocar enlace |
| `POST /api/public/cargar/:token` | Subir documento |
| `POST /api/sgie/documentos/:id/procesar` | Encolar procesamiento |
| `POST /api/sgie/documentos/:id/aprobar` | Aprobar documento |
| `POST /api/sgie/documentos/:id/rechazar` | Rechazar documento |
| `POST /api/sgie/expedientes/:id/validar` | Validación final abogado |
| `POST /api/sgie/expedientes/:id/firma` | Mandar a firma |
| `PATCH /api/admin/usuarios/:id/rol` | Cambiar rol (admin) |
| `PATCH /api/admin/usuarios/:id/bloqueo` | Activar/desactivar (admin) |
| `GET /api/admin/usuarios` | Lista y último acceso (admin) |
| `PATCH /api/admin/reglas/config` | Reajustar reglas/umbrales (admin) |

Todos los endpoints de escritura usan Zod, auditoría y control de rol.

---

## 24. Backlog técnico por fases (Fase 0–10)

Cada fase incluye: **entregables**, **criterios de aceptación**, **tablas
nuevas o modificadas**, **endpoints**, **componentes UI**, **riesgos** y
**tests**.

### Fase 0 — Decisiones y mapa operativo

**Duración:** 1–2 semanas. **Objetivo:** no programar a ciegas.

**Entregables:**

- Mapa real de procedimientos prioritarios, generado desde el catálogo del
  sitio (`/servicios-juridicos`).
- Lista de documentos por procedimiento.
- Plantillas de correo iniciales (texto base).
- Política de retención preliminar (sujeta a investigación legal posterior).
- Umbrales de confianza IA preliminares.
- Decisión de cola/worker (Vercel Cron + `jobs_sgie` en MVP).
- Decisión de IA externa y proveedor (DeepSeek V4 Flash como inicial).
- Definición de MVP por escrito.

**Criterios de aceptación:**

- Documento de decisiones aprobado por el despacho.
- Sin código de producción.

**Tablas/Endpoints/UI:** ninguno. **Riesgos:** decisiones retrasan fases
posteriores. **Tests:** N/A.

### Fase 1 — Datos y roles SGIE

**Duración:** 2–3 semanas.

**Entregables:**

- Nuevas tablas Drizzle aditivas (schema SGIE base).
- CRUD básico de procedimientos.
- Seeds iniciales generados desde el catálogo, marcados como
  `pendiente_validacion_legal`.
- Auditoría extendida con acciones SGIE.

**Criterios de aceptación:**

- `npx drizzle-kit generate` pasa.
- Sin tocar motor de cálculo ni web pública.
- `npm run lint && npm run build && npm test` pasan.

**Tablas nuevas:** `tipos_procedimiento`, `clientes`, `expedientes` (esqueleto),
`requisitos_expediente`, `historial_expediente`, extensión de
`auditoria_eventos`. **Endpoints:** sin endpoints públicos aún. **UI:** sin UI.
**Riesgos:** modelo de datos insuficiente → revisión de Fase 3. **Tests:**
tests de schema y permisos.

### Fase 2 — Panel admin de Usuarios / Accesos y rol abogado

**Duración:** 2–3 semanas.

**Entregables:**

- Módulo admin **Usuarios / Accesos** completo:
  - Listado con correos registrados y último acceso.
  - Activar/desactivar usuarios.
  - Asignar/quitar rol `abogado`.
  - Vincular abogado a correo `@pinedayasociadoshn.com`.
  - Bloquear acceso.
  - Ver expedientes asignados por abogado.
  - Auditar cambios de rol.
- Acceso por rol `abogado`: al entrar en la intranet, ve módulo SGIE completo
  (inclusión de rutas/menús; fases posteriores llenan contenido).
- Scope base por abogado (interfaz; aplicación real en Fase 3+).

**Criterios de aceptación:**

- Admin activa, desactiva, asigna rol y bloquea usuario; todo se audita.
- Abogado entra y ve el menú SGIE; ve placeholders de módulos.
- Usuario bloqueado no puede acceder; sesión se revoca.

**Tablas nuevas/modificadas:** `usuarios_sgie` (o extensión), `expediente_permisos`.
**Endpoints:** `GET /api/admin/usuarios`, `PATCH /api/admin/usuarios/:id/rol`,
`PATCH /api/admin/usuarios/:id/bloqueo`. **Componentes UI:**
`app/intranet/admin/usuarios/page.tsx`, `components/sgie/admin-usuarios.tsx`.
**Riesgos:** sesión activa persiste tras bloqueo → invalidación centralizada.
**Tests:** tests e2e de cambio de rol, bloqueo y auditoría.

### Fase 3 — Expedientes, clientes y checklist

**Duración:** 3–4 semanas.

**Entregables:**

- Panel `/intranet/sgie/`.
- CRUD de clientes con detección de duplicados.
- Crear expediente (número interno, área, prioridad, responsable).
- Instanciar checklist por procedimiento (versión anclada).
- Asignación abogado ↔ expediente (`expediente_asignaciones`).
- Scope por abogado aplicado en queries y endpoints.
- Historial básico.

**Criterios de aceptación:**

- Abogado crea cliente + expediente + checklist y queda anclado a la versión.
- Admin no pierde acceso a panel existente.
- No hay filtración entre abogados (un abogado no lista expedientes ajenos).

**Tablas:** `expedientes` (completa), `expediente_asignaciones`,
`clientes` (completa). **Endpoints:** `GET/POST /api/sgie/expedientes`,
`GET/PATCH /api/sgie/expedientes/:id`, `POST .../checklist/confirmar`.
**Componentes UI:** `app/intranet/sgie/page.tsx`,
`expedientes/[id]/page.tsx`, `checklist-documental.tsx`. **Riesgos:** datos de
ejemplo inventados como requisitos legales → usar `pendiente_validacion_legal`.
**Tests:** tests de scope, fixture de procedimientos, integración.

### Fase 4 — Enlaces mágicos y carga documental

**Duración:** 3–4 semanas.

**Entregables:**

- Generar/revocar enlaces mágicos (token 256 bits, expiración, usos máximos).
- Portal `/cargar/{token}` (público por token, no indexable).
- Upload a Vercel Blob (rutas privadas).
- Validación de tamaño, MIME, magic bytes, hash SHA-256.
- Detección de duplicados por hash (sin procesar IA/OCR).
- Notificación interna al abogado.
- Rate limiting por IP y token.

**Criterios de aceptación:**

- Cliente sube documentos sin cuenta.
- Token vencido/revocado/agotado no funciona.
- Documento queda asociado al expediente/requisito correcto con hash.
- Si hash ya existe, se marca `duplicado` y no se lanza IA.

**Tablas:** `enlaces_magicos`, `documentos_expediente`. **Endpoints:**
`POST /api/sgie/enlaces`, `POST /api/sgie/enlaces/:id/revocar`,
`POST /api/public/cargar/:token`. **Componentes UI:** portal cliente
`app/cargar/[token]/page.tsx`. **Riesgos:** tokens filtrados → expiración corta
+ usos máximos; MIME spoofing → magic bytes. **Tests:** e2e de carga, token
vencido, duplicados, rate limit.

### Fase 5 — Correos y comunicación automatizada

**Duración:** 2–3 semanas.

**Entregables:**

- Plantillas administrables (solicitud, acuse, faltantes, recordatorio, enlace
  expirado, rechazado, reemplazo, en revisión, cita/audiencia, cierre).
- Envío por fase vía Resend.
- Recordatorios configurables (frecuencia, máximos, ventanas).
- Registro de correos con idempotencia.
- Cron básico idempotente.
- Alerta interna si correo crítico falla.

**Criterios de aceptación:**

- Ningún correo duplicado por el mismo evento.
- Fallos de email generan alerta interna.
- Recordatorios respetan configuración de frecuencia.

**Tablas:** `plantillas_correo`, `correos_enviados` (con UNIQUE idempotencia).
**Endpoints:** plantillas CRUD (admin),
`POST /api/sgie/expedientes/:id/correoPreview`. **Componentes UI:**
`app/intranet/admin/plantillas/page.tsx`, editor con preview. **Riesgos:**
spam percepción → configuración anti-duplicado estricta. **Tests:** idempotencia
de correos, rate limit por destinatario, fallback Resend.

### Fase 6 — Motor documental (texto, clasificación, estados)

**Duración:** 3–4 semanas.

**Entregables:**

- Extracción de texto (PDF con capa de texto).
- Clasificación heurística (regex/formatos).
- Estados documentales completos (§12.3).
- Cache por hash (no re-procesar duplicados).
- Jobs de procesamiento (`jobs_sgie`).
- OCR selectivo: en esta fase se marca `ilegible` y se pide reemplazo; el
  proveedor/motor de OCR se decide en Fase 7.

**Criterios de aceptación:**

- Documento con texto queda `texto_extraido` sin OCR.
- Documento sin texto queda `ocr_pendiente`/`ilegible`.
- Duplicados no se re-procesan.

**Tablas:** `extracciones_ia` (esqueleto), `jobs_sgie`. **Endpoints:**
`POST /api/sgie/documentos/:id/procesar`. **Componentes UI:**
`documento-viewer.tsx`. **Riesgos:** OOM en serverless → jobs por lotes pequeños.
**Tests:** clasificación heurística, cache por hash, estados.

### Fase 7 — IA / OCR con DeepSeek

**Duración:** 4–6 semanas.

**Entregables:**

- Capa IA configurable (`ia-documental.ts`) con DeepSeek V4 Flash.
- Variables de entorno (`IA_DOCUMENTAL_*`).
- Modos `heuristic`/`ai`/`disabled`.
- JSON estricto validado por Zod.
- Campos extraídos con confianza inicial y cita fuente.
- OCR selectivo (si se decide proveedor); si no, mantener `ilegible`.
- Jobs asíncronos; no en route handlers.
- Logs de tokens, proveedor, modelo, duración, estado.
- Anti-alucinación: prompt restrictivo, cita obligatoria, `null` si no está.

**Criterios de aceptación:**

- Un documento por llamada IA.
- Sin auto-aprobación.
- Fallo IA no rompe expediente (fallback `pendiente_abogado`).
- Coste y tokens medidos por expediente.

**Tablas:** `campos_extraidos`, `extracciones_ia` (completa). **Endpoints:**
`POST /api/sgie/documentos/:id/iaExtraer` (interno, job). **Componentes UI:**
`campos-extraidos.tsx`. **Riesgos:** alucinación legal → prompt + Zod + reglas
deterministas; coste → cache + no reprocesar duplicados. **Tests:** JSON
schema, fallback, límite de reintentos.

### Fase 8 — Reglas y confianza

**Duración:** 4–6 semanas.

**Entregables:**

- Motor de reglas determinista, idempotente y auditable.
- Severidades `info`/`advertencia`/`error`/`critico`.
- Reglas de completitud, vencimientos, duplicados, incoherencias, formatos,
  documentos obligatorios/condicionales, estados.
- Motor de confianza inteligente (evidencias combinadas, escala §14).
- Reajuste de reglas y umbrales desde panel admin con versionado y auditoría.
- Alertas generadas por reglas.

**Criterios de aceptación:**

- El motor detecta completitud, duplicados, vigencia y contradicciones.
- Repetir validación no duplica alertas.
- Admin reajusta un umbral; queda versionado y auditado.
- Confianza alta nunca ejecuta transición crítica sin abogado.

**Tablas:** `validaciones`, `alertas`, `confianza_resultados`,
`reglas_config_version`. **Endpoints:** `PATCH /api/admin/reglas/config`,
`POST /api/sgie/expedientes/:id/reglas/ejecutar`. **Componentes UI:**
`app/intranet/admin/reglas/page.tsx`, `alertas-panel.tsx`. **Riesgos:**
falsos positivos → backtesting antes de activar umbrales críticos. **Tests:**
idempotencia, suite de reglas por procedimiento, escala de confianza.

### Fase 9 — Cockpit del abogado

**Duración:** 3–4 semanas.

**Entregables:**

- Vista principal del cockpit (bandeja consolidada, §10.1).
- Pantalla de revisión de expediente (§10.2).
- Acciones rápidas (aprobar, rechazar, reemplazo, corregir, validar, mandar a
  firma, marcar en trámite).
- Agenda, plazos y bandejas operativas (§19).

**Criterios de aceptación:**

- El abogado valida desde una sola pantalla.
- Las transiciones críticas son manuales.
- Toda corrección re-ejecuta reglas y confianza afectadas.
-ificaciones entran en `historial_expediente` y `auditoria_eventos`.

**Tablas:** (uso de las ya creadas) `tareas`, `eventos_agenda`. **Endpoints:**
`POST .../aprobar`, `.../rechazar`, `.../validar`, `.../firma`. **Componentes
UI:** `cockpit-abogado.tsx`, `expediente-review.tsx`. **Riesgos:** baja
adopción → UX simple y bandeja única. **Tests:** e2e del flujo completo de
revisión a validación.

### Fase 10 — Métricas, auditoría y mejora continua

**Duración:** 3–5 semanas.

**Entregables:**

- Dashboard de productividad (expedientes por abogado, tiempos por fase).
- Dashboard de costes IA/storage/email por expediente.
- Exportación de auditoría con filtros.
- Aprendizaje controlado (registro de correcciones, detección de patrones,
  sugerencias de ajuste aprobadas por admin).
- Retención documental (investigación normativa Honduras + política
  configurable).
- Optimización de queries e índices.

**Criterios de aceptación:**

- El despacho ve cuellos de botella y ahorro real.
- Costes medidos contra proyección.
- Una sugerencia de ajuste requiere aprobación; al aprobarse, se aplica con
  backtesting y auditoría.
- Política de retención aprobada por el despacho y activa.

**Tablas:** `correcciones_ia`, `sugerencias_ajuste`, `retencion_politicas`.
**Endpoints:** dashboards (`GET /api/sgie/metricas/*`),
`POST /api/admin/sugerencias/:id/aprobar`. **Componentes UI:**
`app/intranet/admin/metricas/page.tsx`, `retencion/page.tsx`. **Riesgos:**
aplicar ajustes automáticos sin control → siempre aprobación humana.
**Tests:** backtest reproducible, exportación de auditoría, políticas de
retención.

---

## 25. Plan de 30 / 60 / 90 / 180 días

### Primeros 30 días — Base operativa

- Aprobar decisiones de Fase 0.
- Generar procedimientos desde el catálogo del sitio (Fase 0/1).
- Implementar Fase 1 (datos) y Fase 2 (Usuarios / Accesos).
- Activar auditoría SGIE básica.

Resultado: usuarios y accesos gestionados; modelo de datos listo.

### Días 31–60 — Expedientes y documentación

- Fase 3: expedientes, clientes y checklist.
- Fase 4: enlaces mágicos y carga documental.

Resultado: el sistema empieza a pedir y recibir documentos sin trabajo manual
constante.

### Días 61–90 — Comunicación y motor documental

- Fase 5: correos por fase.
- Fase 6: motor documental.

Resultado: correos automáticos, documentos clasificados y con texto extraído.

### Días 91–180 — IA, reglas y cockpit

- Fase 7: IA/OCR DeepSeek.
- Fase 8: reglas y confianza.
- Fase 9: cockpit abogado.
- Fase 10 (parcial): métricas iniciales y registro de correcciones.

Resultado: el abogado revisa un expediente preparado; el sistema opera el ciclo
documental completo y aprende de forma controlada.

---

## 26. Métricas de éxito

### 26.1 Operativas

- Tiempo promedio desde apertura a checklist aprobado.
- Tiempo promedio de recepción documental.
- Porcentaje de expedientes con documentos completos.
- Porcentaje de documentos rechazados por ilegibles/incorrectos.
- Número de correos automáticos enviados.
- Número de recordatorios que evitaron atraso.
- Expedientes atascados por fase.

### 26.2 IA y calidad

- Porcentaje de documentos clasificados automáticamente.
- Porcentaje de campos extraídos con confianza alta.
- Porcentaje de campos corregidos por abogado.
- Tasa de fallos IA.
- Coste IA por expediente.
- Tiempo de procesamiento por documento.

### 26.3 Negocio

- Expedientes activos por abogado.
- Tiempo administrativo por expediente.
- Tiempo hasta expediente listo para revisión.
- Tasa de clientes que completan carga sin intervención manual.
- Ahorro estimado de horas por mes.

---

## 27. Costes y control financiero

### 27.1 Principio

El coste se mide, no se asume. Las tarifas de IA, hosting, storage, email y OCR
se re-verifican antes de implementar y se monitoreán en producción.

### 27.2 Fórmulas de control

- Documentos/mes = expedientes/mes × documentos promedio.
- Storage mensual = documentos/mes × MB promedio.
- IA input = documentos procesados × tokens input promedio.
- IA output = documentos procesados × tokens output promedio.
- OCR = páginas escaneadas × coste por página.
- Email = correos por expediente × expedientes/mes.

### 27.3 Estrategias de ahorro

- No procesar duplicados (hash).
- Cache por hash.
- Extraer texto sin IA cuando el PDF ya tiene capa de texto.
- OCR sólo cuando sea necesario.
- Prompt estable para aprovechar caching del proveedor si existe.
- Limitar reintentos.
- Procesar por lotes pequeños.
- Archivar expedientes finalizados (retención configurable).
- Medir coste por expediente en dashboard.

### 27.4 Escenarios a calcular antes de producción

| Escenario | Expedientes/mes | Documentos/expediente | Uso esperado |
|---|---:|---:|---|
| Pequeño | 20 | 6–8 | MVP controlado |
| Medio | 100 | 8–10 | Operación normal del despacho |
| Alto | 500 | 10–12 | Escalado con worker/cola |

Los importes concretos quedan como **NO VALIDADOS** hasta consultar precios
oficiales vigentes.

---

## 28. Riesgos y mitigaciones

| Riesgo | Impacto | Mitigación |
|---|---|---|
| IA inventa dato legal | Alto | Cita fuente, confianza, Zod, reglas deterministas, revisión humana |
| Mezcla de expedientes | Crítico | Un documento/expediente por llamada, sin memoria cruzada |
| Pérdida de plazo | Alto | Fechas → tareas/eventos, resumen diario, alertas |
| Filtración de documentos | Crítico | Proxy, tokens, URLs privadas, auditoría, rate limit, scope por abogado |
| Correos duplicados | Medio | Idempotencia por evento/ventana |
| OCR/IA causa timeout | Medio | Jobs, cron, worker, no procesar pesado en request |
| Procedimiento mal definido | Alto | Versionado y validación legal antes de activar |
| Coste crece sin control | Medio | Dashboard de coste, límites, cache, OCR selectivo |
| Abogado no adopta cockpit | Alto | UI simple, bandeja única, acciones rápidas |
| Cliente no usa portal | Medio | Correos claros, enlaces simples, carga móvil |
| Exposición SEO de rutas privadas | Crítico | Noindex, robots, sitemap excluyente, sin enlaces públicos |
| Cambio de rol sin auditoría | Alto | Auditoría de gobernanza extendida en `auditoria_eventos` |
| Ajuste automático de reglas | Crítico | Sin auto-modificación; aprobación humana obligatoria |
| Retención no conforme a ley | Alto | Investigación normativa Honduras + política aprobada por despacho |

---

## 29. Decisiones que debe tomar el despacho

Antes de programar fases avanzadas, Pineda y Asociados debe decidir:

1. **¿Cuáles son los procedimientos prioritarios para el MVP?**  
   Respuesta previa del despacho: generar un procedimiento por cada servicio
   del catálogo del sitio (`/servicios-juridicos`), por rama del derecho y por
   servicio concreto. Son modificables después.

2. **¿Qué documentos requiere cada procedimiento y quién los valida legalmente?**  
   Respuesta previa: de momento el despacho + IA; al estar creados como sistema
   modificable, no será un problema.

3. **¿Qué datos se consideran críticos y requieren confirmación humana siempre?**  
   Respuesta previa: con reglas y métricas de confianza bien diseñadas, ningún
   dato es crítico en sí; el motor debe diseñarse para no fallar mediante reglas
   y escalas de confianza adecuadas.

4. **¿Qué umbrales de confianza se aceptan para cada tipo de dato?**  
   Respuesta previa: la confianza se establece en función de la coherencia de
   los datos extraídos con el expediente; múltiples coincidencias aumentan la
   confianza (ver §14).

5. **¿Se permite enviar documentos a un proveedor externo de IA?**  
   Respuesta previa: se actualizarán las políticas y se usará OCR/IA.

6. **¿Qué proveedor/modelo se usará inicialmente y bajo qué contrato?**  
   Respuesta previa: DeepSeek V4 Flash o un modelo inferior que cumpla la
   función (ver §13).

7. **¿Se requiere OCR desde el MVP?**  
   Resolución: en MVP (Fase 6) se marca `ilegible` y se pide reemplazo. El
   proveedor/motor de OCR se decide en Fase 7; si se decide, se integra con
   jobs asíncronos y anti-alucinación.

8. **¿Cuántos días duran los enlaces mágicos?**  
   Respuesta previa: varios días, para dar tiempo al cliente a subir la
   documentación. Configurable por admin.

9. **¿Cada cuánto se envían recordatorios al cliente?**  
   Respuesta previa: estudiar métricas para no ser demasiado insistentes pero
   mostrar que el despacho está pendiente. Configurable por admin.

10. **¿Cuál es la política de retención documental?**  
    Respuesta previa: investigar la ley de Honduras y adaptar el plan para
    guardar documentación sensible (posiblemente en almacenamiento más
    económico tras `finalizado`/`archivado`). Ver §21.

11. **¿Quién puede ver expedientes de otros abogados?**  
    Respuesta previa: cada abogado tendrá correo `@pinedayasociadoshn.com` y
    acceso sólo a sus clientes. El admin puede conceder permiso adicional
    (ver §6.2).

12. **¿Qué eventos de agenda deben confirmarse manualmente?**  
    Respuesta previa: el reto está en el sistema de reglas y determinación de
    confianza para que el sistema actúe o pida revisión humana.

13. **¿Qué plantillas de correo aprueba el despacho?**  
    Respuesta previa: el sistema diseñará un conjunto de plantillas
    administrables (ver §18.2); el despacho las aprueba desde el panel.

14. **¿Qué métricas se revisarán semanalmente?**  
    Respuesta previa: la clave es el sistema de reglas y determinación de
    confianza por coincidencias; los valores se ajustan con el tiempo. Se desea
    aprendizaje automático para mejorar la precisión (ver §16).

15. **¿Cuándo se considera un expediente "listo para firma"?**  
    Resolución propuesta: cuando el expediente está en estado `validado`, sin
    alertas con severidad `error` o `critico` abiertas, con checklist de
    documentos obligatorios completo y aprobado, y la decisión de firma es
    tomada explícitamente por el abogado desde el cockpit.

---

## 30. Reglas de implementación

- **Cambios aditivos**: no romper lo existente.
- **Mantener rutas privadas fuera de SEO**: `/intranet/sgie/*`, `/cargar/{token}`
  no aparecen en sitemap, robots, schemas ni enlaces públicos.
- **Proteger `/api/sgie/*` y `/api/admin/*` con proxy + JWT + control de rol**.
- **Zod en todos los endpoints de escritura**.
- **Auditar cambios críticos**: rol, permisos, reglas, umbrales, validación,
  firma, rechazo, reemplazo, bloqueo.
- **No ejecutar IA/OCR pesado dentro de route handlers**: usar jobs/cron
  idempotentes.
- **Jobs idempotentes**: clave por `job_tipo + ref_id + ventana`.
- **Medir costes por expediente**: tokens IA, storage, email; visible en
  dashboard.
- **Mantener seguridad de documentos privados**: Blob con rutas privadas,
  acceso mediado por API autorizada, hash antes de procesar, no reprocesar
  duplicados.
- **No auto-modificar reglas críticas en producción**: aprendizaje controlado
  con aprobación humana.
- **No añadir proveedores**: perfeccionamos el stack actual; proveedores extra
  quedan como fase futura opcional.
- **Actualizar `README.md` y `CHANGELOG.md` sólo cuando aplique por cambios
  reales de implementación**.
- **Commits atómicos**: un cambio lógico por commit, mensaje en español con
  prefijo (`feat:`, `fix:`, `docs:`, `chore:`, `refactor:`, `test:`,
  `sgie:`).
- **Validar tras el cambio**: `npm run lint && npm run build && npm test` por
  defecto; `npx drizzle-kit generate` para schema; tests e2e para flujos.

---

## 31. Criterios de aceptación globales

El SGIE Autopilot estará listo para considerarse operativo cuando:

1. Un abogado pueda crear un expediente con checklist en menos de 3 minutos.
2. El sistema pueda solicitar documentos al cliente sin redactar correos
   manuales.
3. El cliente pueda subir documentos sin cuenta y sin intervención del despacho.
4. Todo documento quede asociado a expediente, requisito, hash, estado, origen y
   trazabilidad.
5. El sistema detecte faltantes y envíe recordatorios sin duplicados.
6. La IA extraiga campos con confianza y cita fuente, sin auto-aprobar y sin
   inventar datos legales.
7. El motor de reglas detecte completitud, duplicados, vigencia y
   contradicciones; sus umbrales son reajustables desde el panel admin.
8. El motor de confianza inteligente clasifique evidencias en la escala 0–100.
9. El abogado vea una pantalla consolidada (cockpit) para validar.
10. Toda acción crítica quede en historial y auditoría.
11. Las rutas privadas no aparezcan en sitemap, robots públicos, schemas ni
    enlaces públicos.
12. Los costes por expediente puedan medirse.
13. Las transiciones críticas dependan siempre del abogado.
14. El admin pueda gestionar usuarios, roles, vínculos de correo y permisos con
    auditoría.
15. Cada abogado sólo acceda a sus clientes y expedientes asignados, salvo
    permiso adicional concedido por admin.
16. El aprendizaje controlado registre correcciones y proponga ajustes sujetos
    a aprobación humana.
17. La política de retención documental esté investigada, aprobada y activa.

---

## 32. Formato de respuesta final por fase

Cada fase, al cerrarse, debe reportar:

```
Porcentaje completado:
Porcentaje restante:
Archivos modificados:
Comandos ejecutados:
Resultado de cada comando:
Errores corregidos:
Riesgos pendientes:
NO VALIDADO:
Próximo paso recomendado:
```

---

*Fin del plan de acción SGIE Autopilot — versión 4.0.*