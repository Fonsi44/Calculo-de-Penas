# Clouding.io — VPS para despliegue

## Proveedor

[Clouding.io](https://clouding.io) — VPS con sede en España (Barcelona/Madrid). Acepta pago por PayPal, tarjeta o Bizum.

## Plan contratado

| Recurso | Valor |
|---|---|
| RAM | 2 GB |
| vCPU | 1 núcleo |
| SSD | 30 GB |
| Precio | 8 €/mes |
| Sistema | Ubuntu 24.04 LTS (recomendado) |

## API

- **Endpoint**: `https://api.clouding.io/v1`
- **Autenticación**: API Key (guardada en `.env` como `CLOUDING_API_KEY`)
- **Documentación**: https://apidocs.clouding.io

## SSH

- **Clave pública**: guardada en `.env` como `CLOUDING_SSH_KEY`
- **Propósito**: acceso root al VPS para Docker, actualizaciones, etc.

## Uso previsto

Despliegue opcional de Twenty CRM (open-source) cuando se decida:

1. Crear servidor vía API de Clouding
2. Instalar Docker + Docker Compose
3. Clonar twenty y arrancar con docker-compose
4. Configurar dominio `crm.pinedayasocioshn.com` apuntando a la IP del VPS
5. SSL con Certbot / Caddy / Traefik

## Notas

- No se ha creado el servidor aún — solo se tienen las credenciales.
- Pendiente de decisión: instalar Twenty local primero o directamente en Clouding.
