# Resend - Verificar dominio de correo

> **Participantes**: Abogado (pasos A, registros DNS) + Desarrollador (pasos B)
> **Tiempo**: ~20 min abogado (solo en producción) + ~10 min desarrollador
> **Objetivo**: Los correos salgan desde el dominio del bufete

---

## 🔬 MODO PRUEBAS (local, sin web pública)

En pruebas NO se necesita verificar el dominio. Se usa `onboarding@resend.dev` (ya configurado):

| Recurso | Durante pruebas | Producción |
|---|---|---|
| Remitente (From) | onboarding@resend.dev (ya funciona) | no-reply@pinedayasocioshn.com |
| Destinatario (To) | alfonsroiget@gmail.com | contacto@pinedayasocioshn.com |
| Variable de entorno | CONTACT_NOTIFICATION_EMAIL=alfonsroiget@gmail.com | CONTACT_NOTIFICATION_EMAIL=contacto@pinedayasocioshn.com |
| Verificar dominio | ❌ No necesario (saltar pasos A1-A8) | ✅ Requiere registros DNS |

El resto de este documento aplica SOLO cuando se pase a producción.

## ⏭️ Durante pruebas: solo cambiar .env.local

```env
# .env.local (YA está configurado para pruebas)
RESEND_API_KEY=re_LxkqqKj8_6DR2o9Qw3Ng3u5wen5B4tVXG
RESEND_FROM_EMAIL=onboarding@resend.dev
CONTACT_NOTIFICATION_EMAIL=alfonsroiget@gmail.com
```

Los formularios de contacto/consulta enviarán correos a alfonsroiget@gmail.com desde onboarding@resend.dev.

## ⏸️ A partir de aquí: solo para producción (saltar ahora)

Los siguientes pasos solo se ejecutan cuando se pase a producción con el dominio real.

---

# (A) Pasos del abogado - Verificación del dominio en Resend ⏸️

> Esto se hace SOLO en producción, cuando se quiera usar no-reply@pinedayasocioshn.com

## A1: Iniciar sesión en Resend
## A8: Confirmar que los correos llegan desde no-reply@

Pasos A1-A8: ver docs/18 en producción.

# (B) Pasos del desarrollador ⏸️

## B1: Cambiar env vars en producción
## B3: Probar formularios

Pasos B1-B3: se ejecutan cuando el dominio esté verificado.

