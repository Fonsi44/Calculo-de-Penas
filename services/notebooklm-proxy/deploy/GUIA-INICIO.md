# Guía mínima — proxy NotebookLM en VPS (Clouding)

Para quien no domina servidores. **Abre Cursor en el VPS** cuando llegues al paso 4 y pega los comandos que indique el agente.

---

## Lo que vas a conseguir

La web oficial responderá a `una pregunta:` usando NotebookLM **sin tener el portátil encendido**.

---

## Paso 1 — Crear el VPS (en tu Mac)

1. En [Clouding → API](https://portal.clouding.io/dsb/account/api) crea una **API key nueva** (no uses una que hayas pegado en un chat).
2. En Clouding → **SSH Keys**, sube tu clave pública (si no tienes: en Mac Terminal `cat ~/.ssh/id_ed25519.pub`; si no existe: `ssh-keygen -t ed25519`).
3. En Terminal del Mac, en la carpeta del proyecto:

```bash
export CLOUDING_API_KEY='tu-clave-nueva'
bash services/notebooklm-proxy/deploy/clouding/provision-server.sh
```

4. **Anota la IP** y la contraseña si el script la muestra.

---

## Paso 2 — DNS (dominio)

En Cloudflare (o tu DNS), crea un registro **A**:

| Nombre | Tipo | Valor |
|--------|------|--------|
| `nlm-proxy` | A | IP del VPS del paso 1 |

Ejemplo final: `nlm-proxy.pinedayasociados.com` → IP del servidor.

---

## Paso 3 — Copiar archivos al VPS (Mac)

```bash
bash services/notebooklm-proxy/deploy/vps/copy-to-server.sh root@LA_IP_DEL_VPS
```

(Sustituye `LA_IP_DEL_VPS` por la IP real.)

---

## Paso 4 — En el VPS (Cursor o SSH)

Conéctate:

```bash
ssh root@LA_IP_DEL_VPS
```

Instala todo (sustituye tu dominio):

```bash
sudo NLM_PROXY_DOMAIN=nlm-proxy.tudominio.com bash /tmp/pineda-notebooklm-deploy/bootstrap-ubuntu.sh
```

> Si usas **Cursor en el Linux del VPS**, abre la carpeta `/tmp/pineda-notebooklm-deploy` y dile al agente: *«ejecuta bootstrap con mi dominio»*.

---

## Paso 5 — Login Google (desde tu Mac, fácil)

En tu **Mac** (donde ya funciona `nlm login`):

```bash
bash services/notebooklm-proxy/deploy/vps/sync-nlm-auth-to-server.sh pineda@LA_IP_DEL_VPS
```

Esto copia la sesión Google al servidor. Luego en el VPS:

```bash
ssh root@LA_IP_DEL_VPS 'systemctl start notebooklm-proxy && curl http://127.0.0.1:8787/health'
```

---

## Paso 6 — Vercel

En el VPS:

```bash
sudo bash /tmp/pineda-notebooklm-deploy/print-vercel-env.sh
```

Copia las 4 variables a **Vercel → Production** y **Redeploy**.

---

## Paso 7 — Probar

En la web oficial, chat:

```
una pregunta: Si estoy casado en España y soy hondureño, ¿qué debo hacer para legalizar mi matrimonio en Honduras?
```

Debe tardar 1–2 minutos y mostrar respuesta con badge de corpus legal.

---

## Si algo falla

| Síntoma | Comando en el VPS |
|---------|-------------------|
| Proxy caído | `sudo systemctl status notebooklm-proxy` |
| Logs | `sudo journalctl -u notebooklm-proxy -n 50` |
| nlm sin auth | Repetir paso 5 desde el Mac |
| HTTPS | `sudo systemctl status caddy` y comprobar DNS |

---

## Cuando abras Cursor en el servidor

Dile al agente:

> «Bootstrap del proxy NotebookLM ya hecho. IP: X. Dominio: nlm-proxy.… Comprueba health, caddy, nlm y dime qué falta para Vercel.»

El agente puede ejecutar los scripts de `services/notebooklm-proxy/deploy/vps/` sin que tengas que entender cada paso.
