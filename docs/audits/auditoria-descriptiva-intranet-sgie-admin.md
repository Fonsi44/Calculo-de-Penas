# Auditoría descriptiva de la intranet: SGIE y Admin

**Fecha de revisión:** 9 de julio de 2026  
**Estado:** `NO VALIDADO` en sesión autenticada; `VALIDADO` el bloqueo de acceso y la estructura implementada en el repositorio.

## 1. Objetivo de la auditoría

Documentar el estado funcional actual de las áreas SGIE y Admin de la intranet de Pineda y Asociados. El documento describe organización, navegación, pantallas, módulos, datos y acciones identificables, además de limitaciones y riesgos que deben estudiarse antes de un rediseño completo.

Esta auditoría no constituye un rediseño, no propone código de implementación y no confirma el correcto funcionamiento de operaciones que requieren autenticación, permisos, datos reales o escritura en la base de datos.

## 2. Alcance

- **SGIE:** `https://www.pinedayasociadoshn.com/intranet/sgie`
- **Admin:** `https://www.pinedayasociadoshn.com/intranet/admin`
- **Acceso común observado:** `/intranet/login`
- **Evidencia complementaria:** pantallas, rutas, navegación y controles presentes en el repositorio actual.

Quedan fuera del alcance la web pública, las API como objeto de auditoría técnica, la base de datos, la seguridad de backend y cualquier propuesta detallada de arquitectura o interfaz futura.

## 3. Metodología usada

La revisión combinó:

1. **Revisión visual:** acceso directo a las dos URL en producción. Ambas redirigieron a la pantalla de inicio de sesión.
2. **Revisión de navegación:** identificación de los menús laterales, agrupaciones, enlaces entre SGIE y Admin y rutas adicionales presentes en el código.
3. **Identificación de módulos:** inventario de páginas principales, páginas de detalle y módulos auxiliares.
4. **Identificación de controles:** formularios, botones, tablas, buscadores, filtros, menús, diálogos y acciones declaradas.
5. **Detección de flujos principales:** reconstrucción descriptiva de los recorridos que la interfaz parece soportar.
6. **Clasificación de certeza:**
   - `VALIDADO`: observado directamente en producción o confirmado como estructura de interfaz en el repositorio.
   - `NO VALIDADO`: no fue posible comprobar el comportamiento real con una sesión autenticada.
   - `PENDIENTE DE VALIDAR`: requiere acceso, permisos, datos reales o ejecución de una acción.

### Limitación de acceso

Las dos rutas auditadas redirigieron a `/intranet/login`. La pantalla observada contiene:

- campo de email corporativo;
- campo de contraseña;
- botón para mostrar u ocultar la contraseña;
- botón **Iniciar sesión**.

El repositorio añade textos de “acceso exclusivo para personal autorizado”, una indicación de uso de correo corporativo y un aviso de registro de actividad. No se introdujeron credenciales ni se enviaron formularios.

No se incluyen capturas porque la única pantalla accesible fue el inicio de sesión y no aportaría evidencia adicional respecto de la descripción textual. La apariencia y el comportamiento internos en producción quedan **Pendientes de validar**.

## 4. Mapa funcional de SGIE

### 4.1 Qué parece ser

SGIE se presenta como un sistema operativo para la gestión interna de clientes, expedientes, documentación, tareas, agenda, alertas y comunicaciones del bufete. Su pantalla inicial se denomina **Cockpit del abogado** y prioriza señales de trabajo pendiente.

El acceso declarado admite perfiles con rol de **abogado** o **administrador**. Para un administrador, el cockpit ofrece una vista de supervisión de todos los expedientes y un enlace hacia el panel Admin. El alcance exacto por usuario está **Pendiente de validar**.

### 4.2 Organización de la navegación

El menú lateral principal, bajo “Gestión de expedientes”, contiene:

1. Cockpit
2. Clientes
3. Expedientes
4. Documentos
5. Alertas
6. Tareas
7. Agenda
8. Correos

La barra superior incorpora:

