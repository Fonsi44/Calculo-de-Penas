Actúa como arquitecto senior full-stack, auditor técnico, UX/UI senior, especialista en CMS, especialista en seguridad web y QA senior.

Necesito que realices una AUDITORÍA COMPLETA y una implementación profesional sobre la intranet administrativa de Pineda y Asociados HN, especialmente:

- https://www.pinedayasociadoshn.com/intranet/admin
- https://www.pinedayasociadoshn.com/intranet/admin/blog
- https://www.pinedayasociadoshn.com/intranet/admin/faq
- https://www.pinedayasociadoshn.com/intranet/dashboard
- https://www.pinedayasociadoshn.com/intranet/calculadora

OBJETIVO PRINCIPAL

Auditar, corregir, proponer e implementar mejoras para que la intranet/admin funcione como un CMS profesional estilo WordPress, SIN instalar WordPress, SIN depender de WordPress y SIN cambiar el diseño público de la web.

El objetivo no es copiar WordPress técnicamente, sino imitar sus mejores funcionalidades editoriales, de gestión, publicación, categorías, borradores, estados, editor visual, organización, experiencia de usuario, vista de código, publicación real y control de contenido.

IMPORTANTE ABSOLUTO

- NO edites, rediseñes ni modifiques la página pública principal del blog.
- NO edites, rediseñes ni modifiques la página pública de FAQ.
- NO cambies el diseño visual público.
- La web pública solo debe usarse como verificación de lectura/renderizado/publicación.
- Nunca uses la página pública como zona de edición.
- Solo puedes modificar componentes públicos si existe un bug técnico imprescindible de conexión de datos, renderizado, formato o publicación.
- Si tocas algún archivo público por necesidad técnica, debes justificar exactamente cuál, por qué era imprescindible y qué cambiaste sin alterar diseño.
- No hagas cambios superficiales.
- No crees solo una interfaz bonita.
- No uses datos mock como solución final.
- No guardes datos en una fuente que la web pública no lee.
- No instales WordPress.
- No rompas URLs, slugs, SEO ni estructura pública existente.

---

# 1. AUDITORÍA INICIAL OBLIGATORIA ANTES DE TOCAR CÓDIGO

Antes de modificar cualquier archivo, audita el proyecto completo.

Debes identificar:

- Framework usado.
- Estructura de carpetas.
- Sistema de rutas.
- Layout general de intranet.
- Layout específico de admin.
- Componentes compartidos.
- Sistema de autenticación.
- Sistema de autorización/roles si existe.
- Menú lateral de la intranet.
- Página /intranet/dashboard.
- Página /intranet/admin.
- Página /intranet/admin/blog.
- Página /intranet/admin/faq.
- Página /intranet/calculadora.
- APIs internas.
- Server actions si existen.
- Route handlers si existen.
- Servicios de datos.
- Modelos/types/interfaces.
- Fuente real de datos para Blog.
- Fuente real de datos para FAQ.
- Fuente real de categorías.
- Fuente real de datos de la calculadora de penas.
- Sistema de publicación.
- Sistema de borradores si existe.
- Sistema de caché/revalidación.
- Formato exacto que consume la web pública.
- Cómo se guardan actualmente posts y FAQ.
- Cómo se editan actualmente posts y FAQ.
- Por qué los nuevos contenidos o ediciones no se publican correctamente.
- Qué partes del admin son reales y cuáles son mock, hardcodeadas, locales, desconectadas o incompletas.
- Si el admin guarda en una fuente distinta a la que lee la web pública.
- Si la web pública lee datos hardcodeados, JSON, Markdown, MDX, base de datos, CMS, API o constantes.
- Si existen problemas de serialización/deserialización.
- Si existen problemas de caché, SSG, SSR, ISR o revalidación.

No asumas arquitectura. Verifica todo en el código.

No avances a implementación sin haber identificado la causa raíz de los problemas principales.

---

# 2. PROBLEMAS ACTUALES A RESOLVER

Actualmente ocurre lo siguiente:

- Los nuevos posts creados desde el admin NO se muestran/publican correctamente en la web.
- Las nuevas FAQ creadas desde el admin NO se muestran/publican correctamente.
- Los posts existentes editados desde el admin NO actualizan su contenido publicado.
- Las FAQ existentes editadas desde el admin NO actualizan su contenido publicado.
- El editor de blog carga los artículos existentes sin formato al pulsar “Editar”.
- El admin necesita una experiencia tipo WordPress.
- Las categorías deben seleccionarse desde desplegables reales, no texto libre.
- El contenido debe editarse visualmente como Word.
- El contenido debe poder verse/editarse también en una pestaña “Código”.
- El contenido debe convertirse automáticamente al formato exacto que consume la web pública.
- Al guardar/publicar, debe persistir en la fuente correcta y quedar publicado realmente.
- La intranet necesita un acceso lateral “Web Admin”.
- La calculadora de penas muestra:
  - 234 verificados (48%)
  - 249 a revisar (52%)
  - 483 totales
- Los 249 “a revisar” deben pasar a verificados solo si tras auditoría cumplen criterios reales de verificación.

---

# 3. CAMBIOS PERMITIDOS Y PROHIBIDOS

## Cambios permitidos

Puedes modificar:

