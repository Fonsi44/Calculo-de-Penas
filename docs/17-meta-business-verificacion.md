# Meta Business Suite — Verificación de empresa

> **Participantes**: Abogado (pasos A) + Desarrollador (pasos B)
> **Tiempo**: ~30 min abogado + ~15 min desarrollador
> **Objetivo**: Obtener el token permanente para la API de WhatsApp

---

## 🔷 SECCIÓN A — ABOGADO (crear app y obtener token)

### A1. Crear cuenta en Meta for Developers

- Ve a https://developers.facebook.com
- Toca **"Empezar"**
- Inicia sesión con tu correo personal (o crea uno)
- Acepta términos de desarrollador

### A2. Crear aplicación (App)

- Toca **"Mis aplicaciones"** → **"Crear aplicación"**
- Tipo: **"Negocio"**
- Nombre: `Pineda y Asociados - CRM`
- Correo de contacto: `alfonsroiget@gmail.com`
- Resuelve el captcha

### A3. Agregar producto WhatsApp

- En el panel de la app, busca **"Agregar productos"**
- Encuentra **"WhatsApp"** → **"Configurar"**

### A4. Crear cuenta comercial

- En la sección **"Cuentas comerciales"** → **"Crear cuenta comercial"**
- Nombre: `Pineda y Asociados`
- Web: `http://localhost:3000`
- Correo: `alfonsroiget@gmail.com`
- Industria: `Servicios legales`

### A5. Registrar número

- **"Agregar número"** → Método: **"Teléfono"**
- País: España (+34)
- Número: **661911574** (sin +34)
- Alias: `Bufete principal`
- Pide verificación por **llamada** (más rápido que SMS)
- Atiende la llamada y escribe el código de 6 dígitos

### A6. Crear System User + token permanente

- En developers.facebook.com, ve a tu app → **"Usuarios del sistema"** (menú izquierdo)
- **"Agregar"** → nombre: `CRM Integration` → rol: **"Admin"**
- **"Generar token"**
- Selecciona tu app
- Marca permiso: **`whatsapp_business_messaging`**
- **"Generar"**
- **⚠️ COPIA EL TOKEN AHORA** (solo aparece una vez)
- Toca **"Hecho"**

### A7. Entregar al desarrollador

```
Token de acceso: EAA...
ID del número: 123456789012345
ID de cuenta comercial: 987654321098765
```

---

## 🔷 SECCIÓN B — DESARROLLADOR (validar y configurar)

### B1. Validar token

```bash
curl -H "Authorization: Bearer EAA..." \
  "https://graph.facebook.com/v22.0/123456789012345"
```

Si responde con `{ "id": "123456789012345", ... }` → funciona.

### B2. Guardar en .env.local

```env
WHATSAPP_ACCESS_TOKEN=EAA...
WHATSAPP_PHONE_NUMBER_ID=123456789012345
WHATSAPP_BUSINESS_ACCOUNT_ID=987654321098765
WHATSAPP_API_VERSION=v22.0
```

---

## ✅ Progreso

- [ ] A1: Cuenta Meta for Developers creada (abogado)
- [ ] A2: App tipo Negocio creada (abogado)
- [ ] A3: Producto WhatsApp agregado (abogado)
- [ ] A4: Cuenta comercial creada (abogado)
- [ ] A5: Número verificado por llamada (abogado)
- [ ] A6: System User + token generado (abogado)
- [ ] A7: Token + IDs entregados (abogado)
- [ ] B1: Token validado con curl (dev)
- [ ] B2: Variables en .env.local (dev)