- notificaciones;
- búsqueda global de clientes, expedientes, documentos y tareas;
- atajo de teclado indicado como `Ctrl/⌘ + K`;
- control para abrir el menú en pantallas pequeñas.

La zona de usuario muestra nombre o email, rol, cierre de sesión, acceso al sitio público y, para administradores, acceso al panel Admin.

Las rutas **Productividad** y **Reportes** existen, pero no aparecen en el menú lateral principal revisado. Reportes sí se enlaza desde las acciones rápidas del cockpit. La forma de descubrir Productividad queda **Pendiente de validar**.

### 4.3 Módulos, información y acciones

| Módulo | Información identificada | Acciones identificadas | Estado de validación |
|---|---|---|---|
| Cockpit | métricas de expedientes, documentos, alertas, tareas y correos; expedientes recientes; tendencia por estado; tareas vencidas; cuellos de botella; eventos próximos | abrir bandejas, ver todos, ir a clientes/expedientes/tareas/reportes | Estructura `VALIDADA`; datos y navegación autenticada `NO VALIDADO` |
| Clientes | nombre o razón social, identidad/RTN, contacto, notas, fecha y estado; expedientes vinculados en la ficha | buscar, refrescar, crear, consultar ficha, editar, guardar, cancelar, crear expediente, desactivar y reactivar | `PENDIENTE DE VALIDAR` |
| Expedientes | número interno, cliente, procedimiento, estado, prioridad, responsable y actualización; ficha detallada | buscar/filtrar, crear, abrir, editar datos, aprobar o rechazar pasos/documentos, gestionar enlaces de carga | `PENDIENTE DE VALIDAR` |
| Documentos | documentos asociados, estado de procesamiento y detalle/previsualización | consultar, procesar, abrir detalle, previsualizar PDF y descargar | `PENDIENTE DE VALIDAR` |
| Alertas | alertas activas y su contexto | consultar y resolver alerta | `PENDIENTE DE VALIDAR` |
| Tareas | tareas, estado, responsable, fechas y comentarios | crear, editar, completar, reabrir, consultar/agregar/editar/eliminar comentarios | `PENDIENTE DE VALIDAR` |
| Agenda | eventos y estados | consultar, reprogramar con motivo, confirmar, completar y cancelar | `PENDIENTE DE VALIDAR` |
| Correos | comunicaciones y estados, incluidos fallos | consultar y revisar resultados; otras operaciones concretas `Pendientes de validar` | `PENDIENTE DE VALIDAR` |
| Reportes | selección y resumen de expedientes | generar reportes; formato, descarga o exportación `Pendientes de validar` | `PENDIENTE DE VALIDAR` |
| Productividad | indicadores de productividad | consulta; alcance y audiencia `Pendientes de validar` | `PENDIENTE DE VALIDAR` |
| Inteligencia del expediente | resumen asistido, datos extraídos y nivel de confianza | generar o actualizar resumen con IA | `PENDIENTE DE VALIDAR` |
| Enlaces de carga | enlaces activos, vigencia, usos y email opcional | generar, copiar y revocar enlaces | `PENDIENTE DE VALIDAR` |

### 4.4 Usuarios que podrían utilizarlo

- abogados responsables de expedientes;
- personal operativo que gestione clientes, documentos, tareas, agenda o correos;
- administradores con funciones de supervisión.

La participación de asistentes, procuradores, recepción u otros perfiles no se observa de forma concluyente y queda **Pendiente de validar**.

### 4.5 Procesos internos que parece soportar

- alta y mantenimiento de clientes;
- apertura y seguimiento de expedientes;
- recepción, revisión y procesamiento documental;
- solicitud de documentos mediante enlaces de carga;
- asignación y seguimiento de tareas;
- control de agenda y reprogramaciones;
- detección y resolución de alertas;
- seguimiento de correos y fallos;
- supervisión de carga de trabajo y cuellos de botella;
- elaboración de reportes;
- apoyo de IA para resumir o extraer información de expedientes.

## 5. Mapa funcional de Admin

### 5.1 Qué parece ser

