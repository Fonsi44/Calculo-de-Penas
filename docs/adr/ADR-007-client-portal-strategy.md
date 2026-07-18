# ADR-007: Estrategia de portal del cliente

## Contexto
El cliente necesita acceder a su expediente, ver requisitos pendientes, subir documentos, ver estado y recibir comunicaciones, sin autenticación compleja.

## Decisión
- Usar enlace mágico con token hash SHA-256 (reutilizando infraestructura de Fase 2).
- El token se entrega por email y permite acceso solo al expediente vinculado.
- No hay registro de clientes: el acceso es anónimo pero ligado criptográficamente.
- Sesiones de portal con expiración corta (30 min).
- Rate limit por IP para evitar enumeración.
- No se exponen datos de otros expedientes, estrategia legal ni notas internas.

## Consecuencias
- Positivo: sin gestión de cuentas de cliente, sin contraseñas que resetear.
- Negativo: el cliente debe guardar el enlace; si lo pierde, el abogado debe generar uno nuevo.
