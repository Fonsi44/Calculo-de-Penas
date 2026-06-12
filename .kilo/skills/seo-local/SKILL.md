---
name: seo-local
description: Optimización de SEO local para el bufete Pineda y Asociados en Nacaome, Valle, Honduras. Cubre Google Business Profile, NAP, geo tags, LocalBusiness schema, keywords geográficas y presencia en directorios locales.
---

# SEO Local — Nacaome, Valle, Honduras

Skill para optimizar la presencia local del bufete.

## Datos NAP (Name, Address, Phone)

Estos datos deben ser idénticos en TODO el sitio y en Google Business Profile:

```
Nombre: Pineda y Asociados
Dirección: [verificar en /intranet/admin/config]
Teléfono: [verificar en /intranet/admin/config]
Ciudad: Nacaome
Departamento: Valle
País: Honduras
Coordenadas: [verificar geo_lat y geo_lng en /intranet/admin/config]
Horario: [verificar en /intranet/admin/config]
```

## Componentes a verificar

### 1. LocalBusiness + LegalService schema
- Debe incluir `name`, `address` (PostalAddress con streetAddress, addressLocality, addressRegion, addressCountry), `geo` (latitude, longitude), `telephone`, `openingHoursSpecification`, `areaServed`
- Verificar en `lib/site.ts` (funciones `localBusinessSchema()`, `legalServiceSchema()`)
- Debe renderizarse server-side en `app/(public)/layout.tsx`

### 2. Geo meta tags
- `geo.region`: HN-VA (Honduras, Valle)
- `geo.placename`: Nacaome
- `geo.position`: lat;lon (desde DB)
- `ICBM`: lat, lon
- Verificar en `app/(public)/layout.tsx`

### 3. Keywords geográficas en contenido
- Home: "Nacaome", "Valle", "Honduras", "sur de Honduras"
- Despacho: "Nacaome", "Valle"
- Servicios: "Nacaome, Valle" + área de servicio
- Derecho penal: "Nacaome", "Valle" (keyword geo principal)
- Contacto: "Nacaome, Valle, Honduras"

### 4. Google Business Profile
- Verificar que el enlace a Google Business Profile está en el sitio
- Comprobar consistencia de NAP con GBP
- Las reseñas de Google deben ser visibles o referenciadas

### 5. Páginas de ubicación
- `/como-llegar`: debe tener mapa, dirección completa, indicaciones
- Schema `Place` o `LocalBusiness` específico en esta página

## Keywords locales objetivo

| Tipo | Keyword | Página objetivo |
|------|---------|----------------|
| Genérica local | "abogados Nacaome" | Home |
| Especialidad local | "abogados penalistas Nacaome" | /derecho-penal |
| Bufete local | "bufete jurídico Valle Honduras" | /despacho |
| Servicio local | "abogados de familia Nacaome" | /servicios-juridicos/derecho-de-familia |
| Consulta local | "consulta legal Nacaome" | /solicitar-consulta |
| Defensa local | "defensa penal Valle Honduras" | /derecho-penal |

## Verificación

1. Buscar `Nacaome` en el HTML de las páginas principales (debe aparecer en lugares estratégicos)
2. Verificar consistencia de dirección entre `configuracion_sitio` DB y schemas
3. Validar LocalBusiness schema en validator.schema.org
4. Revisar que geo meta tags están presentes en el HTML servido
