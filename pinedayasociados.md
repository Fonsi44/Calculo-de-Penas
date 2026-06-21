# Pineda y Asociados — Plan de Acción SGIE Autopilot

> **Documento maestro de transformación operativa.**  
> Versión 3.0 — Plan futurista, realista y ejecutable para convertir a Pineda y
> Asociados en un bufete con gestión documental automatizada y asistida por IA.
>
> **Objetivo central:** que el abogado dedique su tiempo a **validar, decidir,
> asesorar y firmar**. El sistema debe encargarse del resto: completar
> expedientes, pedir documentos, recibir archivos, clasificarlos, extraer datos,
> validar coherencia, detectar faltantes, generar tareas, enviar correos por fase,
> proponer agenda, preparar el expediente y dejar trazabilidad completa.
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
3. Visión futurista pero realista
4. Estado de partida y restricciones reales
5. Objetivos medibles
6. Modelo operativo objetivo
7. Niveles de automatización del bufete
8. Flujo extremo a extremo del expediente
9. Mapa de módulos del SGIE Autopilot
10. Cockpit del abogado
11. Base de procedimientos y checklists inteligentes
12. Motor documental
13. Motor de IA documental
14. Motor de reglas y validación
15. Automatizaciones por fase
16. Comunicación automática con clientes
17. Agenda, plazos y tareas
18. Datos, almacenamiento y trazabilidad
19. Seguridad, privacidad y gobierno
20. Arquitectura técnica sobre la intranet actual
21. Estrategia de implementación por fases
22. Plan de 30 / 60 / 90 / 180 días
23. Métricas de éxito
24. Costes y control financiero
25. Riesgos y mitigaciones
26. Decisiones que debe tomar el despacho
27. Criterios de aceptación globales

---

## 1. Resultado esperado

Pineda y Asociados debe evolucionar de una operación basada en correos,
WhatsApp, carpetas, recordatorios manuales y revisión documento por documento a
una **fábrica inteligente de expedientes jurídicos**.

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

### 2.1 Lo que debe hacer el sistema

El sistema debe asumir toda tarea repetible, verificable y trazable:

- Crear expediente desde una solicitud o registro manual.
- Identificar si el cliente ya existe.
- Sugerir el procedimiento jurídico aplicable.
- Crear checklist documental según procedimiento.
- Generar enlaces seguros de carga documental.
- Enviar correos automáticos al cliente.
- Recibir documentos sin que el cliente tenga cuenta.
- Validar tipo, tamaño, MIME, hash y duplicados.
- Extraer texto del documento.
- Clasificar el documento.
- Extraer campos con IA y/o heurísticas.
- Guardar cada campo con confianza y cita fuente.
- Validar reglas deterministas.
- Detectar faltantes, vencimientos, contradicciones e ilegibles.
- Crear tareas y alertas.
- Proponer eventos de agenda.
- Preparar resumen ejecutivo del expediente.
- Medir completitud y riesgo.
- Construir la bandeja de revisión del abogado.

### 2.2 Lo que debe hacer el abogado

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

La IA y las automatizaciones **nunca** deben aprobar, firmar, presentar, cerrar
un expediente ni tomar decisiones jurídicas finales. El sistema prepara; el
abogado decide.

---

## 3. Visión futurista pero realista

La visión futurista no consiste en prometer un “abogado robot”. Consiste en
construir un despacho donde cada expediente tenga un **copiloto operativo**:

1. **Un orquestador de expediente** que sabe en qué fase está cada caso.
2. **Un bibliotecario documental** que recibe, clasifica, nombra y ordena
   documentos.
3. **Un extractor de datos** que lee documentos y llena campos estructurados.
4. **Un validador de reglas** que comprueba coherencia, completitud y vigencia.
5. **Un mensajero automático** que envía correos y recordatorios por fase.
6. **Un gestor de agenda** que propone plazos, audiencias y tareas.
7. **Un auditor** que registra cada acción y permite reconstruir el expediente.

Estos “copilotos” no son agentes autónomos sin control. Son módulos del sistema,
con permisos limitados, reglas deterministas y supervisión humana.

---

## 4. Estado de partida y restricciones reales

### 4.1 Stack actual aprovechable

El repositorio actual ya ofrece una base adecuada:

| Capa | Estado actual | Aprovechamiento para SGIE |
|---|---|---|
| Framework | Next.js App Router | Panel interno, APIs y portal de carga |
| DB | Neon PostgreSQL + Drizzle ORM | Nuevas tablas SGIE |
| Auth | JWT + bcrypt, roles `admin` / `abogado` | Acceso privado y scope por abogado |
| Storage | Vercel Blob | Documentos y texto extraído |
| Email | Resend | Correos transaccionales por fase |
| Auditoría | `auditoria_eventos` | Extender con acciones SGIE |
| Seguridad | proxy, CSP, Zod, rate limit | Extender a `/api/sgie/*` y carga pública |

### 4.2 Restricciones que no se deben ignorar

- Vercel serverless no es adecuado para procesos largos de OCR/IA dentro de un
  request. El procesamiento pesado debe ir a cola, cron o worker.