- La intranet/admin.
- /intranet/admin.
- /intranet/admin/blog.
- /intranet/admin/faq.
- /intranet/dashboard.
- Menú lateral de la intranet.
- /intranet/calculadora.
- APIs necesarias.
- Endpoints de creación/edición/eliminación/publicación.
- Modelos.
- Types/interfaces.
- Validadores.
- Servicios de persistencia.
- Adaptadores de datos.
- Utilidades de conversión.
- Sanitización.
- Revalidación.
- Caché.
- Autenticación/autorización del admin si ya existe.
- Componentes compartidos solo si son necesarios para admin, intranet o conexión real de datos.
- README.md.
- CHANGELOG.md.
- Tests existentes o pruebas mínimas viables.

## Cambios prohibidos

No puedes:

- Rediseñar la página pública principal del blog.
- Rediseñar la página pública de FAQ.
- Cambiar el diseño visual público.
- Romper URLs existentes.
- Romper slugs existentes.
- Romper SEO.
- Cambiar estructura pública sin necesidad técnica.
- Crear categorías falsas.
- Guardar contenido en localStorage como persistencia final si la web pública no consume localStorage.
- Simular publicación sin persistencia real.
- Crear una interfaz bonita pero desconectada de la fuente real.
- Duplicar lógica de categorías en varios archivos.
- Introducir datos mock como solución final.
- Cambiar la arquitectura sin justificarlo.
- Cambiar solo el texto de contadores sin actualizar la fuente real.
- Marcar registros como verificados sin validación real.

---

# 4. AUDITORÍA Y MEJORAS DE /intranet/admin

Audita la página:

https://www.pinedayasociadoshn.com/intranet/admin

Revisa:

- Navegación.
- Accesos a módulos.
- Permisos.
- Diseño.
- Claridad visual.
- Jerarquía.
- Consistencia con la intranet.
- Acceso a Blog.
- Acceso a FAQ.
- Acceso a otros módulos existentes.
- Estados vacíos.
- Mensajes de error.
- Responsive.
- Seguridad.
- Usabilidad.
- Flujo de usuario.

Implementa mejoras para convertir esta página en un panel principal tipo “dashboard CMS”, con accesos claros a:

- Blog.
- FAQ.
- Categorías si aplica.
- Contenido publicado.
- Borradores.
- Elementos pendientes.
- Estadísticas básicas si existen datos reales.
- Acciones rápidas.
- Estado general del CMS.
- Acceso rápido a crear post.
- Acceso rápido a crear FAQ.

No inventes datos falsos permanentes. Si no hay métricas reales, muestra solo las que puedan calcularse desde la fuente real.

---

# 5. MENÚ LATERAL DE /intranet/dashboard

En el menú lateral de:

https://www.pinedayasociadoshn.com/intranet/dashboard

añade una nueva línea/opción tipo “Web Admin” para acceder a:

https://www.pinedayasociadoshn.com/intranet/admin

Requisitos:

- Texto sugerido: “Web Admin”.
- URL destino: /intranet/admin.
- Debe integrarse con el estilo actual del menú lateral.
- Debe respetar iconos, estados activos, permisos y estructura existente.
- Si el menú usa configuración centralizada, añade la opción ahí.
- No dupliques navegación.
- No hardcodees si existe una fuente central.
- Si existen roles/permisos, muestra “Web Admin” solo a usuarios autorizados.
- Verifica que desde /intranet/dashboard se puede acceder correctamente a /intranet/admin.
- No expongas /intranet/admin a usuarios no autorizados si debe estar protegido.

---

# 6. EDITOR DE BLOG ESTILO WORDPRESS

La ruta principal es:

https://www.pinedayasociadoshn.com/intranet/admin/blog

Debes implementar o mejorar un editor de blog estilo WordPress, sin instalar WordPress.

## 6.1. Listado de posts

Debe incluir:

- Tabla/listado de posts.
- Búsqueda.
- Filtro por categoría.
- Filtro por estado.
- Orden por fecha.
- Orden por título.
- Orden por estado.
- Acciones rápidas:
  - editar,
  - ver,
  - duplicar si es viable,
  - eliminar si existe flujo seguro,
  - publicar,
  - pasar a borrador.
- Indicador de estado:
  - publicado,
  - borrador,
  - programado si aplica,
  - pendiente si aplica.
- Fecha de creación.
- Fecha de actualización.
- Categoría.
- Autor si existe.
- Slug.
- Feedback visual de acciones.
- Empty states claros.
- Loading states.

## 6.2. Creación y edición de posts

Debe permitir:

- Crear nuevo post.
- Editar post existente.
- Guardar borrador.
- Publicar.
- Actualizar post publicado.
- Programar publicación si la arquitectura lo soporta.
- Vista previa si es viable.
- Confirmación antes de eliminar.
- Feedback claro de guardado.
- Protección contra pérdida de cambios no guardados.
- Validaciones claras.
- Manejo de errores.

## 6.3. Campos del post

Debe permitir editar:

- Título.
- Slug.
- Categoría.
- Extracto.
- Contenido.
- Imagen destacada si el modelo actual la soporta.
- Estado.
- Fecha.
- Autor si existe.
- SEO title si existe.
- Meta description si existe.
- Tags si existen.
- Orden si existe.