Admin se presenta como el panel de administración del ecosistema digital del bufete. Combina herramientas jurídicas, gestión de contenido público, usuarios, SEO, auditoría y configuración. Su dashboard muestra estadísticas, acciones rápidas, búsqueda de artículos del Código Penal, publicaciones recientes y accesos a módulos.

El menú declara secciones exclusivas para administradores, pero también contiene herramientas y configuración sin marca explícita de exclusividad. El comportamiento exacto para roles distintos de administrador queda **Pendiente de validar**.

### 5.2 Organización de la navegación

El menú lateral se organiza en grupos desplegables:

- **Inicio:** Panel general.
- **Herramientas jurídicas:** Calculadora, Mis casos, Biblioteca CP y Catálogo delitos.
- **Administración:** Usuarios, SEO y Auditoría.
- **Gestión de contenido:** Blog, FAQ, Páginas, Menús, Biblioteca medios y Áreas jurídicas.
- **Configuración:** Perfil y Sitio.

La zona inferior contiene Perfil, Salir e Ir al sitio web. En móvil se sustituye la barra lateral persistente por un botón para abrir el menú.

Existen además rutas de **Agravantes específicas** y administración SGIE —usuarios y accesos, métricas, plantillas de correo, reglas y retención documental— que no aparecen en el menú principal revisado. Su acceso previsto y su vigencia funcional quedan **Pendientes de validar**.

### 5.3 Módulos, información y acciones

| Módulo | Información identificada | Acciones identificadas | Estado de validación |
|---|---|---|---|
| Panel general | totales de delitos, artículos CP, ramas, pasos, posts y FAQ; sesión; posts recientes; módulos | crear post/FAQ, gestionar blog, abrir SEO, páginas, editar/ver posts, buscar artículos CP | Estructura `VALIDADA`; datos `NO VALIDADO` |
| Calculadora | cálculo técnico de penas y reglas jurídicas | introducir parámetros y calcular; persistencia exacta `Pendiente de validar` | `PENDIENTE DE VALIDAR` |
| Mis casos | casos guardados y cálculos asociados | crear/consultar casos y revisar cálculos | `PENDIENTE DE VALIDAR` |
| Biblioteca CP | artículos del Código Penal | buscar, consultar listado y detalle | `PENDIENTE DE VALIDAR` |
| Catálogo de delitos | delitos, artículos y datos penales | buscar, filtrar, consultar y editar; alta mediante formulario identificada | `PENDIENTE DE VALIDAR` |
| Agravantes específicas | agravantes por delito, artículo, modalidad y fracción | buscar, crear, editar y eliminar | Ruta no visible en menú; `PENDIENTE DE VALIDAR` |
| Usuarios y accesos | cuentas, roles, estado, último acceso y vínculos SGIE/corporativos | buscar, filtrar, crear/editar, bloquear, desbloquear y generar contraseña temporal | `PENDIENTE DE VALIDAR` |
| SEO | analítica, Search Console, indexación y sitemap | consultar métricas y controles SEO; acciones externas concretas `Pendientes de validar` | `PENDIENTE DE VALIDAR` |
| Auditoría | registro de acciones administrativas | consultar y filtrar registros; exportación `Pendiente de validar` | `PENDIENTE DE VALIDAR` |
| Blog | posts, categorías, publicación y estado | buscar/filtrar, crear, editar, duplicar, publicar o gestionar estado, ver en web y eliminar | `PENDIENTE DE VALIDAR` |
| FAQ | preguntas, categorías y publicación | crear, editar, gestionar estado y eliminar | `PENDIENTE DE VALIDAR` |
| Páginas | páginas públicas, estado, contenido, SEO y fecha de actualización | buscar, abrir editor visual, editar metadatos/SEO, ver página pública y eliminar contenido administrable | `PENDIENTE DE VALIDAR` |
| Menús | menús y elementos con etiqueta y URL | crear, renombrar, añadir/quitar elementos, guardar y eliminar | `PENDIENTE DE VALIDAR` |
| Biblioteca de medios | archivos multimedia | cargar `Pendiente de validar`; copiar URL, descargar y eliminar identificados | `PENDIENTE DE VALIDAR` |
| Áreas jurídicas | servicios o áreas legales | consultar y administrar contenido; operaciones exactas `Pendientes de validar` | `PENDIENTE DE VALIDAR` |
| Perfil | datos de cuenta y credenciales | gestionar perfil y cambiar contraseña | `PENDIENTE DE VALIDAR` |
| Sitio | contenido/configuración global | editar configuración; campos y efecto público `Pendientes de validar` | `PENDIENTE DE VALIDAR` |
| Admin SGIE: métricas | expedientes, documentos, IA, correos, alertas, tareas y distribución por estado/abogado | consultar métricas | No visible en menú; `PENDIENTE DE VALIDAR` |
| Admin SGIE: plantillas | plantillas de correo, variables, estado y vista previa | buscar, filtrar, crear, editar, previsualizar, activar y desactivar | No visible en menú; `PENDIENTE DE VALIDAR` |
| Admin SGIE: reglas | versión/configuración de reglas | guardar nueva versión | No visible en menú; `PENDIENTE DE VALIDAR` |
| Admin SGIE: retención | política prevista de retención documental | la propia pantalla está marcada “NO VALIDADO”; exportación previa y eliminación no deben asumirse operativas | No visible en menú; `NO VALIDADO` |

