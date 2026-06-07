# META BUSINESS — GUÍA DE EJECUCIÓN

Sigue estos pasos en orden. Cada uno tiene un enlace directo.

---

## A1. Crear cuenta Meta for Developers

> **Enlace**: https://developers.facebook.com

```
Hecho: alfonsroiget@gmail.com
```

- [x] Hecho

---

## A2. Crear aplicación tipo Negocio

> **Enlace**: https://developers.facebook.com/apps/

```
Nombre: Pineda y Asociados CRM
```

- [x] Hecho → **ID App**: `1186621923892949`

---

## A3. Agregar producto WhatsApp

> **Enlace**: https://developers.facebook.com/apps/1186621923892949/whatsapp-business/

- [x] Hecho

---

## A4. Crear cuenta comercial WhatsApp

- [x] Hecho → **ID cuenta comercial**: `1603799175088577`

---

## A5. Registrar número de teléfono +34 661911574

- [x] Hecho → **ID número**: `1201622436357912`
- **Número**: +34 661911574
- **WABA ID**: `981792174749339`

---

## A6. System User + Token permanente

> **Enlace**: https://business.facebook.com/settings/system-users?business_id=1603799175088577

⚠️ **EL TOKEN SOLO APARECE UNA VEZ. CÓPIALO AL INSTANTE.**

```
1. "Agregar"
2. Nombre: CRM Integration
3. Rol: Admin → "Crear"
4. En la fila del usuario, icono llave → "Generar token"
5. App: Pineda y Asociados CRM
6. Permiso: solo whatsapp_business_messaging
7. Expiración: 60 días (máximo permitido)
8. "Generar"
9. ⚠️ COPIA EL TEXTO LARGO (empieza con EAA...)
10. Pégalo en un bloc de notas
```

> 💡 Los tokens expiran cada 60 días. El desarrollador puede generar uno nuevo cuando expire sin necesidad de repetir todo el proceso.

- [x] Hecho → **Token**: generado y guardado en .env.local

---

## A7. Guardar en .env.local

- [x] Hecho ✅

---

## B1. Validar token

```powershell
curl -H "Authorization: Bearer EAA..." "https://graph.facebook.com/v25.0/1201622436357912"
```

Respuesta obtenida:
```json
{ "verified_name": "Pineda y Asociados", "display_phone_number": "+34 661 91 15 74" }
```

- [x] Token válido ✅

> ⚠️ **Los tokens expiran cada 60 días.** Si la API devuelve 401, hay que regenerarlo:
> 1. Ir a https://business.facebook.com/settings/system-users?business_id=1603799175088577
> 2. En el usuario "CRM Integration", icono llave → "Generar token"
> 3. App: Pineda y Asociados CRM | Permiso: whatsapp_business_messaging
> 4. Copiar y actualizar `WHATSAPP_ACCESS_TOKEN` en `.env.local`

---

## B2. Verificar .env.local

- [x] Hecho ✅

---

## B3. Webhook (hacer después de crear /api/whatsapp)

> **Enlace**: https://developers.facebook.com/apps/1186621923892949/whatsapp-business/wa-dev-console/?tab=webhooks

```
1. "Editar" callback
2. Callback URL: http://localhost:3000/api/whatsapp
3. Verify Token: lex-honduras-wa-verify-2026
4. Campos: messages, message_deliveries
5. "Verificar y guardar"
```

- [ ] Pendiente (esperar a que exista /api/whatsapp en docs/21)

---

## Datos finales de prueba

```
WHATSAPP_ACCESS_TOKEN:        EAATVJrWddZCABR... (ver .env.local)
WHATSAPP_PHONE_NUMBER_ID:     1201622436357912
WHATSAPP_BUSINESS_ACCOUNT_ID: 1603799175088577
WHATSAPP_WABA_ID:             981792174749339
WHATSAPP_API_VERSION:         v25.0
WHATSAPP_VERIFY_TOKEN:        lex-honduras-wa-verify-2026
```

> **Nota**: API version **v25.0**. El token expira cada 60 días (regenerar en Meta Business).

---

## Migración a producción (cuando se active el dominio)

| Durante pruebas | En producción |
|---|---|
| alfonsroiget@gmail.com | contacto@pinedayasocioshn.com |
| +34 661911574 | Número del bufete |
| http://localhost:3000 | Dominio de producción |
