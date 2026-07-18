# ADR-008: Estrategia de inbound email

## Contexto
El cliente responde correos del sistema o envía documentos por email. Esas respuestas deben vincularse al expediente y requisito correspondiente.

## Decisión
- Usar webhooks de Resend para recibir eventos de email entrante.
- Verificar firma HMAC-SHA256 del webhook.
- Relacionar por `references` header con `correos_enviados.resend_id`.
- Adjuntos se envían al pipeline de procesamiento documental.
- Respuestas automáticas y rebotes se detectan y descartan.
- Un correo entrante nunca cambia un estado jurídico crítico automáticamente.
- Si no se puede clasificar, se crea una tarea de clasificación humana.

## Consecuencias
- Trazabilidad completa entre correos enviados y respuestas.
- Los rebotes se registran sin reintentar automáticamente.
- Prevención de loops por detección de autorespuestas.