### 5.4 Usuarios que podrían utilizarlo

- administradores generales;
- responsables de contenido y SEO, si reciben permisos administrativos;
- usuarios jurídicos que utilicen calculadora, casos, biblioteca CP y catálogo;
- responsables de supervisión SGIE.

No se observa una separación completa entre administrador técnico, editor, analista SEO, abogado y supervisor. Los permisos efectivos deben verificarse.

### 5.5 Procesos internos que parece soportar

- administración de usuarios, roles y accesos;
- mantenimiento del contenido público;
- publicación editorial;
- gestión de páginas, menús y medios;
- consulta y mantenimiento del corpus jurídico;
- cálculo de penas y seguimiento de casos;
- seguimiento SEO;
- auditoría administrativa;
- configuración del sitio;
- supervisión y configuración especializada de SGIE.

## 6. Tabla comparativa SGIE vs Admin

| Criterio | SGIE | Admin |
|---|---|---|
| Finalidad | operación diaria de asuntos, clientes y expedientes | gobierno del sistema, contenido, herramientas jurídicas y configuración |
| Tipo de usuario | abogado, personal operativo y administrador supervisor | administrador; algunos módulos parecen útiles para usuarios jurídicos o editores |
| Módulos principales | cockpit, clientes, expedientes, documentos, alertas, tareas, agenda y correos | dashboard, herramientas jurídicas, usuarios, SEO, auditoría, contenido y configuración |
| Datos visibles | datos de clientes y expedientes, documentos, tareas, eventos, alertas y comunicaciones | métricas globales, contenido web, cuentas, registros, corpus jurídico y configuración |
| Acciones disponibles | crear y mantener registros operativos, procesar, aprobar/rechazar, resolver, reprogramar y reportar | crear/editar/eliminar contenido y datos, gestionar accesos, configurar y supervisar |
| Complejidad | alta por profundidad de los expedientes y cantidad de estados/acciones | muy alta por mezcla de dominios jurídicos, editoriales, técnicos y administrativos |
| Problemas detectados | rutas relevantes fuera del menú; densidad operativa; permisos y feedback real no validados | módulos heterogéneos; rutas fuera del menú; límites entre rol jurídico y administrador poco evidentes |

## 7. Inventario de componentes de interfaz

