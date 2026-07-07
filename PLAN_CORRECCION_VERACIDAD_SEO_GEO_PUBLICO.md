# Plan de Corrección: Veracidad, SEO y GEO (Público)

Este documento contiene las tareas accionables derivadas de la auditoría de la web pública de Pineda y Asociados, priorizadas por impacto y riesgo.

---

## 1. Prioridad Crítica (Bloqueo YMYL / E-E-A-T)

### Tarea 1.1: Verificación de Huella Digital de Abogados (Entidades)
- **URL/Página afectada:** `lib/site.ts` (Schemas `Person`), `/despacho`, Home.
- **Tipo de problema:** Reputación, YMYL, E-E-A-T, Veracidad Externa.
- **Problema detectado:** Google Search no devuelve resultados concluyentes ni independientes para "Danilo Pineda Maradiaga", "Thania Marlene Paz" ni "Emil Barahona" como abogados en Honduras. Esto debilita severamente el factor "Autoridad" y "Confianza" exigido por Google para sitios legales (YMYL).
- **Riesgo:** Alta probabilidad de que Google no asigne un Knowledge Graph al bufete y limite el posicionamiento de las landings comerciales por falta de autoridad verificable.
- **Recomendación exacta:** 
  1. Crear y optimizar perfiles de LinkedIn para los tres abogados.
  2. Publicar sus perfiles en directorios legales confiables de Honduras.
  3. Añadir el número de colegiación del Colegio de Abogados de Honduras (CAH) en la descripción de cada perfil dentro del sitio web.
  4. Vincular estas nuevas URLs externas en la propiedad `sameAs` del `founderSchema` y `emilSchema` en `lib/site.ts`.
- **Fuente de validación:** Directrices E-E-A-T de Google Search Central.
- **Esfuerzo estimado:** Medio (requiere acción del cliente para proveer credenciales reales).
- **¿Antes de indexar?:** Sí, es vital enlazar al menos un perfil de LinkedIn verificado antes de someter el sitio completo a indexación profunda.

---

## 2. Prioridad Alta (Mejoras SEO / GEO)

### Tarea 2.1: Enriquecimiento de Schema `LegalService` con Redes Sociales
- **URL/Página afectada:** `lib/site.ts` (Objeto `site.social`).
- **Tipo de problema:** SEO, JSON-LD, E-E-A-T.
- **Problema detectado:** Faltan URLs oficiales de redes sociales (Instagram, LinkedIn, YouTube). Solo están configurados Facebook y X.
- **Riesgo:** Pérdida de señales de confianza cruzada para el motor de búsqueda.
- **Recomendación exacta:** El despacho debe proveer y crear canales oficiales en LinkedIn y posiblemente Instagram. Una vez creados, deben añadirse a las variables de entorno `NEXT_PUBLIC_SOCIAL_*` para que se propaguen al `sameAs` del `organizationSchema`.
- **Fuente de validación:** Search Essentials de Google (Identidad de la empresa).
- **Esfuerzo estimado:** Bajo (Solo llenar variables de entorno cuando existan).
- **¿Antes de indexar?:** No es bloqueante, pero muy recomendable.

---

## 3. Prioridad Media

### Tarea 3.1: Fortalecimiento del Archivo `llms.txt`
- **URL/Página afectada:** Generación de `llms.txt` (si existe) o su futura implementación.
- **Tipo de problema:** GEO (Generative Engine Optimization).
- **Problema detectado:** Falta asegurar que las respuestas que darán ChatGPT o Perplexity sobre el bufete estén pre-alimentadas con un resumen factual estricto en la raíz del sitio.
- **Riesgo:** Que motores de IA alucinen sobre los servicios o la jurisdicción (aplicando leyes de España a Honduras por similitud de idioma).
- **Recomendación exacta:** Crear un archivo `/llms.txt` en la raíz pública (`app/(public)`) que resuma en texto plano la identidad, ubicación, servicios exactos y el disclaimer legal, diseñado exclusivamente para ser leído por rastreadores de IA.
- **Fuente de validación:** Nuevos estándares de optimización para LLMs.
- **Esfuerzo estimado:** Bajo.
- **¿Antes de indexar?:** No.

---

## 4. Prioridad Baja

### Tarea 4.1: Monitorización Continua de Términos Legales
- **URL/Página afectada:** `/disclaimer`, `/terminos`.
- **Tipo de problema:** Legal, Reputacional.
- **Problema detectado:** Ninguno en este momento (la redacción actual es excelente). El riesgo radica en desactualización futura.
- **Riesgo:** Cambios en el Código Penal o jurisprudencia que desfasen el disclaimer.
- **Recomendación exacta:** Establecer una tarea trimestral en el calendario del equipo legal para revisar las páginas `/disclaimer` y `/aviso-legal` asegurando que las leyes citadas sigan siendo las vigentes.
- **Fuente de validación:** Principio de Transparencia de la Política Editorial del sitio.
- **Esfuerzo estimado:** Muy bajo.
- **¿Antes de indexar?:** No.
