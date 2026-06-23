# Google Business Profile — UTM Links

## Parámetros UTM estándar

Utilizar para todos los enlaces desde GBP hacia el sitio web.

### Formato base
```
https://www.pinedayasociadoshn.com/{ruta}?utm_source=gbp&utm_medium={medium}&utm_campaign={campaign}
```

### Tabla de combinaciones

| Página destino | medium | campaign | Ejemplo completo |
|---------------|--------|----------|------------------|
| `/` (Home) | `gbp-profile` | `home` | `/?utm_source=gbp&utm_medium=gbp-profile&utm_campaign=home` |
| `/solicitar-consulta` | `gbp-button` | `consulta` | `/solicitar-consulta?utm_source=gbp&utm_medium=gbp-button&utm_campaign=consulta` |
| `/blog/derecho-de-familia/pension-alimenticia-porcentaje-honduras-2026` | `gbp-post` | `post1-pension` | (completo) |
| `/blog/derecho-de-familia/custodia-hijos-honduras-juez` | `gbp-post` | `post2-custodia` | (completo) |
| `/servicios-juridicos/derecho-de-familia` | `gbp-service` | `familia` | (completo) |
| `/servicios-juridicos` | `gbp-service` | `servicios` | (completo) |
| `/despacho` | `gbp-profile` | `despacho` | (completo) |

## UTM en enlaces del sitio web hacia GBP

Enlace ya configurado en `lib/site.ts`:
```
site.googleBusiness = 'https://maps.app.goo.gl/giJcUrJ7yaVHpnkCA'
```
No requiere UTM (Google Maps redirect).

## Medición

Los UTM permiten segmentar tráfico desde GBP en Google Analytics 4:
- Source: `gbp`
- Medium: `gbp-profile`, `gbp-button`, `gbp-post`, `gbp-service`
- Campaigns: identificar cada iniciativa

Crear informe GA4 con filtro `source = "gbp"` para medir impacto.
