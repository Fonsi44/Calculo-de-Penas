# 09 — Arquitectura de información

## Principio

Cada tema tiene un propietario canónico. Las demás páginas deben **resumir y enlazar**, no recrear la sección completa.

| Tema | Página propietaria | Uso permitido en otras páginas |
|---|---|---|
| Propuesta general | `/` | no repetir el hero completo |
| Historia, misión, visión y valores | `/despacho` | 1–2 frases en portada |
| Método general de trabajo | `/despacho` | 3 pasos resumidos en portada |
| Equipo completo | `/despacho` | tarjeta compacta o enlace |
| Perfil individual | `/equipo/[slug]` | referencia contextual mínima |
| Catálogo de áreas | `/servicios-juridicos` | cuatro destacadas en portada |
| Defensa penal completa | `/derecho-penal` | prioridad breve en portada/servicios |
| Servicio específico | URL del servicio | tarjeta/resumen en hubs |
| Atención Honduras–España | `/hondurenos-en-espana` | resumen y enlace fuera del hub |
| Evaluación/contacto | `/solicitar-consulta` | CTA breve |
| FAQ corporativa | `/preguntas-frecuentes` | enlace desde páginas específicas |
| FAQ de materia | página de área/servicio | no copiar a FAQ general |
| Dirección/mapa | `/como-llegar` | NAP corto y enlace |
| Cobertura territorial | landings/hub local | chips o una frase fuera de local |
| Honorarios/contratación | `/preguntas-frecuentes` + `/despacho` | trust microcopy |
| Urgencia penal | `/derecho-penal` | callout compacto en Consulta/local penal |
| Documentos iniciales | servicio específico | regla general junto al formulario |
| Aviso jurisdiccional España | `/hondurenos-en-espana` | versión breve en subservicios |
| Guías del blog destacadas | contexto no-blog | máximo 3–4, sin auditar artículo |

## Propósito de rutas principales

### `/`

**Propósito principal:** orientar y convertir.
**Pregunta:** «¿Puede este despacho ayudarme y por dónde empiezo?»
**Acción:** elegir problema o solicitar evaluación.
**Exclusivo:** propuesta general, cuatro prioridades, prueba resumida.
**Enlazar, no repetir:** historia, equipo completo, método completo, catálogo completo.

### `/despacho`

**Propósito:** demostrar quién presta el servicio y cómo trabaja.
**Pregunta:** «¿Quiénes son, qué experiencia tienen y cómo gestionarán mi caso?»
**Acción:** abrir perfil o solicitar consulta.
**Exclusivo:** historia, misión, valores, equipo, método, asignación y credenciales.

### `/servicios-juridicos`

**Propósito:** catálogo canónico.
**Pregunta:** «¿Qué área corresponde a mi situación?»
**Acción:** buscar/seleccionar un área.
**Exclusivo:** buscador y catálogo completo.
**Enlazar:** procesos, abogados, FAQs y guías de cada área.

### `/derecho-penal`

**Propósito:** hub comercial y operativo de la especialidad prioritaria.
**Pregunta:** «¿Qué debo hacer ahora y qué defensa ofrecen?»
**Acción:** contacto urgente o elegir subservicio.
**Exclusivo:** urgencia, alcance penal, responsable, etapas penales resumidas.

### `/hondurenos-en-espana`

**Propósito:** resolver la distancia y el límite jurisdiccional.
**Pregunta:** «¿Qué puedo gestionar en Honduras desde España?»
**Acción:** elegir trámite o consulta remota.
**Exclusivo:** coordinación documental, poderes y delimitación Honduras/España.

### `/solicitar-consulta`

**Propósito:** convertir.
**Pregunta:** «¿Cómo contacto y qué información debo enviar?»
**Acción:** completar formulario, llamar o WhatsApp.
**Exclusivo:** formulario, privacidad operativa, urgencia y canales.

### `/preguntas-frecuentes`

**Propósito:** consolidar dudas corporativas.
**Pregunta:** «¿Cómo funciona la primera atención y la contratación?»
**Acción:** resolver duda o ir a consulta/servicio.
**Exclusivo:** confidencialidad, presupuesto, asignación, cobertura general y canales.

### Páginas locales

**Propósito:** explicar cobertura real en una ciudad.
**Pregunta:** «¿Atienden mi municipio y desde dónde?»
**Acción:** contactar o abrir servicio.
**Exclusivo:** contexto local verificable, distancia/modalidad, instituciones y FAQ territorial.
**No repetir:** catálogo completo, historia completa, claims genéricos extensos.

## Recorridos simplificados

1. Detenido: local/Google → Penal → urgencia → llamada/WhatsApp.
2. Divorcio/custodia: Home problema → Familia → documentos/proceso → consulta.
3. Despido: Home problema/Search → Laboral → documentos → consulta.
4. Propiedad/herencia: Home → Civil/Notarial → alcance → consulta.
5. Empresa/regulatorio: Servicios Search → área → alcance/autoridad → consulta.
6. España: hub España → trámite → documentación → consulta remota.
7. No sabe área: selector Home → Search Servicios → consulta si no encuentra.
8. Dirección/teléfono: header/footer → Cómo llegar; sin atravesar contenido comercial.