No inventes campos que no puedan persistir o renderizarse correctamente. Si añades campos nuevos, deben estar integrados con el modelo real y documentados.

---

# 7. FUNCIONALIDADES ESTILO WORDPRESS PARA BLOG

Imita funcionalidades útiles de WordPress, sin descargar WordPress:

- Editor visual WYSIWYG tipo Word.
- Pestaña “Editor visual”.
- Pestaña “Código”.
- Barra de formato.
- Párrafos.
- Títulos H2/H3.
- Negrita.
- Cursiva.
- Listas ordenadas.
- Listas desordenadas.
- Enlaces.
- Citas si el render lo soporta.
- Separadores si el render lo soporta.
- Imagen destacada si existe soporte.
- Vista previa.
- Borradores.
- Publicación.
- Actualización.
- Slug editable.
- Slug autogenerado.
- Validación de slug único.
- Categorías desde desplegable.
- Tags si existen.
- Estado de publicación.
- Fecha de publicación.
- Papelera o eliminación segura si el proyecto lo soporta.
- Duplicar post si es viable.
- Guardado con feedback visual.
- Aviso de cambios sin guardar.
- Sanitización HTML.
- Conversión automática al formato real de la web.
- Revalidación o invalidación de caché.
- Publicación real.

---

# 8. CATEGORÍAS DEL BLOG

La categoría debe elegirse desde un desplegable.

Requisitos:

- Cargar categorías reales existentes.
- No permitir texto libre.
- No permitir categoría inválida.
- Mantener compatibilidad con categorías existentes como “Derecho Laboral”.
- Guardar el valor exacto que consume la web pública.
- Si las categorías están duplicadas en varios archivos, centralizarlas.
- Si hay categorías en base de datos, consumirlas desde ahí.
- Si hay categorías en JSON/constantes, usar esa fuente real.
- Documentar dónde están y cómo se mantienen.
- Validar categoría en frontend y backend.
- No guardar posts con categoría inexistente.

---

# 9. EDITOR DE FAQ ESTILO WORDPRESS

La ruta principal es:

https://www.pinedayasociadoshn.com/intranet/admin/faq

Debes implementar o mejorar un editor de FAQ profesional.

## 9.1. Listado de FAQ

Debe incluir:

- Tabla/listado de preguntas frecuentes.
- Búsqueda.
- Filtro por categoría.
- Filtro por estado.
- Orden si existe.
- Acciones:
  - editar,
  - publicar,
  - pasar a borrador,
  - eliminar si existe flujo seguro.
- Indicador de estado.
- Categoría.
- Fecha de creación.
- Fecha de actualización.
- Empty states.
- Loading states.
- Feedback visual.

## 9.2. Creación y edición de FAQ

Debe permitir editar:

- Pregunta.
- Respuesta.
- Categoría.
- Estado.
- Orden si existe.
- Fecha si existe.
- Slug/ID si aplica.

## 9.3. Editor visual para respuesta

La respuesta debe editarse con editor visual tipo Word.

Debe permitir:

- Párrafos.
- Negrita.
- Cursiva.
- Listas.
- Enlaces.
- Formato básico compatible con el render público.

Al guardar:

- Convertir automáticamente al formato real.
- Sanitizar contenido.
- Persistir correctamente.
- Publicar si corresponde.
- Revalidar o invalidar caché si aplica.
- Mantener formato al volver a editar.

---

# 10. CATEGORÍAS DE FAQ

La categoría de FAQ debe elegirse desde desplegable.

Requisitos:

- Cargar categorías reales existentes.
- No permitir texto libre.
- No permitir categorías inválidas.
- Mantener compatibilidad con categorías como “Derecho General Penal”.
- Guardar el valor exacto que consume la web pública.
- Centralizar categorías si están duplicadas.
- Documentar fuente y mantenimiento.
- Validar categoría en frontend y backend.
- No guardar FAQ con categoría inexistente.

---

# 11. AUTOMATISMOS OBLIGATORIOS EN BLOG Y FAQ

Implementa en Blog y FAQ todos estos automatismos:

- Editor WYSIWYG tipo Word.
- Conversión automática al formato apto para la web.
- Sanitización de HTML.
- Slug automático seguro cuando aplique.
- Validación de slug único cuando aplique.
- Desplegable de categorías reales.
- Validación de categoría existente.
- Guardar borrador si el modelo lo soporta.
- Publicar.
- Actualizar contenido publicado.
- Revalidar caché si aplica.
- Evitar que el admin guarde en una fuente distinta a la que lee la web pública.
- Evitar localStorage como persistencia final salvo que esa sea realmente la fuente del proyecto.
- Feedback visual de éxito/error.
- Aviso de cambios sin guardar.
- Persistencia real.
- Verificación en web pública solo como lectura.
- Actualización de README.md.
- Actualización de CHANGELOG.md.

---

# 12. CONVERSIÓN AUTOMÁTICA DE CONTENIDO

El usuario debe editar visualmente como en Word.

Al guardar, el sistema debe convertir automáticamente el contenido al formato real que consume la web:

- HTML sanitizado,
- Markdown,
- MDX,
- JSON estructurado,
- Portable Text,
- u otro formato que corresponda tras auditar el proyecto.

Reglas:

- No guardar contenido incompatible.
- No introducir un formato nuevo si la web ya usa otro.
- No romper render público.
- No romper SEO.
- No romper slugs.
- No perder contenido existente.
- Sanitizar todo contenido enriquecido.
- Mantener estructura semántica correcta.
- Mantener acentos, caracteres especiales y entidades correctamente.
- Mantener saltos de línea relevantes.
- Mantener enlaces correctamente.
- Mantener listas correctamente.
- Mantener títulos y subtítulos correctamente.

---

# 13. EDICIÓN DE POSTS EN DOBLE PESTAÑA: “EDITOR VISUAL” + “CÓDIGO”

Además del editor WYSIWYG tipo Word, el editor de Blog debe implementar obligatoriamente un sistema de doble pestaña para cada post:

1. Pestaña “Editor visual”.
2. Pestaña “Código”.

El objetivo es que al crear o editar un post, el usuario pueda trabajar tanto en formato visual tipo Word como en el formato fuente real que necesita la web.

## 13.1. Problema actual

Actualmente, al pulsar “Editar” sobre un artículo existente, el contenido carga sin formato o como texto plano.

Esto debe corregirse completamente.

Al editar un post existente, el sistema debe cargar correctamente:

- El contenido con formato visual en la pestaña “Editor visual”.
- El contenido fuente real en la pestaña “Código”.
- Ambos deben representar el mismo artículo.
- Ambos deben estar sincronizados.
- No debe perderse formato al editar, guardar, publicar y volver a abrir el post.

## 13.2. Pestaña “Editor visual”

La pestaña “Editor visual” debe funcionar como un editor tipo Word/WYSIWYG.

Debe cargar el artículo existente ya formateado correctamente, respetando:

- Títulos.
- Subtítulos.
- Párrafos.
- Negrita.
- Cursiva.
- Listas ordenadas.
- Listas desordenadas.
- Enlaces.
- Citas si el render público las soporta.
- Separadores si el render público los soporta.
- Imágenes si el modelo actual las soporta.
- Cualquier estructura semántica compatible con la web.

No es aceptable que al editar un post aparezca el contenido:

- sin formato,
- como texto plano,
- con HTML escapado,
- con etiquetas visibles tipo `<p>`, `<h2>`, `<strong>`,
- con estructura rota,
- perdiendo títulos,
- perdiendo listas,
- perdiendo enlaces,
- perdiendo negritas o cursivas.

## 13.3. Pestaña “Código”

La pestaña “Código” debe mostrar el contenido en el formato fuente real que necesita la web para guardar y renderizar el post.

El formato puede ser, según lo que se detecte en la auditoría:

- HTML sanitizado,
- Markdown,
- MDX,
- JSON estructurado,
- Portable Text,
- u otro formato real usado por el proyecto.

La pestaña “Código” debe permitir revisar y, si es seguro según la arquitectura, editar directamente el contenido fuente.

El código mostrado debe ser exactamente el contenido que se va a persistir o el equivalente serializado que consume la web pública.

## 13.4. Conversión bidireccional obligatoria

Debes implementar o corregir una conversión bidireccional robusta:

- Formato fuente real del proyecto → Editor visual WYSIWYG.
- Editor visual WYSIWYG → Formato fuente real del proyecto.

La conversión debe preservar:

- títulos,
- subtítulos,
- párrafos,
- negritas,
- cursivas,
- listas,
- enlaces,
- citas si aplica,
- separadores si aplica,
- imágenes si aplica,
- estructura semántica,
- contenido existente,
- orden del contenido,
- caracteres especiales,
- acentos,
- entidades HTML,
- saltos de línea relevantes.

## 13.5. Sincronización entre pestañas

Las dos pestañas deben estar sincronizadas correctamente.

Requisitos:

- Si el usuario edita en “Editor visual”, el contenido fuente de la pestaña “Código” debe actualizarse o regenerarse antes de guardar.
- Si el usuario edita en “Código”, el editor visual debe poder actualizarse con la conversión correspondiente.
- Debe existir una única fuente de verdad interna para evitar divergencias.
- Antes de guardar, publicar o actualizar, el sistema debe convertir el contenido final al formato exacto que consume la web.
- No debe guardarse una versión visual incompatible.
- No debe guardarse una versión fuente corrupta.
- No debe perderse formato al cambiar entre pestañas.
- Debe haber feedback si el código introducido no puede convertirse correctamente.

## 13.6. Auditoría específica del fallo actual

Investiga específicamente por qué al editar un post existente carga sin formato.

Revisa si el problema está en:

- El editor visual recibe texto plano en vez de HTML/Markdown/estructura enriquecida.
- El contenido se está escapando incorrectamente.
- Se está renderizando HTML como texto.
- Se pierde formato al serializar/deserializar.
- El admin lee un campo distinto al que guarda.
- El admin guarda un formato y luego intenta leer otro.
- Falta parser de HTML/Markdown/MDX hacia el editor visual.
- Falta conversor del editor visual hacia el formato fuente.
- Hay sanitización excesiva que elimina estructura.
- Hay normalización incorrecta de contenido.
- Se está usando `innerText` en lugar de contenido enriquecido.
- El contenido se guarda en un campo plano incompatible.
- El post publicado y el post editable usan modelos distintos.