- Las rutas de intranet y datos de expedientes son privadas. No deben aparecer
  en web pública, sitemap, robots, schemas ni enlaces públicos.
- Toda persistencia final debe estar en DB y object storage, no en archivos mock.
- No deben inventarse requisitos legales, plazos ni citas. Todo procedimiento se
  versiona y queda pendiente de validación legal hasta aprobación humana.
- Los proveedores de IA y sus precios cambian. El sistema debe usar una capa
  abstracta configurable, no depender rígidamente de un modelo concreto.

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

- Panel del abogado centrado en expedientes.
- Portal de carga documental sin cuenta para clientes.
- Checklists por procedimiento editables y versionados.
- Motor de extracción IA con confianza y cita fuente.
- Motor de reglas determinista.
- Automatización de correos por fase.
- Bandeja de validación y firma.

### 5.3 Objetivos de control

- Ningún expediente pasa a `validado`, `pendiente_de_firma`, `en_tramite`,
  `finalizado` o `archivado` sin acción explícita del abogado.
- Ningún campo extraído por IA se considera definitivo sin confirmación o sin
  regla de confianza aprobada.
- Ningún documento se re-procesa si su hash no cambió.
- Ningún correo automático se envía dos veces por el mismo disparador.

---

## 6. Modelo operativo objetivo

### 6.1 Roles

| Rol | Responsabilidad |
|---|---|
| Admin | Configura procedimientos, plantillas, permisos, auditoría y reportes |
| Abogado | Valida expedientes, documentos, campos, estrategia y firma |
| Asistente legal | Puede cargar documentos, corregir datos y preparar expedientes si se habilita |
| Cliente | Sube documentos por enlace mágico, sin cuenta |
| Sistema | Orquesta estados, correos, tareas, alertas, IA y reglas |

> En MVP pueden existir sólo `admin`, `abogado` y cliente por token. El rol
> `asistente legal` se puede activar después con RBAC fino.

### 6.2 RACI operativo

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

R = realiza, A = responsable final, C = consultado.

---

## 7. Niveles de automatización del bufete

El avance debe medirse por niveles, no por promesas abstractas.

| Nivel | Nombre | Descripción | Estado objetivo |
|---:|---|---|---|
| 0 | Manual | Correos, carpetas y revisión manual | Estado anterior |
| 1 | Digitalizado | Expedientes y documentos en sistema | Fase 2 |
| 2 | Guiado | Checklists, estados y tareas automáticas | Fase 3 |
| 3 | Automatizado | Correos, recordatorios, alertas y agenda propuesta | Fase 4 |
| 4 | Asistido por IA | Clasificación, extracción, resumen y validación preliminar | Fase 5–6 |
| 5 | Autopilot jurídico supervisado | Sistema prepara todo; abogado revisa, valida y firma | Fase 7+ |

El objetivo realista para la primera versión productiva es alcanzar el **Nivel
3** con bases sólidas, y luego subir a **Nivel 4** con IA controlada. El Nivel 5
se alcanza cuando el flujo completo es estable, medido y auditado.

---

## 8. Flujo extremo a extremo del expediente

### 8.1 Flujo canónico

1. **Entrada de solicitud**  
   Cliente contacta por web, teléfono, WhatsApp o presencial. El abogado o
   asistente registra la solicitud.

2. **Alta o detección de cliente existente**  
   El sistema valida identidad/RTN/correo/teléfono, detecta posibles duplicados
   y propone vincular o crear cliente.

3. **Selección de procedimiento**  
   El abogado elige un tipo de procedimiento. El sistema sugiere uno si el texto
   de la solicitud es suficiente, pero la selección final es humana.

4. **Creación de expediente**  
   Se genera número interno, responsable, área, prioridad, estado inicial,
   historial y auditoría.

5. **Checklist inteligente**  
   El sistema instancia los requisitos documentales del procedimiento vigente y
   muestra documentos requeridos, opcionales y condicionales.

6. **Confirmación del checklist**  
   El abogado aprueba o ajusta el checklist. Desde este punto el sistema puede
   operar automáticamente.

7. **Solicitud documental automática**  
   Se generan enlaces mágicos y se envía correo al cliente con instrucciones,
   vencimiento y lista clara de documentos.

8. **Carga segura del cliente**  
   El cliente sube archivos sin cuenta. El sistema valida token, tamaño, MIME,
   hash, magic bytes y almacena en Blob.

9. **Clasificación documental**  
   El sistema identifica tipo de documento por heurísticas y, si hace falta, IA.

10. **Extracción de datos**  
    Se extrae texto y se obtienen campos estructurados con confianza y cita
    fuente. Si no hay texto, se usa OCR selectivo o se marca ilegible.

11. **Validación de reglas**  
    Se revisa completitud, vigencia, formato, duplicados y coherencia entre
    documentos del mismo expediente.

12. **Automatizaciones de seguimiento**  
    Si faltan documentos, vencen enlaces o hay inconsistencias, el sistema envía
    correos, crea tareas y notifica al abogado.

13. **Cockpit de revisión**  
    El abogado ve resumen, checklist, documentos, datos extraídos, alertas,
    plazos, tareas y evidencia fuente en una sola pantalla.

