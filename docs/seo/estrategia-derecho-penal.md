---
status: current
owner: seo
created: 2026-07-02
last_reviewed: 2026-08-06
review_due: 2026-11-04
supersedes: null
superseded_by: null
---
# Estrategia SEO — Derecho Penal (Jul 2026)

## Fuentes de datos
- Auditoría SEO de contenido (`npm run blog:seo-audit`)
- Health check (`npm run seo:health`)
- Indexabilidad (`npm run audit:seo`)
- Canibalización (`npm run audit:canibalizacion`)
- Rendimiento público (`npm run audit:performance`)
- Indexación prioritaria (`npm run audit:indexacion`)
- Metadatos (`npm run validar:meta-seo`)
- Enlaces internos (`npm run audit:internal-links`)
- MCP SEO (event loop error — no disponible)
- Web fetch directo a URLs públicas

## Resultados de los scripts
| Script | Resultado |
|--------|-----------|
| `seo:health` | 15/15 OK |
| `audit:canibalizacion` | 1 grupo menor (abogados-en-* local) |
| `audit:seo` | 0 errores, 0 warnings |
| `auditar-indexacion-prioritaria` | 30/30 probes OK |
| `validar:meta-seo` | 18/18 URLs OK |
| `auditar-performance-publico` | 0 alertas críticas |
| `audit:internal-links` | Media 6.4 links internos/post penal |
| `blog:seo-audit` | 18 posts sin meta_title (no crítico) |

## Keywords objetivo priorizadas

### Intención transaccional (contratación)
| Keyword | URL objetivo | Prioridad |
|---------|-------------|-----------|
| abogado penalista Nacaome | /derecho-penal | 🔴 Crítica |
| defensa penal Valle Honduras | /derecho-penal | 🔴 Crítica |
| abogado penalista San Lorenzo | /derecho-penal | 🔴 Crítica |
| abogado penalista Choluteca | /derecho-penal | 🔴 Crítica |
| bufete penal Nacaome | /derecho-penal | 🟡 Alta |
| abogado detención Honduras | /derecho-penal | 🟡 Alta |
| asesoría penal Honduras | /derecho-penal | 🟡 Alta |

### Intención informativa (cluster)
| Keyword | URL objetivo | Prioridad |
|---------|-------------|-----------|
| proceso penal Honduras | /proceso-penal | 🔴 Crítica |
| etapas proceso penal Honduras | /proceso-penal | 🟡 Alta |
| audiencia inicial Honduras | /proceso-penal | 🟡 Alta |
| juicio oral Honduras | /proceso-penal | 🟡 Alta |
| defensa penal Honduras | /derecho-penal | 🟡 Alta |
| Código Penal Honduras | /derecho-penal | 🟢 Media |

### Intención local (zona sur)
| Keyword | URL objetivo | Prioridad |
|---------|-------------|-----------|
| abogado penalista sur Honduras | /derecho-penal | 🔴 Crítica |
| defensa penal Nacaome Valle | /derecho-penal | 🔴 Crítica |
| abogado penal Valle Honduras | /derecho-penal | 🟡 Alta |
| asistencia a detenidos Honduras | /derecho-penal | 🟡 Alta |

### Urgencia penal
| Keyword | URL objetivo | Prioridad |
|---------|-------------|-----------|
| que hacer si me detienen Honduras | /blog/derecho-penal/... | 🟡 Alta |
| abogado urgente penalista Valle | /derecho-penal | 🟡 Alta |

## URLs objetivo
| URL | Tipo | Cambio |
|-----|------|--------|
| /derecho-penal | Pilar penal | Mejorada: keywords, enlazado, imagen Danilo |
| /proceso-penal | Satélite penal | Nueva: guía del proceso penal hondureño |

## Contenidos nuevos/modificados

### /proceso-penal (NUEVO)
- Página satélite sobre el proceso penal hondureño
- 6 etapas detalladas con riesgos y acciones
- 5 FAQ con preguntas frecuentes
- Enlaces internos a /derecho-penal (pilar), landings locales, blog posts
- JSON-LD: Service, FAQPage, BreadcrumbList
- BlogHighlights con 6 posts penales relacionados
- CTA a consulta y a página pilar

### /derecho-penal (MEJORADO)
- Keywords ampliadas (12 vs 8 anteriores)
- Nueva imagen Danilo Pineda (danilo-pineda-maradiaga-penal.webp)
- Banner de enlace interno a /proceso-penal
- Artículos relacionados ampliados (6 vs 3)