Corrige la causa raíz, no solo la apariencia.

## 13.7. Guardado desde doble pestaña

Al guardar o publicar desde cualquiera de las dos pestañas:

- El contenido final debe convertirse al formato real de la web.
- Debe sanitizarse correctamente.
- Debe persistirse en la fuente correcta.
- Debe mantener el formato al volver a abrir el post.
- Debe renderizar correctamente en la web pública sin modificar el diseño público.
- Debe actualizar el post existente sin duplicarlo.
- Debe mantener slug, categoría, estado y fechas correctamente.

---

# 14. PUBLICACIÓN REAL

Al guardar/publicar desde el admin, el contenido debe:

- Persistir en la fuente correcta.
- Mantener ID estable si es edición.
- Mantener slug válido.
- Mantener categoría válida.
- Mantener estado correcto.
- Actualizar fecha si corresponde.
- No duplicar posts.
- No duplicar FAQ.
- No crear slugs duplicados.
- No perder SEO existente.
- No perder contenido existente.
- Revalidar o invalidar caché si aplica.
- Quedar disponible en la web pública sin editar manualmente páginas públicas.

Si hay diferencia entre “Guardar borrador” y “Publicar”:

- Implementa claramente ambos comportamientos.
- El borrador no debe aparecer públicamente si la lógica del proyecto lo espera así.
- El publicado sí debe aparecer públicamente.

Si no existe sistema de borradores:

- No lo fuerces de forma invasiva.
- Implementa solo si es coherente con la arquitectura.
- Si no lo implementas, explica el motivo.

## Si hay SSG/ISR/SSR/cache

- Auditar comportamiento.
- Revisar fetch cache.
- Revisar revalidate.
- Revisar ISR.
- Revisar rutas estáticas.
- Revisar server actions.
- Revisar route handlers.
- Implementar revalidatePath/revalidateTag o equivalente si aplica.
- Verificar que tras publicar se ven cambios.

## Si hay archivos estáticos

- Guardar en el archivo correcto.
- Mantener formato.
- Evitar corrupción.
- Mantener orden.
- Documentar si requiere redeploy o si se actualiza dinámicamente.

## Si hay base de datos

- Corregir modelos.
- Corregir queries.
- Corregir endpoints.
- Validar transacciones si aplica.
- Confirmar que admin y web pública leen/escriben en la misma fuente.
- Confirmar que filtros por estado/categoría no excluyen indebidamente el contenido.

---

# 15. VALIDACIONES

Implementa validaciones en frontend y backend.

## Para posts

- Título obligatorio.
- Slug obligatorio o autogenerado.
- Slug único.
- Categoría obligatoria.
- Categoría existente.
- Contenido obligatorio si se publica.
- Estado válido.
- Fecha válida.
- Formato de contenido válido.
- Sanitización obligatoria.
- No duplicar slugs.
- No duplicar ID.
- No permitir guardar código corrupto.
- No permitir guardar contenido vacío publicado.

## Para FAQ

- Pregunta obligatoria.
- Respuesta obligatoria si se publica.
- Categoría obligatoria.
- Categoría existente.
- Estado válido.
- Orden válido si existe.
- Sanitización obligatoria.
- No duplicar ID.
- No permitir respuesta corrupta.
- No permitir FAQ publicada sin respuesta.

Debe haber errores claros para el usuario.

---

# 16. SEGURIDAD

Audita y mejora seguridad del admin:

- Autenticación.
- Autorización.
- Roles si existen.
- Protección de rutas admin.
- Protección de endpoints de escritura.
- Validación server-side.
- Sanitización contra XSS.
- Prevención de inyección.
- CSRF si aplica.
- No confiar solo en frontend.
- No exponer escritura pública.
- No permitir edición sin permisos.
- No guardar HTML peligroso.
- No permitir scripts en contenido enriquecido.
- No permitir atributos peligrosos.
- No permitir enlaces inseguros sin validación.
- No exponer /intranet/admin a usuarios no autorizados.

Si existe sistema de roles, asegúrate de que Blog, FAQ y Web Admin solo sean accesibles para usuarios autorizados.

---

# 17. UX/UI ESTILO WORDPRESS

El admin debe sentirse como un CMS profesional.

Implementa mejoras visuales y de flujo en:

- /intranet/admin.
- /intranet/admin/blog.
- /intranet/admin/faq.

Requisitos UX/UI:

- Menú claro.
- Migas de pan si ya existe patrón.
- Botones principales visibles.
- Layout de edición cómodo.
- Columna principal para contenido.
- Columna lateral para publicación/categoría/metadatos.
- Estados claros.
- Mensajes de error claros.
- Mensajes de éxito.
- Confirmaciones.
- Loading states.
- Empty states.
- Responsive si el admin ya lo soporta.
- Acciones rápidas.
- Prevenir pérdida de cambios.
- Diseño limpio y consistente con la intranet existente.
- Experiencia parecida a WordPress sin instalar WordPress.
- Edición cómoda sin tocar código si el usuario no quiere.
- Pestaña de código disponible para revisar/editar fuente.

No rediseñes la web pública.

---

# 18. CALCULADORA DE PENAS

Ruta:

https://www.pinedayasociadoshn.com/intranet/calculadora

