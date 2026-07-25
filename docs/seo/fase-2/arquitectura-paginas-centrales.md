# Arquitectura de páginas centrales — FASE 2

**Fecha:** 2026-07-25
**Rama:** `main` (HEAD al inicio `eab29d69`)
**Modo:** `IMPLEMENTACIÓN`
**Base:** FASE 1 (`docs/seo/fase-1/`), `AGENTS.md`, `AUDITORIA_SEO_GEO_LEGAL_PINEDA.md`.

---

## 1. Decisión de rutas (adaptación a la realidad del repo)

La instrucción FASE 2 lista `/contacto` y `/faq` como páginas prioritarias.
El repositorio **no las tiene como rutas indexables**: son **redirects 301**
declarados en `next.config.ts`:

```text
/faq        →  /preguntas-frecuentes   (statusCode 301)
/contacto   →  /solicitar-consulta      (permanent)
```

La restricción §2 («No cambiar URLs indexadas») y R19 prohíben alterar esa
canalización. Por tanto, **FASE 2 trabaja sobre las rutas reales**:

| Ruta pedida en instrucción | Ruta real en repo | Función FASE 2 |
| -------------------------- | ----------------- | -------------- |
| `/`                        | `/`               | Inicio |
| `/despacho`                | `/despacho`       | Despacho |
| `/servicios-juridicos`     | `/servicios-juridicos` | Índice de servicios |
| `/solicitar-consulta`      | `/solicitar-consulta` | **Conversión + contacto** (absorbe `/contacto`) |
| `/contacto`                | (301 → `/solicitar-consulta`) | Sin página propia |
| `/como-llegar`             | `/como-llegar`    | Cómo llegar |
| `/faq`                     | (301 → `/preguntas-frecuentes`) | Sin página propia |
| `/preguntas-frecuentes`    | `/preguntas-frecuentes` | **FAQ central** (absorbe `/faq`) |

No se crean páginas nuevas en `/contacto` ni `/faq`. El contenido de contacto
que la instrucción reserva para `/contacto` se consolida en `/solicitar-consulta`
(datos NAP, mapa, horario, urgencias, privacidad, expectativa de respuesta).

---

## 2. Función única por página

| Página | Intención de búsqueda principal | Función única | Evita competir con |
| ------ | ------------------------------- | ------------- | ------------------ |
| Inicio (`/`) | «abogados Nacaome» / problema jurídico sur Honduras | Presentar el despacho y dirigir al problema correcto | No profundiza en áreas (lo hace `/servicios-juridicos`) ni en identidad (lo hace `/despacho`) |
| Despacho (`/despacho`) | «bufete Nacaome», identidad y método | Demostrar identidad, método y confianza con datos reales | No lista todas las áreas (lo hace servicios) ni captura leads (lo hace consulta) |
| Servicios (`/servicios-juridicos`) | «áreas del derecho Nacaome», problema→área | Organizar las áreas por necesidad, sin inflarlas | No repite identidad del bufete (lo hace despacho) |
| Solicitar consulta (`/solicitar-consulta`) | «consulta abogado Nacaome», contacto | Convertir visitas cualificadas + dar NAP/urgencias | No duplica FAQ jurídica (lo hace preguntas-frecuentes) |
| Cómo llegar (`/como-llegar`) | «cómo llegar Nacaome», dirección bufete | Facilitar la visita a la sede real de Nacaome | No repite servicios, solo logística de visita |
| Preguntas frecuentes (`/preguntas-frecuentes`) | «dudas abogado Honduras», FAQ | Resolver dudas de contratación y funcionamiento (sin duplicar derecho material) | No es repositorio de palabras clave; no repite P01–P15 |

---

## 3. Jerarquía de la portada (Inicio) — FASE 2

Orden definitivo de secciones de `/`:

1. **Hero** — quién, dónde, en qué ayuda, qué hacer. H1 único.
2. **TrustBar** — sellos de autoridad (existente, conserva).
3. **Selector por problema** — **NUEVO FASE 2**. 6 accesos comprensibles a páginas reales.
4. **Áreas principales** — penal, familia, laboral, civil y notarial (4 cards existentes).
5. **Cómo trabaja el despacho** — proceso (stepper existente).
6. **Por qué elegirnos** — editorial existente (+15 años, estrategia unificada).
7. **Equipo confirmado** — enlace al dueño canónico `/despacho` (no duplica).
8. **Cobertura territorial real** — bloque NAP + mapa (existente «Visítenos»).
9. **Atención para hondureños en España** — **NUEVO FASE 2**. Bloque breve con enlace a `/hondurenos-en-espana`.
10. **Confianza y límites** — **NUEVO FASE 2**. Elementos confirmados + aviso de límites.
11. **Guías destacadas** — enlazado interno a blog (existente).
12. **CTA final** — `ConsultationCTA` (existente).

Respeto de R5: no se rediseña visualmente. Las nuevas secciones reutilizan
componentes del design system (`Section`, `Card`, `EditorialBlock`,
`IconBadge`, design tokens canónicos R16).

---

## 4. Jerarquía de `/despacho` — FASE 2

Orden definitivo:

1. Hero + TrustBar (existentes).
2. **Quiénes somos** — `AnswerBlock` canónico (existente).
3. **Sede y ámbito de atención** — hero corporativo (existente).
4. **Métricas + estado oficina** (existente).
5. **Misión, visión y valores** (existente).
6. **Equipo confirmado** — 3 socios con matriz canónica FASE 1 (existente, dueño canónico).
7. **Cómo se asignan los asuntos** — **NUEVO FASE 2** (bloque breve).
8. **Cómo trabajamos** — stepper (existente).
9. **Confidencialidad** — **NUEVO FASE 2** (bloque dentro de visión multidisciplinar).
10. **Presupuesto y contratación** — **NUEVO FASE 2** (bloque breve).
11. **Lo que el despacho no garantiza** — **NUEVO FASE 2** (aviso de límites).
12. CTA + FAQ hub (existentes).

Sin afirmaciones P10–P12 reforzadas: la condición «colegiado» se muestra solo
vía badges condicionales (`FOUNDER_PROFILE.cah`, etc.) y la antigüedad se
mantiene en la formulación ya existente sin añadir nuevas cifras.

---

## 5. Jerarquía de `/servicios-juridicos` — FASE 2

Bloques comprensibles por necesidad (sin inflar áreas, sin cambiar páginas individuales):

- **Personas y familia**: penal · familia · laboral · civil · notarial
- **Empresas y actividad económica**: mercantil · bancario · tributario · administrativo · aduanero
- **Sectores regulados**: sanitario · ambiental · propiedad intelectual
- **Resolución de conflictos**: negociación · conciliación · arbitraje · litigios
- **Hondureños en España**: enlace a `/hondurenos-en-espana`

Cada bloque muestra problema que atiende, tipo de cliente y enlace real.
Se conserva el catálogo completo de 14 áreas (ServiceCard grid) y la matriz
de orientación problema→área existente. **No se eliminan servicios.**

---

## 6. Jerarquía de `/solicitar-consulta` (absorbe `/contacto`) — FASE 2

1. Hero + TrustBar (existentes).
2. **Cómo funciona la consulta** — `AnswerBlock` (existente).
3. **Formulario mejorado** — **NUEVOS CAMPOS FASE 2**:
   - Iniciales: nombre, teléfono o correo, medio preferido, tipo general de asunto, localidad o país, urgencia, descripción breve, consentimiento.
   - Condicionales: fecha de audiencia/citación, detención, fecha de despido, residencia en España, disponibilidad para llamada.
   - Confirmación ampliada: recibido, plazo prudente, urgencia penal, no aceptación implícita, no originales, protección de datos.
4. **Contacto directo** (teléfono/WhatsApp), **emergencia penal** y **motivos frecuentes** (existentes).
5. **Bloque NAP + mapa** — «Visítenos» existente (consolida el rol de `/contacto`).
6. FAQ hub (existente).

Endpoint `/api/consulta`: se amplía el schema Zod con **campos opcionales**
(sin romper backwards compatibility). Backend existente se conserva; no se
modifica motor de cálculo ni auth.

---

## 7. Jerarquía de `/como-llegar` — FASE 2

Conserva distancias corregidas en FASE 1 (Choluteca ~55 km, San Lorenzo ~18 km,
Amapala ~45 km). Refuerzo de **matiz «sede real vs. zonas atendidas»**:

- Sede física única: Nacaome.
- Las demás localidades son zonas atendidas, no oficinas.
- Distancias/tiempos aproximados, pueden variar según ruta y tráfico.
- Enlace al mapa y referencias reales (Hondutel, Clínica Andara).
- Accesibilidad/estacionamiento: **no se afirma si no está confirmado**.

Sin nuevos datos cartográficos inventados.

---

## 8. Jerarquía de `/preguntas-frecuentes` (FAQ central) — FASE 2

Mantiene clusters existentes (penal, laboral, familiar, civil, servicios,
consultas, honorarios, atención local). FASE 2 añade / refuerza preguntas de
**contratación y funcionamiento** (no de derecho material):

- Cómo solicitar consulta.
- Qué información preparar.
- Cómo se entrega el presupuesto.
- Qué ocurre después del primer contacto.
- Si se atienden urgencias.
- Si se atiende a personas de otras localidades.
- Cómo se trabaja con clientes en España.
- Confidencialidad y documentos.
- Medios de pago: **solo si política confirmada** (no inventada).

Reglas: no duplicar respuestas jurídicas de páginas de servicios; no
reutilizar P01–P15; respuesta visible y JSON-LD coincidentes.

---

## 9. Coherencia NAP y dominio

- **Dominio canónico:** `https://www.pinedayasociadoshn.com` (de `site.url`).
  No se usa `pinedayasocioshn.com` ni `pinedayasociadoshn.com` sin `www`.
- **NAP fuente única:** `lib/site.ts`. Cualquier teléfono, dirección, correo u
  horario visible se deriva de `site.*`, sin literales divergentes.
- faqs-hubs.ts FASE 2: se corrige el horario divergente («lun-vie 8-17» →
  `site.hours`) y se deriva el WhatsApp de `site`.

---

## 10. Restricciones respetadas

- No se toca el blog, artículos, categorías, autores ni componentes exclusivos.
- No se toca SGIE, intranet, administración, auth ni DB privada.
- No se crean artículos ni páginas geográficas nuevas.
- No se cambian URLs indexadas (§2, R19).
- No se inventan profesionales, colegiaciones, formación, oficinas, colaboradores,
  reseñas, casos, estadísticas ni resultados.
- No se publican como verificadas las afirmaciones P01–P15.
- No se refuerza `foundingDate: 2010`, «+15 años» con nuevas ubicaciones,
  «colegiados» sin nº ni especialidades pendientes.
- No se prometen resultados, respuesta inmediata ni plazos cerrados.
- No se instalan dependencias nuevas.