| Componente | SGIE | Admin | Observaciones |
|---|---|---|---|
| Menús | barra lateral de ocho módulos, usuario, salida, sitio público y enlace a Admin | barra lateral por grupos desplegables, perfil, salida y sitio público | Hay rutas implementadas no visibles en los menús |
| Tarjetas | métricas/señales, resúmenes, cuellos de botella y eventos | estadísticas, acciones rápidas, módulos, reglas y marco normativo | Concentran gran parte de la orientación inicial |
| Tablas | clientes, expedientes, documentos, tareas y otros listados | posts, usuarios, páginas, delitos, medios, agravantes, plantillas y registros | Varias columnas se ocultan según breakpoint |
| Formularios | clientes, expedientes, tareas, agenda, comentarios y enlaces | usuarios, posts, FAQ, páginas, menús, delitos, agravantes, configuración y plantillas | La validación real y los errores de servidor están `Pendientes de validar` |
| Botones | crear, editar, guardar, aprobar, rechazar, resolver, completar, reabrir, copiar, revocar, descargar | crear, editar, guardar, duplicar, publicar, activar/desactivar, bloquear/desbloquear y eliminar | Algunas acciones críticas usan iconos o controles compactos |
| Buscadores | búsqueda global y búsquedas específicas por módulo | búsquedas por módulo y autocomplete de artículos CP | El alcance exacto de la búsqueda global requiere sesión |
| Filtros | estados, responsables y criterios por módulo | publicación, estado, rol, contenido y otros criterios | Cobertura y persistencia `Pendientes de validar` |
| Modales/diálogos | reprogramación, comentarios, previsualización, confirmaciones y prompts | confirmaciones de borrado, formularios y editores según módulo | Se identifican confirmaciones en varias acciones destructivas |
| Mensajes | carga, vacío, error, éxito y confirmación | carga, vacío, error, éxito, sesión y confirmación | La consistencia de mensajes tras cada operación no pudo comprobarse |

## 8. Flujos funcionales detectados

### 8.1 Inicio de sesión

1. El usuario abre SGIE o Admin.
2. Sin sesión activa, el sistema redirige a `/intranet/login`.
3. Introduce email y contraseña; puede mostrar u ocultar la contraseña.
4. La interfaz prevé redirección por rol: administrador hacia Admin y abogado hacia SGIE.
5. Usuarios sin rol suficiente serían devueltos al login.

Los pasos 3 a 5 están **Pendientes de validar** en producción.

### 8.2 Consulta de información

- **SGIE:** cockpit → señal o buscador → listado → ficha de cliente/expediente/documento/tarea.
- **Admin:** dashboard o menú → listado especializado → detalle/editor.
- En ambos espacios se contemplan estados de carga, error y ausencia de resultados.

### 8.3 Creación, edición y eliminación

- **SGIE:** alta y edición de clientes, expedientes y tareas; comentarios; enlaces de carga; cambios de estado.
- **Admin:** altas y edición de usuarios, posts, FAQ, páginas, menús, delitos, agravantes y plantillas.
- Las eliminaciones identificadas suelen pedir confirmación o describirse como borrado lógico, pero la cobertura completa y la reversibilidad quedan **Pendientes de validar**.

### 8.4 Administración de usuarios o datos

Admin incluye cuentas, roles, bloqueo/desbloqueo, contraseña temporal y edición de usuario. Existe además una vista específica de usuarios y accesos SGIE. No se pudo determinar si ambas pantallas dividen responsabilidades o duplican funciones.

### 8.5 Exportaciones, cargas y reportes

- SGIE presenta un módulo de Reportes y descarga de documentos.
- Los enlaces de carga permiten solicitar documentación externa.
- La biblioteca de medios parece destinada a gestionar archivos.
- La retención documental menciona exportación previa, pero la pantalla está marcada `NO VALIDADO`.
- No se confirmó exportación tabular, formatos de reportes, cargas masivas ni descargas de auditoría: **Pendiente de validar**.

## 9. Problemas y limitaciones detectados

### 9.1 Claridad

- Admin reúne funciones operativas jurídicas, editoriales, SEO, técnicas y de seguridad bajo un mismo panel. Esto puede dificultar que cada perfil identifique su área.
- Términos como “Cockpit”, “Inteligencia del expediente”, “Reglas” o “Retención” necesitan contexto funcional para usuarios no especializados.
- Hay dos superficies relacionadas con usuarios —Usuarios y Usuarios y Accesos SGIE— cuya diferencia no es evidente sin acceso.

### 9.2 Navegación