14. **Validación y firma**  
    El abogado corrige, aprueba/rechaza, valida y firma. El sistema registra
    todo y cambia estado sólo por acción humana.

15. **Trámite y seguimiento**  
    El sistema mantiene tareas, agenda, recordatorios y comunicaciones.

16. **Cierre y archivo**  
    El abogado cierra. El sistema aplica retención documental y archivado.

### 8.2 Estados principales

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

| Módulo | Propósito | Prioridad |
|---|---|---|
| Clientes | Maestro de personas, duplicados, contacto | P0 |
| Expedientes | Unidad central de trabajo | P0 |
| Procedimientos | Catálogo versionado de servicios y requisitos | P0 |
| Checklist | Instancia documental por expediente | P0 |
| Enlaces mágicos | Carga externa sin cuenta | P1 |
| Documentos | Storage, metadatos, hash, estados | P1 |
| Plantillas de correo | Comunicación automatizada | P1 |
| Automatizaciones | Disparadores, jobs, idempotencia | P1 |
| IA documental | Clasificación, extracción, resumen | P2 |
| OCR | Sólo si documento no tiene texto | P2 |
| Motor de reglas | Validación determinista | P2 |
| Cockpit abogado | Revisión y validación consolidada | P2 |
| Agenda / tareas | Plazos, audiencias, seguimiento | P2/P3 |
| Reportes | Productividad, costes, cuellos de botella | P3 |
| Auditoría avanzada | Exportación, filtros, cumplimiento | P3 |

---

## 10. Cockpit del abogado

El cockpit es la pieza que hace real el objetivo de delegar todo lo operativo.
Debe evitar que el abogado abra diez pantallas o revise archivo por archivo.

### 10.1 Vista principal

- Bandeja “Listos para validar”.
- Expedientes en rojo por vencimiento o inconsistencia.
- Documentos pendientes de aprobación.
- Correos fallidos o clientes sin respuesta.
- Próximos plazos y audiencias.
- Tareas asignadas.

### 10.2 Pantalla de revisión de expediente

Debe mostrar:

1. **Resumen ejecutivo**: cliente, procedimiento, estado, riesgo, completitud y
   próximos pasos.
2. **Checklist documental**: requerido/opcional, recibido/faltante, aprobado,
   rechazado o vencido.
3. **Documentos**: visor, metadatos, hash, estado, tipo clasificado.
4. **Campos extraídos**: valor, confianza, cita fuente, documento origen.
5. **Alertas**: faltantes, baja confianza, contradicciones, vencimientos.
6. **Plazos y agenda**: fechas detectadas y eventos propuestos.
7. **Tareas**: automáticas y manuales.
8. **Historial**: línea de tiempo del expediente.
9. **Acciones finales**: validar, enviar a firma, marcar en trámite, finalizar.

### 10.3 Acciones rápidas

- Aprobar documento.
- Rechazar documento con motivo.
- Solicitar reemplazo con un clic.
- Confirmar campo extraído.
- Corregir campo extraído.
- Resolver alerta.
- Crear tarea manual.
- Confirmar evento de agenda.
- Generar correo desde plantilla.

---

## 11. Base de procedimientos y checklists inteligentes

### 11.1 Función

La base de procedimientos convierte el conocimiento operativo del despacho en
flujos reutilizables. No es una lista estática: es el cerebro declarativo del
SGIE.

### 11.2 Estructura mínima

Cada procedimiento debe tener:

- Nombre, slug, área jurídica, descripción.
- Versión y estado (`borrador`, `activo`, `desactivado`).
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
- Los seeds iniciales deben marcarse como `pendiente_validacion_legal` hasta que
  un abogado los apruebe.
- El admin gestiona el catálogo; el abogado lo consume y puede ajustar el
  checklist sólo dentro de un expediente concreto.

### 11.4 Ejemplo no normativo

Procedimiento: “Divorcio voluntario”.

- Documentos requeridos: acta de matrimonio, identidades, propuesta de convenio,
  actas de nacimiento de hijos si aplica.
- Campos esperados: nombres, identidades, fecha de matrimonio, hijos, domicilio.
- Reglas: coincidencia de identidades, presencia de documentos requeridos,
  legibilidad, vigencia si el despacho la exige.
- Estado legal: pendiente de validación por abogado antes de activar.

---

## 12. Motor documental

### 12.1 Responsabilidades

- Recibir archivos.
- Validar seguridad básica.
- Guardar originales en object storage.
- Registrar metadatos en DB.
- Calcular hash SHA-256.
- Detectar duplicados.
- Extraer texto si existe.
- Enviar a OCR sólo si es necesario.
- Clasificar documento.
- Mantener estados.

### 12.2 Estados de documento

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

### 12.3 Reglas técnicas mínimas

- Tamaño máximo configurable.
- MIME permitido configurable.
- Verificación por magic bytes cuando sea posible.
- Nombres saneados.
- Rutas privadas en Blob.
- Descarga autorizada por expediente y rol.
- Hash obligatorio antes de procesar IA.
- Cache de texto y extracción por hash.

---

## 13. Motor de IA documental

### 13.1 Enfoque