Actualmente aparece el estado:

“234 verificados (48%) · 249 a revisar (52%) de 483 totales.”

Necesito que los que salen “a revisar” pasen a “verificados”, pero NO de forma falsa ni superficial.

## 18.1. Auditoría de calculadora

Antes de cambiar estados, debes auditar:

- De dónde salen los contadores.
- Fuente real de datos:
  - base de datos,
  - JSON,
  - constantes,
  - API,
  - cálculo runtime,
  - seed,
  - migración,
  - u otro sistema.
- Campo, flag, estado o condición que marca cada registro como:
  - verificado,
  - a revisar.
- Por qué hay exactamente:
  - 234 verificados,
  - 249 a revisar,
  - 483 totales.

Revisa si “a revisar” depende de:

- Campos incompletos.
- Inconsistencias.
- Validaciones fallidas.
- Ausencia de metadatos.
- Falta de revisión manual.
- Fecha.
- Versión normativa.
- Errores de cálculo.
- Migración incompleta.
- Estado por defecto.
- Falta de flag.
- Falta de confirmación.

## 18.2. Verificación real

No marques registros como verificados a ciegas.

Para cada uno de los 249 registros “a revisar”:

- Valida sus datos.
- Corrige campos faltantes o inconsistentes si aplica.
- Confirma que cumple las reglas internas.
- Entonces actualiza su estado a “verificado”.
- Si algún registro no puede verificarse con seguridad, déjalo como “a revisar” y explica exactamente por qué.

## 18.3. Resultado esperado

Si todos los 249 registros son válidos tras auditoría, el contador final debe quedar:

“483 verificados (100%) · 0 a revisar (0%) de 483 totales.”

Si no todos pueden verificarse, el contador debe reflejar la cifra real y debes documentar los pendientes.

## 18.4. Validaciones de calculadora

Verifica:

- Que el total sigue siendo 483.
- Que no se duplican registros.
- Que no se pierden datos.
- Que no se alteran cálculos legales ni fórmulas salvo que encuentres errores reales.
- Que el cambio persiste tras recargar la página.
- Que el estado no está solo cambiado en frontend.
- Que backend/fuente real queda actualizado.
- Que los porcentajes se recalculan correctamente.

---

# 19. PRUEBAS OBLIGATORIAS

Ejecuta pruebas reales y documenta resultados.

## 19.1. Admin general

- Entrar en /intranet/admin.
- Confirmar acceso correcto.
- Confirmar navegación a Blog.
- Confirmar navegación a FAQ.
- Confirmar permisos.
- Confirmar responsive básico.
- Confirmar que el dashboard CMS muestra datos reales o calculados desde fuente real.
- Confirmar que no hay datos mock como solución final.

## 19.2. Menú lateral

- Entrar en /intranet/dashboard.
- Confirmar que aparece “Web Admin” en el menú lateral.
- Hacer clic en “Web Admin”.
- Confirmar navegación correcta a /intranet/admin.
- Confirmar estado activo si aplica.
- Confirmar permisos/roles si aplica.

## 19.3. Blog — creación

- Crear post nuevo desde /intranet/admin/blog.
- Seleccionar categoría existente desde desplegable.
- Añadir contenido enriquecido.
- Usar títulos, negritas, listas y enlaces.
- Guardar borrador si aplica.
- Publicar.
- Verificar persistencia.
- Verificar publicación.
- Confirmar que no se guarda en localStorage salvo que sea la fuente real.
- Confirmar que no se duplica.

## 19.4. Blog — edición

- Editar post existente.
- Confirmar que carga contenido.
- Cambiar título o contenido.
- Guardar.
- Confirmar actualización real.
- Confirmar que no se duplica.
- Confirmar slug válido.
- Confirmar categoría válida.
- Confirmar que categoría inválida no se guarda.
- Confirmar que el contenido renderiza bien.
- Confirmar que la web pública solo se usó para verificar lectura.

## 19.5. Blog — doble pestaña

- Crear un post nuevo desde la pestaña “Editor visual”.
- Añadir títulos, párrafos, negritas, listas y enlaces.
- Guardar/publicar.
- Volver a editar el post.
- Confirmar que el contenido carga correctamente en “Editor visual” con formato.
- Confirmar que el contenido carga correctamente en “Código” con el formato fuente real.
- Editar el contenido desde la pestaña “Código”.
- Cambiar a “Editor visual”.
- Confirmar que el formato se mantiene correctamente.
- Editar desde “Editor visual”.
- Confirmar que la pestaña “Código” queda actualizada o regenerada correctamente antes de guardar.
- Guardar de nuevo.
- Recargar el admin.
- Volver a editar el post.
- Confirmar que no se perdió formato.
- Confirmar que no aparece HTML escapado.
- Confirmar que no aparece texto plano sin formato.
- Confirmar que no aparecen etiquetas visibles indebidamente.
- Confirmar que no se duplicó el post.
- Confirmar que el contenido publicado renderiza correctamente.
- Confirmar que no se modificó el diseño público del blog.

## 19.6. FAQ — creación

- Crear FAQ nueva desde /intranet/admin/faq.
- Seleccionar categoría existente.
- Añadir respuesta enriquecida.
- Guardar/publicar.
- Verificar persistencia.
- Verificar publicación.
- Confirmar que no se duplica.
- Confirmar categoría válida.