## Imagen convertida
| Archivo | Dimensiones originales | Dimensiones finales | Tamaño original | Tamaño WebP | Reducción |
|---------|----------------------|---------------------|----------------|-------------|-----------|
| Danilo.Pineda.Maradiaga.jpeg → danilo-pineda-maradiaga-penal.webp | 1220×1619 | 800×1000 | 128,275 bytes | 52,418 bytes | 59.1% |

### Imágenes de referencia existentes de Danilo Pineda
| Archivo | Dimensiones | Tamaño | Uso |
|---------|------------|--------|-----|
| `danilo-pineda-maradiaga.webp` | 800×1000 | 61,618 bytes | Principal — home, /despacho, schema Person |
| `danilo-pineda-maradiaga-alt.webp` | 800×1000 | 131,798 bytes | Alternativa — /derecho-penal, sidebar |
| `danilo-pineda-maradiaga-penal.webp` | 800×1000 | 52,418 bytes | Nueva — estrategia penal (2026-07-02) |

Todas las imágenes comparten las mismas dimensiones (800×1000 = 4:5) para consistencia visual.

### Metadatos de imagen (añadidos en `data/images.ts`)
- Persona: Danilo Pineda Maradiaga
- Cargo: Abogado penalista · Socio director
- Firma: Pineda y Asociados Bufete Jurídico
- Ubicación: Nacaome, Valle, Honduras
- Alt text: "Abogado penalista Danilo Pineda Maradiaga en Nacaome, Valle, Honduras"
- Title: "Danilo Pineda Maradiaga, abogado penalista"
- Descripción: "Fotografía profesional de Danilo Pineda Maradiaga, abogado penalista de Pineda y Asociados en Nacaome, Valle, Honduras"
- Keywords: abogado penalista Nacaome, abogado penal Honduras, defensa penal Valle, Pineda y Asociados, Danilo Pineda Maradiaga
- Copyright: No documentado — pertenece al despacho

Ruta: `public/images/equipo/danilo-pineda-maradiaga-penal.webp`
Alt: "Danilo Pineda Maradiaga, abogado penalista en Nacaome, Valle, Honduras — defensa penal"

## Schema aplicado
| Página | JSON-LD | Cambio |
|--------|---------|--------|
| /derecho-penal | Service + FAQPage + BreadcrumbList | Existente (mejorado) |
| /proceso-penal | Service + FAQPage + BreadcrumbList | Nuevo |
| Layout global | LegalService + Organization + WebSite + Person ×3 | Sin cambios |

## Enlaces internos añadidos
| Desde | Hacia | Ancla |
|-------|------|-------|
| /derecho-penal | /proceso-penal | "guía completa del proceso penal en Honduras" |
| /proceso-penal | /derecho-penal | "Ver defensa penal completa" |
| /proceso-penal | /derecho-penal | "Conozca nuestra defensa penal" |
| /proceso-penal | /abogados-en-nacaome | "Nacaome, Valle" |
| /proceso-penal | /abogados-en-san-lorenzo | "San Lorenzo" |
| /proceso-penal | /abogados-en-choluteca | "Choluteca" |
| /proceso-penal | 6 blog posts vía BlogHighlights | Varios |

## Indexadores usados
| Indexador | Método | Estado |
|-----------|--------|--------|
| IndexNow (Bing) | `node scripts/submit-indexnow.mjs` | Pendiente (postbuild) |
| IndexNow (Yandex/Seznam) | Mismo endpoint | Pendiente |
| Sitemap XML | Auto en build | Actualizado con /proceso-penal |

## Comandos ejecutados
```bash
# Conversión de imagen
node -e "sharp('docs/imagenes/Danilo.Pineda.Maradiaga.jpeg').resize(400,500).webp({quality:85}).toFile('public/images/equipo/danilo-pineda-maradiaga-penal.webp')"

# Validación SEO previa
npm run seo:health
npm run audit:canibalizacion
npm run blog:seo-audit
npm run validar:meta-seo
npm run audit:indexacion
npm run audit:seo
npm run audit:performance
npm run audit:internal-links

# Compilación
npm run build
```

## Próximos pasos
1. Monitorear indexación de /proceso-penal en GSC/Bing
2. Crear más contenido satélite penal (delitos patrimoniales, violencia doméstica)
3. Mejorar E-E-A-T con perfiles sociales verificados
4. Backlinks desde directorios legales de Honduras
5. Auditoría de conversiones en página penal
6. Evaluar creación de videos/blog posts sobre proceso penal
