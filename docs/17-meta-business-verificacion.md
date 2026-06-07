# Meta Business Suite — Verificación de empresa para WhatsApp API

> **Participantes**: Abogado (pasos A) + Desarrollador (pasos B)
> **Tiempo**: ~30 min abogado + ~15 min desarrollador
> **Objetivo**: Obtener el token permanente para que el CRM pueda enviar/recibir WhatsApp

---

## Primero: entiende qué vamos a hacer

Meta (Facebook) controla la API de WhatsApp. Para que el CRM pueda enviar mensajes
automáticos (recordatorios, notificaciones, bienvenidas), necesitamos que Meta nos dé
un "token" — una clave secreta que autoriza al CRM.

El proceso:
1. Te registras como desarrollador en Meta (gratis)
2. Creas una "aplicación" (contenedor de configuración)
3. Asocias tu número de WhatsApp Business a esa aplicación
4. Creas un "usuario del sistema" (cuenta robot) con permiso para WhatsApp
5. Copias el token y se lo das al desarrollador

> **Todo es GRATIS**. Meta cobra solo cuando envías mensajes a clientes reales.

---

## SECCIÓN A — ABOGADO (lo haces TÚ)

### A1. Crear cuenta en Meta for Developers

1. Ve a https://developers.facebook.com
2. Toca **"Empezar"** (arriba a la derecha)
3. Inicia sesión con alfonsroiget@gmail.com
4. Acepta términos de desarrollador

---

### A2. Crear la aplicación (App)

1. Toca **"Mis aplicaciones"** → **"Crear aplicación"**
2. Selecciona **"Negocio"** (NO "Consumidor")
3. Toca **"Siguiente"**
4. Rellena:
   - Nombre: `Pineda y Asociados — CRM`
   - Correo: `alfonsroiget@gmail.com`
   - Cuenta comercial: "No tengo"
5. **"Crear aplicación"** → resuelve captcha

---

### A3. Agregar producto WhatsApp

1. En el menú lateral, busca **"Productos"**
2. Busca el icono de **WhatsApp** (burbuja verde)
3. Toca **"Configurar"**

---

### A4. Crear cuenta comercial

1. Dentro de WhatsApp, busca **"Cuentas comerciales"**
2. **"Crear cuenta comercial"**
3. Rellena:
   - Nombre: `Pineda y Asociados`
   - Web: `http://localhost:3000`
   - Correo: `alfonsroiget@gmail.com`
   - Industria: `Servicios legales`
4. **"Siguiente"**

✅ **Anota el ID de la cuenta comercial** (ej: 987654321098765)

---

### A5. Registrar tu número de teléfono

1. **"Números de teléfono"** → **"Agregar número"**
2. Método: **"Teléfono"**
3. Rellena:
   - País: España (+34)
   - Número: `661911574` (sin +34)
   - Alias: `Bufete principal`
4. **"Siguiente"**
5. Verificación: **"Llamada telefónica"** (más rápido)
6. **"Enviar código"** → recibirás llamada automática
7. Anota el código de 6 dígitos que te dicen → escríbelo → **"Confirmar"**

✅ **Anota el ID del número** (ej: 123456789012345)

---

### A6. Crear System User + token permanente

⚠️ **El token solo aparece UNA VEZ. No cierres sin copiarlo.**

1. En el menú lateral, busca **"Usuarios del sistema"**
2. **"Agregar"** → Nombre: `CRM Integration` → Rol: **Admin** → **"Crear"**
3. En la fila del usuario, toca **"Generar token"** (icono de llave)
4. Rellena:
   - App: `Pineda y Asociados — CRM`
   - Permisos: marca **`whatsapp_business_messaging`**
   - Expiración: 60 días
5. **"Generar"** → aparece un texto largo (empieza con EAA...)
6. ✅ **COPIA EL TOKEN EN ESTE MOMENTO**
7. **"Hecho"**

---

### A7. Entregar al desarrollador

```
Token:             EAAc1HZCcZBZB... (lo que copiaste)
ID del número:     123456789012345 (de A5)
ID cuenta comercial: 987654321098765 (de A4)
```

---

## SECCIÓN B — DESARROLLADOR

### B1. Validar token

```bash
curl -H "Authorization: Bearer EAA..." "https://graph.facebook.com/v22.0/ID_DEL_NUMERO"
```

Esperado: `{ "id": "12345...", "name": "Pineda y Asociados" }`
Error: "Invalid OAuth access token" → regenerar token en A6.

### B2. Guardar en .env.local

```env
WHATSAPP_ACCESS_TOKEN=EAA...
WHATSAPP_PHONE_NUMBER_ID=123456789012345
WHATSAPP_BUSINESS_ACCOUNT_ID=987654321098765
WHATSAPP_API_VERSION=v22.0
```

### B3. Webhook (después de /api/whatsapp)

1. developers.facebook.com > app > WhatsApp > Configuración
2. Webhook → **"Editar"**
3. Callback URL: `http://localhost:3000/api/whatsapp`
4. Verify Token: el de `WHATSAPP_VERIFY_TOKEN` en .env
5. Campos: marcar `messages`, `message_deliveries`
6. **"Verificar y guardar"**

---

## Progreso

- [ ] A1: Cuenta Meta for Developers
- [ ] A2: App tipo Negocio ("Pineda y Asociados — CRM")
- [ ] A3: Producto WhatsApp agregado
- [ ] A4: Cuenta comercial (ID: _______________)
- [ ] A5: Número +34 661911574 verificado (ID: _______________)
- [ ] A6: System User + token (empieza con EAA)
- [ ] A7: Token + IDs entregados al dev
- [ ] B1: Token validado con curl
- [ ] B2: Variables en .env.local
- [ ] B3: Webhook configurado (post /api/whatsapp)

---

## Migración a producción

| Durante pruebas | En producción |
|---|---|
| alfonsroiget@gmail.com | contacto@pinedayasocioshn.com |
| +34 661 911 574 | +504 9536 3724 |
| http://localhost:3000 | https://pinedayasocioshn.com |
| Token de tu cuenta personal | Misma app, mismo token |