- Productividad, Agravantes y varias rutas de administración SGIE existen pero no aparecen en la navegación principal revisada.
- Reportes se descubre desde el cockpit, no desde el menú principal.
- La navegación Admin no muestra un acceso directo a SGIE, mientras SGIE sí ofrece acceso a Admin para administradores.
- La relación entre `Config`, “Sitio” y páginas/configuración no resulta completamente evidente.

### 9.3 Jerarquía visual

- Los dashboards contienen muchas tarjetas, métricas, módulos y acciones en una sola pantalla; existe riesgo de competencia visual.
- Algunas acciones de tablas se representan mediante iconos y dependen del título accesible o del reconocimiento del símbolo.
- La jerarquía visual real en producción autenticada está **Pendiente de validar**.

### 9.4 Consistencia

- Conviven los términos “Panel general”, “Panel de Administración”, “Cockpit” y “dashboard”.
- Algunas funciones se exponen en menú, otras en acciones rápidas y otras solo mediante rutas.
- Las páginas utilizan distintos patrones de cabecera y títulos.
- No se pudo confirmar si filtros, paginación, confirmaciones y notificaciones siguen el mismo comportamiento en todos los módulos.

### 9.5 Usabilidad

- La amplitud funcional de Admin puede elevar la carga cognitiva.
- Las tablas con muchas columnas y acciones pueden requerir desplazamiento o esconder información relevante.
- Los procesos con numerosos estados —expedientes, documentos, tareas y agenda— necesitan nomenclatura y feedback inequívocos.
- El sistema depende de estados vacíos y errores genéricos como “Verifique su conexión”, que pueden no explicar permisos, sesión caducada o fallos de datos.

### 9.6 Responsive y móvil

- Ambos layouts contemplan menú móvil.
- Varias tablas ocultan columnas en breakpoints pequeños; esto reduce desbordamiento, pero puede privar al usuario de contexto para decidir.
- Formularios extensos, editores, calendarios, vistas previas y tablas de gestión pueden ser difíciles de operar en móvil.
- No se realizó una prueba visual autenticada por tamaños de pantalla: **Pendiente de validar**.

### 9.7 Accesibilidad

- Se identifican etiquetas, roles de alerta, nombres accesibles, controles de cierre y manejo de foco en varios diálogos.
- Algunos botones de acción son principalmente iconográficos y deben verificarse con lector de pantalla y navegación por teclado.
- Deben comprobarse contraste, orden de foco, estados activos, mensajes anunciados, tablas responsivas y cierre de modales.
- No se ejecutó una auditoría WCAG ni pruebas con tecnologías de asistencia: **Pendiente de validar**.

## 10. Riesgos funcionales

| Riesgo | Descripción | Estado |
|---|---|---|
| Acciones críticas poco claras | aprobar, rechazar, resolver, bloquear, revocar, publicar o eliminar pueden tener efectos relevantes y no se comprobó siempre su alcance o reversibilidad | `RIESGO` |
| Falta de feedback | no se validaron mensajes posteriores a operaciones, tiempos de proceso, fallos parciales ni recuperación | `PENDIENTE DE VALIDAR` |
| Permisos poco visibles | el código distingue roles en layouts, pero no se comprobó la matriz de permisos por módulo y acción | `RIESGO` |
| Procesos manuales | reportes, correos, clasificación documental, cambios de estado y supervisión podrían depender de seguimiento manual | `PENDIENTE DE VALIDAR` |
| Pantallas difíciles de entender | Admin mezcla dominios y SGIE maneja flujos con estados numerosos | `RIESGO` |
| Módulos no descubribles | rutas fuera de los menús pueden quedar infrautilizadas o responder a funciones incompletas | `RIESGO` |
| Doble administración de usuarios | posible solapamiento entre usuarios generales y accesos SGIE | `PENDIENTE DE VALIDAR` |
| Funciones expresamente no validadas | retención documental indica “NO VALIDADO” y no debe considerarse operativa | `RIESGO` |

## 11. Oportunidades para un futuro rediseño