La IA debe ser una capa intercambiable. El sistema puede usar DeepSeek u otro
proveedor, pero no debe quedar atado a un modelo fijo. La configuración debe
venir de variables de entorno y una interfaz interna.

Variables orientativas:

- `IA_DOCUMENTAL_PROVIDER`
- `IA_DOCUMENTAL_API_KEY`
- `IA_DOCUMENTAL_MODEL`
- `IA_DOCUMENTAL_BASE_URL`
- `IA_DOCUMENTAL_MODE` (`heuristic`, `ai`, `disabled`)

### 13.2 Funciones permitidas

- Clasificar documento cuando la heurística no baste.
- Extraer datos estructurados.
- Detectar señales de ilegibilidad, incompletitud o vencimiento textual.
- Redactar resumen ejecutivo descriptivo.
- Sugerir próximos pasos operativos.

### 13.3 Funciones prohibidas

- Aprobar documentos.
- Rechazar definitivamente.
- Firmar.
- Presentar trámites.
- Inventar citas legales, jurisprudencia, plazos o requisitos.
- Mezclar datos entre expedientes.
- Tomar estrategia jurídica.

### 13.4 Esquema de salida

Cada extracción debe producir JSON validado por Zod:

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
  "resumen_descriptivo": "..."
}
```

### 13.5 Medidas anti-alucinación

- Un documento por llamada.
- Un expediente por contexto.
- Sin memoria cruzada.
- Prompt restrictivo: “si no está en el documento, devuelve null”.
- JSON schema obligatorio.
- Validación Zod.
- Cita fuente obligatoria para campos críticos.
- Confianza por campo.
- Reintentos limitados.
- Fallback a `pendiente_abogado` si falla.
- Logs de tokens, prompt hash, duración, proveedor, modelo y estado.
- Reglas deterministas antes de que un dato alimente automatizaciones.

---

## 14. Motor de reglas y validación

### 14.1 Responsabilidades

El motor de reglas es el corazón de la confiabilidad. Debe ser determinista,
idempotente y testeable.

Valida:

- Formato de identidad, RTN, fechas, montos, correos y teléfonos.
- Completitud documental.
- Vigencia de documentos cuando aplique.
- Duplicados por hash.
- Coherencia entre documentos.
- Coherencia contra datos del cliente.
- Confianza mínima de campos extraídos.
- Existencia de cita fuente en campos críticos.

### 14.2 Severidades

| Severidad | Efecto |
|---|---|
| `info` | No bloquea, sólo informa |
| `advertencia` | Requiere atención, no bloquea por defecto |
| `error` | Bloquea paso a validación final |
| `critico` | Bloquea y notifica de inmediato |

### 14.3 Idempotencia

Cada validación debe poder repetirse sin duplicar alertas, correos ni tareas.
Clave sugerida: `expediente_id + regla_id + documento_id + ventana_temporal`.

---

## 15. Automatizaciones por fase

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
| IA termina | Extracción ok | Ejecutar reglas y actualizar completitud |
| Regla detecta error | Validación error | Alerta + tarea + posible correo sugerido |
| Expediente listo | Sin errores bloqueantes | Pasar a bandeja de validación del abogado |
| Fecha detectada | Confianza alta + regla ok | Crear evento propuesto + tarea |
| Caso atascado | Sin cambios N días | Alerta interna y resumen al abogado |
| Día laboral inicia | Cron diario | Resumen de expedientes críticos |

---

## 16. Comunicación automática con clientes

### 16.1 Principio

El cliente debe recibir instrucciones claras y oportunas sin que el abogado tenga
que redactar cada correo manualmente. Todo correo debe quedar registrado.

### 16.2 Plantillas mínimas

| Plantilla | Cuándo se envía |
|---|---|
| Bienvenida de expediente | Al abrir expediente y confirmar checklist |
| Solicitud documental | Al generar enlaces mágicos |
| Acuse de recibo | Tras subir cada documento |
| Documentos faltantes | Si el checklist sigue incompleto |
| Recordatorio de enlace | Antes de expirar token |
| Enlace expirado | Al vencer token sin carga |
| Documento rechazado | Cuando abogado rechaza documento |
| Solicitud de reemplazo | Documento ilegible/vencido/incorrecto |
| Expediente en revisión | Cuando pasa a validación del abogado |
| Próxima cita/audiencia | Cuando abogado confirma evento |
| Cierre o archivo | Cuando abogado finaliza |

### 16.3 Variables permitidas

- `cliente_nombre`
- `expediente_numero`
- `procedimiento_nombre`
- `documentos_faltantes`
- `enlace_carga`
- `fecha_expiracion`
- `abogado_nombre`
- `telefono_despacho`
- `email_despacho`

Las plantillas deben usar HTML sanitizado y vista previa antes de activar.

### 16.4 Control anti-spam y anti-duplicado

- Rate limit por expediente y destinatario.
- Idempotencia por plantilla + ventana temporal.
- Registro en `correos_enviados`.
- Reintentos con backoff si Resend falla.
- Alerta interna si un correo crítico falla.

---

## 17. Agenda, plazos y tareas

### 17.1 Tipos de fecha

| Tipo | Origen | Estado inicial |
|---|---|---|
| Interna | Procedimiento / manual | Confirmada |
| Procesal detectada | Documento / IA | Propuesta |
| Audiencia | Documento / manual | Propuesta o confirmada |
| Recordatorio | Regla automática | Confirmada |
| Vencimiento de enlace | Sistema | Confirmada |

### 17.2 Regla de seguridad

Una fecha detectada por IA puede crear un evento **propuesto**, no definitivo,
salvo que una regla aprobada lo permita y el abogado lo confirme.

### 17.3 Bandejas operativas

- “Hoy”.
- “Próximos 7 días”.
- “Vencidos”.
- “Expedientes sin movimiento”.
- “Pendiente de cliente”.
- “Pendiente de abogado”.
- “Listo para firma”.

---

## 18. Datos, almacenamiento y trazabilidad

### 18.1 Entidades principales

| Entidad | Propósito |
|---|---|
| `clientes` | Maestro de clientes |
| `tipos_procedimiento` | Catálogo versionado |
| `expedientes` | Unidad de trabajo |
| `requisitos_expediente` | Checklist instanciado |
| `documentos_expediente` | Metadatos de documentos |
| `extracciones_ia` | Resultado versionado de IA |
| `campos_extraidos` | Datos por campo y cita fuente |
| `validaciones` | Resultados del motor de reglas |
| `alertas` | Riesgos y faltantes |
| `tareas` | Trabajo pendiente |
| `eventos_agenda` | Plazos y audiencias |
| `enlaces_magicos` | Tokens de carga |
| `plantillas_correo` | Comunicación configurable |
| `correos_enviados` | Registro de emails |
| `historial_expediente` | Línea de tiempo |
| `auditoria_eventos` | Auditoría transversal |

### 18.2 Qué se guarda dónde

| Dato | Ubicación |
|---|---|
| Bytes originales | Vercel Blob u object storage equivalente |
| Texto extraído | Blob `.txt` o columna controlada |
| Metadatos | PostgreSQL |
| Hash | PostgreSQL |
| Campos extraídos | PostgreSQL |
| Citas fuente | PostgreSQL, referenciando texto/documento |
| Auditoría | PostgreSQL |
| Correos enviados | PostgreSQL + proveedor email |

### 18.3 Trazabilidad mínima por acción crítica

Cada acción debe registrar:

- usuario o sistema actor;
- expediente;
- documento si aplica;
- acción;
- estado anterior y nuevo;
- fecha/hora;
- IP/user-agent en acciones públicas;
- metadatos relevantes;
- hash del archivo si aplica.

---

## 19. Seguridad, privacidad y gobierno

### 19.1 Rutas privadas

- `/intranet/sgie/*`: sólo usuarios autenticados con rol autorizado.
- `/api/sgie/*`: sólo sesión interna.
- `/cargar/{token}`: pública por token, no indexable, sin revelar datos más allá
  de lo estrictamente necesario.

### 19.2 Enlaces mágicos

- Token aleatorio de 256 bits.
- Expiración obligatoria.
- Máximo de usos.
- Revocación manual.
- Scope a expediente/requisito.
- Rate limit por IP y token.
- Auditoría de apertura y carga.

### 19.3 Documentos

- No exponer URLs públicas permanentes.
- Acceso firmado o mediado por API autorizada.
- Validación MIME/tamaño.
- Rechazo de extensiones peligrosas.
- Hash antes de procesar.
- Política de retención definida por el despacho.

### 19.4 IA y confidencialidad

- No enviar documentos innecesarios al proveedor.
- Un documento por llamada.
- No enviar expedientes completos si no hace falta.
- Minimizar datos en prompts.
- Registrar proveedor/modelo usado.
- Permitir modo `heuristic` o `disabled` si no hay autorización para IA externa.
- Evaluar contrato, región y política de tratamiento de datos del proveedor antes
  de producción.

---

## 20. Arquitectura técnica sobre la intranet actual

### 20.1 Estructura propuesta

```txt
app/
  intranet/
    sgie/                    # panel del abogado
  api/
    sgie/                    # APIs internas SGIE
    public/
      cargar/                # endpoints por token
lib/
  sgie/
    clientes-db.ts
    expedientes-db.ts
    procedimientos-db.ts
    documentos-db.ts
    enlaces-magicos.ts
    motor-documental.ts
    motor-reglas.ts
    ia-documental.ts
    automatizaciones.ts
    email-sgie.ts
    agenda.ts
    auditoria-sgie.ts
components/
  sgie/
    cockpit-abogado.tsx
    expediente-review.tsx
    checklist-documental.tsx
    documento-viewer.tsx
```

### 20.2 Procesamiento asíncrono

Fase inicial:

- Tabla `jobs_sgie` en DB.
- Vercel Cron con `CRON_SECRET`.
- Jobs idempotentes.
- Procesamiento por lotes pequeños.

Fase escalada:

- Cola/worker externo para OCR e IA pesada.
- Reintentos con backoff.
- Dead-letter queue.
- Dashboard de jobs fallidos.

Regla técnica: no ejecutar OCR o análisis IA pesado dentro de route handlers que
deban responder al usuario.

### 20.3 Endpoints iniciales

| Endpoint | Uso |
|---|---|
| `GET /api/sgie/expedientes` | Listado privado |
| `POST /api/sgie/expedientes` | Crear expediente |
| `GET /api/sgie/expedientes/:id` | Detalle |
| `PATCH /api/sgie/expedientes/:id` | Actualizar |
| `POST /api/sgie/expedientes/:id/checklist/confirmar` | Activar checklist |
| `POST /api/sgie/enlaces` | Crear enlace mágico |
| `POST /api/public/cargar/:token` | Subir documento |
| `POST /api/sgie/documentos/:id/procesar` | Encolar procesamiento |
| `POST /api/sgie/documentos/:id/aprobar` | Aprobar documento |
| `POST /api/sgie/documentos/:id/rechazar` | Rechazar documento |
| `POST /api/sgie/expedientes/:id/validar` | Validación final abogado |

Todos los endpoints de escritura deben usar Zod, auditoría y control de rol.

---

## 21. Estrategia de implementación por fases

### Fase 0 — Decisiones y mapa operativo

**Duración estimada:** 1–2 semanas.  
**Objetivo:** no programar a ciegas.

Entregables:

- Mapa real de procedimientos prioritarios.
- Lista de documentos por procedimiento.
- Plantillas de correo iniciales.
- Política de retención.
- Umbrales de confianza IA.
- Decisión de cola/worker.
- Decisión de uso de IA externa y proveedor.
- Definición de MVP.

Criterios:

- Documento de decisiones aprobado por el despacho.
- Sin código de producción aún.

### Fase 1 — Fundaciones de datos SGIE

**Duración estimada:** 2–3 semanas.

Entregables:

- Nuevas tablas Drizzle aditivas.
- CRUD básico de procedimientos.
- Seeds iniciales marcados como pendientes de validación legal.
- Auditoría extendida.
- Tests de schema y permisos.

Criterios:

- Migración generada con Drizzle.
- Sin tocar motor de cálculo ni web pública.
- `npm run lint && npm run build && npm test` pasan.

### Fase 2 — Expedientes, clientes y checklist

**Duración estimada:** 3–4 semanas.

Entregables:

- Panel `/intranet/sgie`.
- CRUD de clientes.
- Crear expediente.
- Instanciar checklist por procedimiento.
- Scope por abogado.
- Historial básico.

Criterios:

- Abogado crea cliente + expediente + checklist.
- Admin no pierde acceso a panel existente.
- No hay filtración entre abogados.

### Fase 3 — Enlaces mágicos y carga documental

**Duración estimada:** 3–4 semanas.

Entregables:

- Generar/revocar enlaces.
- Portal `/cargar/{token}`.
- Upload a Blob.
- Hash, MIME, tamaño y estados.
- Notificación interna.
- Rate limiting.

Criterios:

- Cliente sube documentos sin cuenta.
- Token vencido/revocado no funciona.
- Documento queda asociado al expediente correcto.

### Fase 4 — Comunicación automática y seguimiento

**Duración estimada:** 2–3 semanas.

Entregables:

- Plantillas de correo.
- Envío por fase.
- Recordatorios.
- Correos de faltantes.
- Correos de rechazo/reemplazo.
- Registro de correos.
- Cron básico con idempotencia.

Criterios:

- Ningún correo duplicado por el mismo evento.
- Fallos de email generan alerta interna.

### Fase 5 — Motor documental + IA controlada

**Duración estimada:** 4–6 semanas.

Entregables:

- Extracción de texto.
- Clasificación heurística.
- Capa IA configurable.
- JSON schema/Zod.
- Campos extraídos con confianza y cita.
- Cache por hash.
- Jobs asíncronos.
- OCR selectivo si se decide.

Criterios:

- Un documento por llamada IA.
- Sin auto-aprobación.
- Fallo IA no rompe expediente.
- Coste y tokens medidos.

### Fase 6 — Motor de reglas y cockpit del abogado

**Duración estimada:** 4–6 semanas.

Entregables:

- Reglas deterministas.
- Alertas.
- Puntuación de completitud.
- Semáforo de riesgo.
- Pantalla consolidada de revisión.
- Aprobar/rechazar/corregir.

Criterios:

- El abogado valida desde una sola pantalla.
- Las transiciones críticas son manuales.
- Toda corrección re-ejecuta reglas afectadas.

### Fase 7 — Agenda, tareas y bandejas inteligentes

**Duración estimada:** 3–4 semanas.

Entregables:

- Eventos propuestos.
- Tareas automáticas.
- Bandejas operativas.
- Resumen diario.
- Detección de casos atascados.

Criterios:

- Toda fecha crítica genera acción.
- El abogado puede confirmar/anular eventos.

### Fase 8 — Métricas, auditoría avanzada y escalado

**Duración estimada:** 3–5 semanas.

Entregables:

- Dashboard de productividad.
- Dashboard de costes IA/storage.
- Exportación de auditoría.
- Políticas de retención.
- Optimización de queries e índices.

Criterios:

- El despacho ve cuellos de botella y ahorro real.
- Costes medidos contra proyección.

### Fase 9 — Futuro avanzado

Sólo después de estabilizar el flujo base:

- Firma electrónica integrada si el marco legal y proveedor lo permiten.
- Integración con calendarios externos.
- Intake inteligente desde formularios públicos.
- Voz a expediente: dictado de notas que alimentan tareas.
- Búsqueda semántica interna por expedientes cerrados.
- Knowledge graph privado del despacho.
- Asistente de preparación de escritos como borrador, nunca como decisión final.

---

## 22. Plan de 30 / 60 / 90 / 180 días

### Primeros 30 días — Base operativa

- Aprobar decisiones de Fase 0.
- Definir 5 procedimientos prioritarios.
- Crear modelo de datos inicial.
- Implementar clientes, expedientes y checklist.
- Activar auditoría SGIE básica.

Resultado esperado: expedientes digitales con checklist y trazabilidad.

### Días 31–60 — Documentos y comunicación

- Portal de carga por enlace mágico.
- Upload seguro a Blob.
- Correos de solicitud y acuse de recibo.
- Recordatorios de faltantes.
- Estados documentales.

Resultado esperado: el sistema empieza a pedir y recibir documentos sin trabajo
manual constante.

### Días 61–90 — IA y reglas

- Extracción de texto.
- Clasificación documental.
- IA configurable.
- Campos extraídos con cita.
- Reglas de completitud y coherencia.
- Alertas y semáforo.
- Cockpit de revisión inicial.

Resultado esperado: el abogado revisa un expediente preparado, no una carpeta
desordenada.

### Días 91–180 — Autopilot supervisado

- Agenda y tareas automáticas.
- Resumen diario.
- Métricas de productividad.
- Cost dashboard.
- Mejoras de IA/OCR.
- Workflows por área jurídica.
- Preparación de firma/trámite.

Resultado esperado: el sistema opera el ciclo documental completo y el abogado
interviene en validación, estrategia y firma.

---

## 23. Métricas de éxito

### 23.1 Operativas

- Tiempo promedio desde apertura a checklist aprobado.
- Tiempo promedio de recepción documental.
- Porcentaje de expedientes con documentos completos.
- Porcentaje de documentos rechazados por ilegibles/incorrectos.
- Número de correos automáticos enviados.
- Número de recordatorios que evitaron atraso.
- Expedientes atascados por fase.

### 23.2 IA y calidad

- Porcentaje de documentos clasificados automáticamente.
- Porcentaje de campos extraídos con confianza alta.
- Porcentaje de campos corregidos por abogado.
- Tasa de fallos IA.
- Coste IA por expediente.
- Tiempo de procesamiento por documento.

### 23.3 Negocio

- Expedientes activos por abogado.
- Tiempo administrativo por expediente.
- Tiempo hasta expediente listo para revisión.
- Tasa de clientes que completan carga sin intervención manual.
- Ahorro estimado de horas por mes.

---

## 24. Costes y control financiero

### 24.1 Principio

El coste debe medirse, no asumirse. Las tarifas de IA, hosting, storage, email y
OCR deben re-verificarse antes de implementar y luego monitorearse en producción.

### 24.2 Fórmulas de control

- Documentos/mes = expedientes/mes × documentos promedio.
- Storage mensual = documentos/mes × MB promedio.
- IA input = documentos procesados × tokens input promedio.
- IA output = documentos procesados × tokens output promedio.
- OCR = páginas escaneadas × coste por página.
- Email = correos por expediente × expedientes/mes.

### 24.3 Estrategias de ahorro

- No procesar duplicados.
- Cache por hash.
- Extraer texto sin IA cuando el PDF ya tiene capa de texto.
- OCR sólo cuando sea necesario.
- Prompt estable para aprovechar cache del proveedor si existe.
- Limitar reintentos.
- Procesar por lotes pequeños.
- Archivar expedientes finalizados.
- Medir coste por expediente en dashboard.

### 24.4 Escenarios a calcular antes de producción

| Escenario | Expedientes/mes | Documentos/expediente | Uso esperado |
|---|---:|---:|---|
| Pequeño | 20 | 6–8 | MVP controlado |
| Medio | 100 | 8–10 | Operación normal del despacho |
| Alto | 500 | 10–12 | Escalado con worker/cola |

Los importes concretos quedan como **NO VALIDADOS** hasta consultar precios
oficiales vigentes.

---

## 25. Riesgos y mitigaciones

| Riesgo | Impacto | Mitigación |
|---|---|---|
| IA inventa dato | Alto | Cita fuente, confianza, Zod, reglas, revisión humana |
| Mezcla de expedientes | Crítico | Un documento/expediente por llamada, sin memoria cruzada |
| Pérdida de plazo | Alto | Fechas → tareas/eventos, resumen diario, alertas |
| Filtración de documentos | Crítico | Proxy, tokens, URLs privadas, auditoría, rate limit |
| Correos duplicados | Medio | Idempotencia por evento/ventana |
| OCR/IA causa timeout | Medio | Jobs, cron, worker, no procesar pesado en request |
| Procedimiento mal definido | Alto | Versionado y validación legal antes de activar |
| Coste crece sin control | Medio | Dashboard de coste, límites, cache, OCR selectivo |
| Abogado no adopta cockpit | Alto | UI simple, bandeja única, acciones rápidas |
| Cliente no usa portal | Medio | Correos claros, enlaces simples, carga móvil |
| Exposición SEO de rutas privadas | Crítico | Noindex, robots, sitemap excluyente, sin enlaces públicos |

---

## 26. Decisiones que debe tomar el despacho

Antes de programar fases avanzadas, Pineda y Asociados debe decidir:

1. ¿Cuáles son los 5 procedimientos prioritarios para el MVP?

Dentro de https://www.pinedayasociadoshn.com/servicios-juridicos estan las distintas ramas del derecho que tocamos, y dentro de cada rama estan los servicios que ofrecemos, por ejemplo derecho de familia y dentro Divorcio por mutuo acuerdo, pues debemos entrar en cada rama del derecho, laboral, derecho civil y notarial, etc... y por cada servicio que ofrecemos crear un procedimiento con los documentos que se necesitan, evidentemente luego tenemos que tener la opcion de modificarlos agregando o quitando documentos, pero de primeras debemos crearlos todos. 

2. ¿Qué documentos requiere cada procedimiento y quién los valida legalmente?

de momento nosotros, la IA tiene que validarlos, cuando esten creados como el sistema tiene que tener la opcion de poder modificarlos, no va ser un problema.


3. ¿Qué datos se consideran críticos y requieren confirmación humana siempre?

Con las reglas adecuadas y las metricas de confianza bien implementadas ningun dato puede ser critico, simplemente tenemos que diseñar bien el motor para evitar que falle, diseñando reglas y escalas de confianza adecuadas.


4. ¿Qué umbrales de confianza se aceptan para cada tipo de dato?

la confianza se establece en funcion de la coherencia de los datos extraidos con el expediente, si vemos que hay mas de una coincidencia la confianza es mayor. 

5. ¿Se permite enviar documentos a un proveedor externo de IA?

Actualizaremos nuestras politicas y usaremos OCR o IA 

6. ¿Qué proveedor/modelo se usará inicialmente y bajo qué contrato?

DeepSeek v4 Flash o algun modelo inferior que cumpla su funcion para lo que necesitamos

7. ¿Se requiere OCR desde el MVP o se marca ilegible al inicio?

No entiendo la pregunta

8. ¿Cuántos días duran los enlaces mágicos?

El enlace magico debe durar unos dias, para darle tiempo al cliente en subir la documentacion.

9. ¿Cada cuánto se enviarán recordatorios al cliente?

Podemos estudiar metricas para no ser demasiado insistentes, pero al mismo tiempo que el cliente vea que estamos pendientes de resolver su caso. 

10. ¿Cuál es la política de retención documental?

La IA tiene que revisar la ley de Honduras y adaptar el plan para guardar documentacion sensible tal vez en una base de datos mas economica una vez el expediente ya fue completado o archivado.

11. ¿Quién puede ver expedientes de otros abogados?

Cada abogado tendra su correo corporativo @pinedayasociadoshn.com y tendra acceso solo a sus clientes.

12. ¿Qué eventos de agenda deben confirmarse manualmente?

Lo mismo de siempre el reto esta en crear un sistema de reglas y determinacion de confianza para que el sistema actue o pida revision humana.

13. ¿Qué plantillas de correo aprueba el despacho?

La IA tiene que diseñar un sistema de plantillas que actuen de comunicacion con el cliente. 

14. ¿Qué métricas se revisarán semanalmente?

Pues esta es la clave el sistema de reglas y determinacion de confianza en funcion de cohinciendencias, estos valores se iran ajustando y seria bueno que el sistema aprendiera por si solo y las fuera ajustando con el tiempo para mejorar su precion, quiero inteligencia en estado puro. 


15. ¿Cuándo se considera un expediente “listo para firma”?



---

## 27. Criterios de aceptación globales

El SGIE Autopilot estará listo para considerarse operativo cuando:

1. Un abogado pueda crear un expediente con checklist en menos de 3 minutos.
2. El sistema pueda solicitar documentos al cliente sin redactar correos manuales.
3. El cliente pueda subir documentos sin cuenta y sin intervención del despacho.
4. Todo documento quede asociado a expediente, requisito, hash y estado.
5. El sistema detecte faltantes y envíe recordatorios sin duplicados.
6. La IA extraiga campos con confianza y cita fuente, sin auto-aprobar.
7. El motor de reglas detecte completitud, duplicados, vigencia y contradicciones.
8. El abogado vea una pantalla consolidada para validar.
9. Toda acción crítica quede en historial y auditoría.
10. Las rutas privadas no aparezcan en sitemap, robots públicos, schemas ni
    enlaces públicos.
11. Los costes por expediente puedan medirse.
12. Las transiciones críticas dependan siempre del abogado.

---

## Próximo paso recomendado

Ejecutar **Fase 0** durante 1–2 semanas con el despacho:

1. elegir procedimientos prioritarios;
2. aprobar documentos requeridos;
3. definir plantillas de correo;
4. decidir política de IA/OCR;
5. fijar umbrales de confianza;
6. aprobar el MVP;
7. convertir este plan en backlog técnico por issues/commits atómicos.

*Fin del plan de acción SGIE Autopilot.*