## 19.7. FAQ — edición

- Editar FAQ existente.
- Confirmar actualización real.
- Confirmar que no se duplica.
- Confirmar categoría válida.
- Confirmar que categoría inválida no se guarda.
- Confirmar que el contenido renderiza bien.
- Confirmar que la web pública solo se usó para verificar lectura.

## 19.8. Caché/publicación

- Recargar navegador.
- Cerrar y volver a abrir admin.
- Verificar persistencia.
- Probar navegación directa si aplica.
- Probar revalidación/build/cache si aplica.
- Confirmar que no queda bloqueado por caché.
- Confirmar que el contenido publicado aparece sin editar páginas públicas.

## 19.9. Seguridad

- Probar acceso sin sesión si es posible.
- Probar endpoints protegidos.
- Probar validación server-side.
- Probar sanitización básica.
- Probar que no se guarda HTML peligroso.
- Probar que no se permite categoría inválida.
- Probar que no se permite escritura no autorizada.

## 19.10. Calculadora

- Entrar en /intranet/calculadora.
- Confirmar contador inicial antes del cambio:
  - 234 verificados (48%)
  - 249 a revisar (52%)
  - 483 totales
- Identificar los 249 registros “a revisar”.
- Validar cada registro.
- Corregir inconsistencias si aplica.
- Pasar a “verificado” solo los registros que cumplan criterios.
- Recargar la calculadora.
- Confirmar contador final.
- Confirmar persistencia real.
- Confirmar que el total sigue siendo 483.
- Confirmar que no se alteraron fórmulas ni cálculos legales.
- Confirmar que los porcentajes se recalculan correctamente.

## 19.11. Tests automáticos

Si el proyecto tiene framework de testing:

- Añade tests relevantes para admin, blog, FAQ, categorías, conversión, sanitización, publicación y calculadora.

Si no tiene framework de testing:

- Crea pruebas mínimas viables o documentación clara de verificación manual.
- No introduzcas un framework pesado si no encaja con el proyecto.

---

# 20. DOCUMENTACIÓN OBLIGATORIA

Actualiza README.md con:

- Cómo funciona /intranet/admin.
- Cómo funciona /intranet/admin/blog.
- Cómo funciona /intranet/admin/faq.
- Cómo funciona el enlace “Web Admin” del menú lateral.
- Cómo crear posts.
- Cómo editar posts.
- Cómo publicar posts.
- Cómo usar la pestaña “Editor visual”.
- Cómo usar la pestaña “Código”.
- Cómo funciona la sincronización entre ambas pestañas.
- Cómo crear FAQ.
- Cómo editar FAQ.
- Cómo publicar FAQ.
- Cómo funcionan categorías.
- De dónde se cargan categorías.
- Qué formato genera el editor.
- Cómo se sanitiza.
- Cómo se publica.
- Cómo se revalida caché si aplica.
- Cómo verificar que el contenido quedó publicado.
- Cómo se verificaron los registros de la calculadora.
- Limitaciones pendientes.

Actualiza CHANGELOG.md con:

- Auditoría realizada.
- Mejoras del panel admin.
- Mejoras del editor blog.
- Mejoras del editor FAQ.
- Funcionalidades estilo WordPress añadidas.
- Doble pestaña Editor visual/Código.
- Automatismos añadidos.
- Correcciones de publicación.
- Correcciones de persistencia.
- Correcciones de categorías.
- Correcciones de conversión bidireccional.
- Correcciones de caché/revalidación.
- Nueva opción “Web Admin” en menú lateral.
- Auditoría y actualización de calculadora.
- Seguridad.
- Pruebas ejecutadas.
- Limitaciones pendientes.

---

# 21. ENTREGABLE FINAL

Al terminar, entrega un informe claro con:

## 21.1. Resumen ejecutivo

- Qué se auditó.
- Qué problemas se encontraron.
- Qué se mejoró.
- Qué queda pendiente si aplica.

## 21.2. Causa raíz

Explica exactamente:

- Por qué el admin no publicaba correctamente posts.
- Por qué el admin no publicaba correctamente FAQ.
- Por qué las ediciones no se reflejaban.
- Por qué el editor cargaba artículos sin formato.
- Por qué había 249 registros “a revisar” en la calculadora.
- De dónde salían los contadores de la calculadora.

## 21.3. Archivos modificados

Lista todos los archivos tocados, separados por:

- Admin general.
- Menú lateral.
- Blog.
- FAQ.
- APIs.
- Modelos.
- Utilidades.
- Conversión/sanitización.
- Seguridad.
- Calculadora.
- Documentación.
- Tests.

## 21.4. Mejoras implementadas

Explica mejoras en:

- /intranet/admin.
- /intranet/dashboard.
- /intranet/admin/blog.
- /intranet/admin/faq.
- /intranet/calculadora.

## 21.5. Funcionalidades estilo WordPress añadidas

Incluye:

- Listado.
- Filtros.
- Búsqueda.
- Editor visual.
- Pestaña Código.
- Categorías.
- Estados.
- Borradores.
- Publicación.
- Vista previa si aplica.
- Slugs.
- Sanitización.
- Revalidación.
- Acciones rápidas.
- Feedback visual.
- Protección contra pérdida de cambios.

