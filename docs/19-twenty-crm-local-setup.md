# Twenty CRM — Instalación local con Docker

> **Para**: Desarrollador (solo pasos técnicos)
> **Tiempo**: ~30-45 min
> **Requisitos**: Docker Desktop, WSL2, 2GB RAM libre, 2GB disco

---

## 1. Verificar Docker y WSL2

```powershell
docker --version
wsl -l -v
```

Si `wsl -l -v` muestra `docker-desktop` con versión 2 → OK.

## 2. Crear directorio fuera de OneDrive

```powershell
mkdir C:\Docker\twenty -Force
cd C:\Docker\twenty
```

⚠️ OneDrive causa problemas de locking con Docker.

## 3. Descargar archivos de Twenty

```powershell
curl -o docker-compose.yml https://raw.githubusercontent.com/twentyhq/twenty/main/packages/twenty-docker/docker-compose.yml
curl -o .env.example https://raw.githubusercontent.com/twentyhq/twenty/main/packages/twenty-docker/.env.example
Copy-Item .env.example .env
```

## 4. Generar ENCRYPTION_KEY

```powershell
[Convert]::ToBase64String([System.Security.Cryptography.RandomNumberGenerator]::GetBytes(32))
```

Editar `.env` con valores mínimos:

```env
SERVER_URL=http://localhost:3000
ENCRYPTION_KEY=<generado en paso anterior>
PG_DATABASE_PASSWORD=<contraseña_segura>
STORAGE_TYPE=local
```

⚠️ **Conflicto de puerto**: Twenty usa `localhost:3000`. Si el Next.js de este proyecto también corre en `:3000`, ejecuta Next.js en otro puerto:
```powershell
npm run dev -- -p 3001
```

Así Twenty queda en `:3000` y el proyecto Next.js en `:3001`.

## 5. Arrancar contenedores

```powershell
docker compose up -d
```

Descarga imágenes: twentycrm/twenty (~248MB) + postgres:16 (~400MB) + redis:latest (~30MB).

## 6. Verificar que corre

```powershell
docker compose ps
# Deberías ver: server, worker, db, redis — todos "Up"
```

## 7. Crear cuenta administradora

- Abrir `http://localhost:3000`
- Crear primera cuenta (será workspace admin)
- Usar correo real para invitaciones futuras

## 8. Obtener API key

La API key se obtiene desde la UI de Twenty:

1. Abrir `http://localhost:3000`
2. Ir a **Settings → API** (icono de llave)
3. **Create API Key** → copiar el token

No usar `curl /rest/access-token` (ese endpoint no genera keys nuevas).

Guardar en `.env.local` del proyecto web:

```env
TWENTY_API_URL=http://localhost:3000/rest
TWENTY_API_KEY=<token del paso 8>
```

> La URL debe incluir `/rest` al final porque el MCP de Twenty y el cliente HTTP usan esa base.

## Comandos útiles

```powershell
docker compose logs server -f    # Logs en vivo
docker compose stop              # Detener (datos persisten)
docker compose down -v           # Detener + borrar datos
docker compose pull              # Actualizar imágenes
```

---

## ✅ Progreso

- [ ] 1. Docker + WSL2 verificados
- [ ] 2. Directorio C:\Docker\twenty creado
- [ ] 3. docker-compose.yml y .env descargados
- [ ] 4. ENCRYPTION_KEY generada y .env configurado
- [ ] 5. docker compose up -d ejecutado
- [ ] 6. Todos los servicios muestran "Up"
- [ ] 7. Cuenta admin creada en localhost:3000
- [ ] 8. API key obtenida y guardada en .env.local


