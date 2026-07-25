# FASE 4 — Inventario local y Honduras–España

Fecha: 2026-07-25
Modo: IMPLEMENTACIÓN
Estado fuente: HEAD `a478f5d6` + FASES 1–3 sin versionar + FASE 4 aplicada.

## 1. Páginas locales `/abogados-en-{slug}` (16)

Fuente única: `data/landings-locales.ts` (`landingsLocales`).
Plantilla compartida: `components/marketing/landing-local.tsx` (`LandingLocalView`).
Cada wrapper estático reside en `app/(public)/abogados-en-{slug}/page.tsx`.

| URL | Localidad | Departamento | sedeFisica | distanciaKm | servedFrom | Clasificación |
| --- | --------- | ------------ | ---------- | ----------- | ---------- | ------------- |
| /abogados-en-nacaome | Nacaome | Valle | **sí** | 0 | Nacaome (sede) | A — sólida y diferenciada |
| /abogados-en-choluteca | Choluteca | Choluteca | no | 55 | Nacaome | A — diferenciada (sección contexto local) |
| /abogados-en-san-lorenzo | San Lorenzo | Valle | no | 17 | Nacaome | A — puerto/mercantil |
| /abogados-en-goascoran | Goascorán | Valle | no | 35 | Nacaome | B — frontera El Salvador |
| /abogados-en-san-marcos-de-colon | San Marcos de Colón | Choluteca | no | 80 | Nacaome | B — frontera Nicaragua (El Espino) |
| /abogados-en-el-triunfo | El Triunfo | Choluteca | no | 65 | Nacaome | C — similar a otras de Choluteca |
| /abogados-en-amapala | Amapala | Valle | no | 40 | Nacaome | B — isla/pesca |
| /abogados-en-pespire | Pespire | Choluteca | no | 70 | Nacaome | C |
| /abogados-en-marcovia | Marcovia | Choluteca | no | 60 | Nacaome | C |
| /abogados-en-namasigue | Namasigüe | Choluteca | no | 55 | Nacaome | C |
| /abogados-en-orocuina | Orocuina | Choluteca | no | 70 | Nacaome | C |
| /abogados-en-langue | Langue | Valle | no | 22 | Nacaome | C |
| /abogados-en-caridad | Caridad | Valle | no | 30 | Nacaome | C |
| /abogados-en-alianza | Alianza | Valle | no | 25 | Nacaome | C |
| /abogados-en-concepcion-de-maria | Concepción de María | Choluteca | no | 65 | Nacaome | C |
| /abogados-en-san-antonio-de-flores | San Antonio de Flores | Choluteca | no | 55 | Nacaome | C |

### Clasificación doorway (§4 del pliego)

- **A. Sólida y diferenciada**: Nacaome, Choluteca, San Lorenzo (contenido único propio, secciones extra).
- **B. Útil, necesita algo más de contenido único**: Goascorán, San Marcos de Colón, Amapala (reciben secciones únicas Fase 4).
- **C. Demasiado similar a otras**: El Triunfo, Pespire, Marcovia, Namasigüe, Orocuina, Langue, Caridad, Alianza, Concepción de María, San Antonio de Flores (FAQ plantilla; con modelo territorial mínimo añadido).
- **D. Afirmaciones geográficas dudosas**: ninguna tras la corrección de Choluteca 52→55 km.
- **E. Candidata futura a consolidación**: las marcadas C, pendiente de datos de Search Console y aprobación (no se consolidan en esta fase).

## 2. Páginas de cargo o especialidad por localidad

| URL | Tipo |
| --- | ---- |
| /abogado-penalista-nacaome | Cargo × localidad (penalista) |
| /abogado-penalista-choluteca | Cargo × localidad (penalista) |
| /abogado-laboralista-nacaome | Cargo × localidad (laboralista) |

(Fuera del alcance directo de Fase 4; sin cambios en esta fase salvo lo heredado de Fases 1–3.)

## 3. Cómo llegar

| URL | Sede declarada | Modalidad | Distancia | Schema |
| --- | -------------- | --------- | --------- | ------ |
| /como-llegar | Nacaome (única) | Presencial en sede | Varias (aprox.) | LegalService canónico |

Sin cambios estructurales en Fase 4 (ya cumple: sede única, aviso de distancias aproximadas, evento `click_maps`).

## 4. Hub Honduras–España

| URL | Tipo | Subpáginas |
| --- | ---- | ---------- |
| /hondurenos-en-espana | Hub | 3 subáreas dinámicas |
| /hondurenos-en-espana/[slug] | Subpágina dinámica | gestion-documental-y-legalizacion, actos-notariales-internacionales, asuntos-civiles-y-familiares-desde-el-extranjero |

Fuente: `data/areas-juridicas.ts` (`hubMigrantes`).

### Estado jurisdiccional

- Aviso jurisdiccional visible (`SpainJurisdictionNotice`) en hub y 3 subpáginas.
- Bloque de alcance por jurisdicción (Honduras / coordinable / requiere España).
- Guía de envío seguro de documentación.
- CTA España con `?motivo=hondurenos-en-espana` (whitelist válida).
- **No** se afirma ejercicio del derecho español ni colaboración con despachos españoles.
- **No** se declara sede en España.

## 5. Restricciones respetadas

- Una sola oficina física (Nacaome).
- Ningún `LocalBusiness` por municipio; schema `Service` con `areaServed` por ciudad.
- Sin direcciones, coordenadas o teléfonos locales ficticios.
- Sin afirmaciones `P01–P15` marcadas como `verified`.
- Blog, SGIE, intranet, administración y auth intactos (verificado por tests y git diff).
- Dominio canónico único: `https://www.pinedayasociadoshn.com`.