## 21.6. Categorías

Explica:

- De dónde se cargan.
- Cómo se validan.
- Cómo se evita guardar inválidas.
- Cómo se centralizaron si estaban duplicadas.

## 21.7. Editor WYSIWYG y pestaña Código

Explica:

- Qué editor o implementación se usa.
- Qué formato genera.
- Cómo se convierte de visual a código.
- Cómo se convierte de código a visual.
- Cómo se sincronizan las pestañas.
- Cómo se sanitiza.
- Cómo se evita HTML escapado.
- Cómo se evita pérdida de formato.
- Cómo se renderiza públicamente.

## 21.8. Publicación

Explica:

- Cómo se guarda.
- Dónde se persiste.
- Cómo se publica.
- Cómo se actualiza contenido existente.
- Cómo se invalida caché si aplica.
- Cómo se evita duplicar contenido.
- Cómo se mantiene slug/SEO.

## 21.9. Menú lateral

Explica:

- Dónde estaba definido.
- Cómo se añadió “Web Admin”.
- Cómo se controlan permisos si aplica.
- Cómo se verificó navegación a /intranet/admin.

## 21.10. Calculadora

Explica:

- De dónde salían los contadores.
- Por qué había 249 registros “a revisar”.
- Cuántos pasaron finalmente a “verificados”.
- Si alguno quedó pendiente, indica motivo exacto.
- Confirma contador final.
- Confirma que el total sigue siendo 483.
- Confirma que no se alteraron cálculos legales indebidamente.

## 21.11. Seguridad

Explica:

- Qué protecciones existen.
- Qué se reforzó.
- Qué endpoints están protegidos.
- Cómo se valida server-side.
- Cómo se sanitiza.
- Qué queda pendiente si aplica.

## 21.12. Pruebas

Incluye:

- Pruebas realizadas.
- Resultado de cada prueba.
- Evidencias textuales.
- Datos de prueba creados.
- Si los datos de prueba fueron eliminados o quedaron publicados.
- Resultado de pruebas de doble pestaña.
- Resultado de pruebas de calculadora.
- Resultado de pruebas de menú lateral.

## 21.13. Confirmación obligatoria

Confirma explícitamente:

- Que NO se ha rediseñado ni modificado la página pública principal del blog.
- Que NO se ha rediseñado ni modificado la página pública de FAQ.
- Que la web pública solo se usó para verificar publicación/lectura.
- Si se tocó algún archivo público por necesidad técnica, explicar exactamente cuál, por qué era imprescindible y qué se cambió sin alterar diseño.

---

# 22. CRITERIOS DE ACEPTACIÓN

La tarea solo está terminada si se cumple todo esto:

- /intranet/admin queda auditado y mejorado.
- /intranet/dashboard tiene enlace “Web Admin” en el menú lateral.
- El enlace “Web Admin” lleva correctamente a /intranet/admin.
- /intranet/admin/blog funciona como CMS tipo WordPress.
- /intranet/admin/faq funciona como CMS tipo WordPress.
- Se pueden crear posts reales.
- Se pueden editar posts reales.
- Los posts nuevos se publican realmente.
- Los posts editados se actualizan realmente.
- Cada post tiene dos pestañas: “Editor visual” y “Código”.
- Al editar un post existente, el contenido carga con formato correcto en “Editor visual”.
- Al editar un post existente, el contenido fuente carga correctamente en “Código”.
- El sistema convierte correctamente de código a visual y de visual a código.
- Cambiar entre pestañas no rompe ni pierde formato.
- Guardar desde cualquiera de las pestañas mantiene el contenido correctamente.
- Al volver a editar un post guardado, no aparece sin formato, como texto plano ni con HTML escapado.
- Se pueden crear FAQ reales.
- Se pueden editar FAQ reales.
- Las FAQ nuevas se publican realmente.
- Las FAQ editadas se actualizan realmente.
- Las categorías son desplegables reales.
- No se permiten categorías inválidas.
- El editor es visual tipo Word.
- El contenido se convierte automáticamente al formato correcto.
- El contenido se sanitiza.
- La persistencia es real.
- La publicación es real.
- Se gestiona caché/revalidación si aplica.
- La calculadora mantiene 483 registros totales.
- Los registros “a revisar” pasan a “verificados” solo tras validación real.
- Si todos son válidos, la calculadora queda en:
  - 483 verificados (100%) · 0 a revisar (0%) de 483 totales.
- Si alguno no puede verificarse, queda documentado con motivo exacto.
- No se rediseña la web pública.
- README.md queda actualizado.
- CHANGELOG.md queda actualizado.
- Hay pruebas documentadas.

IMPORTANTE FINAL

No hagas una mejora superficial.
No crees solo una interfaz bonita.
No uses datos mock como solución final.
No guardes en una fuente que la web pública no lee.
No instales WordPress.
No rediseñes la web pública.
No cambies solo textos o contadores sin cambiar la fuente real.
No marques registros como verificados sin validar.
Audita primero, encuentra causa raíz, implementa un CMS propio estilo WordPress sobre la arquitectura existente, corrige persistencia/publicación/conversión/revalidación, añade doble pestaña visual/código, verifica calculadora, prueba todo y documenta.