Estas oportunidades son líneas de estudio, no decisiones de diseño:

1. **Reorganización de navegación:** inventariar rutas vigentes, retirar accesos obsoletos y hacer descubribles los módulos necesarios.
2. **Simplificación de flujos:** reducir pasos y ambigüedad en alta de expedientes, revisión documental, cambios de estado y publicación.
3. **Mejora visual:** reforzar jerarquías, densidad, lenguaje de estados y prioridad de acciones.
4. **Dashboard principal:** definir indicadores y tareas prioritarias por rol, evitando un tablero único sobrecargado.
5. **Sistema de diseño unificado:** normalizar cabeceras, tablas, filtros, formularios, feedback, confirmaciones y estados vacíos.
6. **Separación por perfil:** distinguir con claridad usuario operativo, abogado, supervisor, editor de contenidos y administrador.
7. **Estrategia responsive:** decidir qué tareas deben poder completarse en móvil y qué datos no pueden ocultarse sin alternativa.
8. **Modelo de permisos visible:** comunicar por qué una acción está disponible, deshabilitada o restringida.

## 12. Preguntas abiertas para el cliente o equipo

1. ¿Qué perfiles usan realmente SGIE y cuáles usan Admin?
2. ¿Qué módulos se utilizan diariamente, ocasionalmente o nunca?
3. ¿Cuáles son los procesos críticos y cuáles tienen plazos legales u operativos?
4. ¿Qué datos necesita ver primero cada perfil al iniciar sesión?
5. ¿Cuál es la matriz real de permisos por módulo, registro y acción?
6. ¿Qué problemas reportan hoy abogados, asistentes, administradores y editores?
7. ¿Qué significan exactamente todos los estados de expedientes, documentos, tareas, eventos y correos?
8. ¿Qué acciones son reversibles y cuáles requieren doble confirmación, motivo o trazabilidad?
9. ¿Qué diferencias funcionales existen entre Usuarios y Usuarios y Accesos SGIE?
10. ¿Por qué Productividad, Agravantes, Reportes y los módulos Admin SGIE no están todos en el menú?
11. ¿Qué exportaciones, cargas masivas o reportes son necesarios y en qué formatos?
12. ¿Qué funciones dependen actualmente de correo, hojas de cálculo, mensajería u otros pasos manuales?
13. ¿Qué módulos deben conservarse, eliminarse, consolidarse o rediseñarse?
14. ¿La retención documental está aprobada legal y operativamente?
15. ¿Qué dispositivos, navegadores y condiciones de conectividad predominan?

## 13. Conclusión ejecutiva

La intranet contiene dos áreas de propósito diferente pero conectadas. **SGIE** concentra el trabajo operativo alrededor de clientes, expedientes, documentos, tareas, agenda, alertas y comunicaciones. **Admin** concentra gobierno, contenido público, herramientas jurídicas, usuarios, SEO, auditoría y configuración, además de módulos especializados de supervisión SGIE.

La estructura implementada revela una cobertura funcional amplia. Al mismo tiempo, la cantidad de dominios, rutas no visibles en el menú, posibles solapamientos de administración y ausencia de validación autenticada impiden afirmar que todos los flujos sean claros, completos u operativos en producción.

Se recomienda pasar a una segunda fase de estudio UX/UI y arquitectura funcional después de obtener acceso controlado, entrevistar a los perfiles reales, validar permisos y tareas críticas, observar flujos completos con datos representativos y decidir qué módulos continúan vigentes. Esa fase debería producir una arquitectura de información y prioridades por rol antes de cualquier rediseño visual.

---

### Registro de certeza

- **VALIDADO:** ambas URL redirigen al login sin sesión; existe un formulario de email y contraseña; las rutas, menús, pantallas y controles descritos están presentes en el repositorio revisado.
- **NO VALIDADO:** apariencia interna real en producción, datos mostrados, permisos efectivos, persistencia, integraciones y éxito de acciones.
- **PENDIENTE DE VALIDAR:** todos los flujos que requieren autenticación, datos reales, escritura, descargas, cargas, reportes o cambio de estado.
