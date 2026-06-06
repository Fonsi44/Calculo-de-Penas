# Vercel — Alertas y Monitoreo (Free Tier)

## Estado actual

Vercel Hobby (gratis) incluye:
- Logs en tiempo real (12h de retención)
- Métricas básicas (CPU, memoria, requests)
- Alertas de build fallido (email)

**No incluye** (requiere Pro):
- Logs persistentes (>12h)
- Alertas de uso (bandwidth, build minutes)
- Monitoreo de performance avanzado

## Configuración recomendada (Hobby)

### 1. Alertas de build (email)

**Ya activo por defecto**. Vercel envía email a la cuenta del owner cuando un
deploy falla.

**Verificar**: https://vercel.com/account/notifications

### 2. Webhook de deploy (opcional)

Configurar un webhook para enterarte de cada deploy sin tener que abrir el dashboard:

1. https://vercel.com/account/webhooks
2. Crear webhook:
   - URL: `https://api.github.com/repos/Fonsi44/Calculo-de-Penas/dispatches`
     (evento `repository_dispatch`)
   - Eventos: `deployment.succeeded`, `deployment.failed`
3. El webhook disparará un evento en GitHub

**Estado**: No configurado. Valor bajo para proyecto personal.

### 3. Alertas de error 5xx (manual)

No hay alertas automáticas en Hobby. Para detectarlos:

**Opción A**: Revisar logs en Vercel dashboard tras cada deploy
**Opción B**: Configurar un healthcheck externo (UptimeRobot, free)

**Plan recomendado** (Fase B4):
```yaml
# UptimeRobot (free, 50 monitors)
- Monitor: https://calculo-de-penas-nextjs.vercel.app
- Type: HTTP
- Interval: 5 min
- Alert: email on down
```

**Estado**: No configurado todavía.

### 4. Logs de errores 5xx en producción

Para ver errores reales de runtime:

```bash
# Tiempo real
vercel logs calculo-de-penas-nextjs.vercel.app --follow

# Solo errores
vercel logs calculo-de-penas-nextjs.vercel.app | Select-String -Pattern "Error|500|TypeError"

# Logs de un deploy específico
vercel inspect <DEPLOYMENT_URL> --logs
```

**Estado**: Funciona. El agent lo ha usado ya en deploys previos.

## Limitaciones de Hobby que importan

| Recurso | Límite | Plan si se excede |
|---------|--------|-------------------|
| Bandwidth | 100 GB/mes | Pro $20/mes |
| Build minutes | 6,000 min/mes | Pro $20/mes |
| Serverless executions | 1M/mes | Pro $20/mes |
| Edge requests | 500k/mes | Pro $20/mes |
| Concurrent builds | 1 | Pro $20/mes |

**Estado actual** (estimado para este proyecto):
- Bandwidth: ~5 GB/mes (tráfico esperado < 100 DAU)
- Build minutes: ~30 min/mes (1 build/día × 2 min)
- Serverless: ~50k/mes (calculadora + APIs)

**Holgura**: 50× de bandwidth, 200× de compute. No esperamos alcanzar límites.

## Alternativa a Sentry (gratis)

Sentry free tier: 5k eventos/mes. Suficiente para errores críticos, pero queremos $0.

**Plan de monitoreo de errores sin servicio externo**:
1. Console logs van a Vercel (12h de retención)
2. El agente los revisa tras cada deploy
3. En `lib/audit.ts` registramos errores de negocio (login_failed, etc.)
4. La tabla `auditoria_eventos` los persiste indefinidamente

**Para alertas proactivas** (Fase E):
- Configurar Vercel Log Drains a un webhook (Hobby NO soporta, requiere Pro)
- O usar Cloudflare Workers como proxy (gratis, $0) con logging

## Roadmap

- [ ] **Fase B4**: Configurar UptimeRobot monitor (pendiente, no crítico)
- [ ] **Fase E**: Script que escanea logs de Vercel cada hora vía cron
- [ ] **Fase E**: Dashboard simple con métricas (opcional)
