# 13 — Checklist de implementación

Estado: completado al 100%. Pendientes de roadmap futuro.

## Seguridad
- [x] Autenticación JWT con HttpOnly cookies
- [x] Rate limiting por IP (Neon DB)
- [x] CSP hardening (7 directivas)
- [x] Security headers (X-Content-Type-Options, X-Frame-Options, Referrer-Policy)
- [x] Restricción de dominio @pinedayasociadoshn.com
- [x] Validación de entorno al arranque
- [x] Rotación de JWT_SECRET
- [ ] Branch protection en GitHub (plan gratuito no lo permite)

## Datos
- [x] Catálogo de 483 delitos validados contra CP
- [x] 378 artículos constitucionales referenciados
- [x] 635 artículos del CP digitalizados
- [x] 119 ramas jurídicas clasificadas
- [x] Datos semilla con guarda de reseed

## Motor
- [x] Pena base (Art. 60)
- [x] Grados de autoría (Art. 61)
- [x] Tentativa (Arts. 62, 69)
- [x] Circunstancias (Art. 70)
- [x] Eximentes (Art. 30)
- [x] Concursos (Arts. 66-68)
- [ ] Reincidencia (Art. 71)
- [x] Modularizado en lib/rules/v1/

## API
- [x] 18+ endpoints REST
- [x] Protección IDOR en rutas con [id]
- [x] Rate limiting en login y contacto
- [x] Documentación de contratos

## UI
- [x] Sitio web público (15+ páginas)
- [x] Calculadora de 8 pasos
- [x] Intranet con dashboard y CRUD
- [x] Blog con artículos y categorías
- [x] FAQ con 73 preguntas en 11 categorías
- [x] Formulario de contacto con Resend
- [x] Tema oscuro/claro

## CI/CD
- [x] GitHub Actions (lint + build + test)
- [x] Build con Turbopack + TypeScript
- [x] Despliegue en Vercel

## Documentación
- [x] README.md actualizado
- [x] AGENTS.md con protocolo IA
- [x] CHANGELOG.md completo
- [x] 15 documentos técnicos en docs/

## Monitoreo
- [x] PITR 7 días en Neon Free
- [x] Health check endpoint (/api/health)
- [ ] Alertas automáticas de 5xx (Vercel Hobby no lo soporta)

## Pendientes de roadmap
- Reincidencia (Art. 71 CP)
- Verificación legal externa del motor
- Tests E2E de calculadora completa
- Tests de carga y rendimiento
- Migración a Next.js 17 (proxy en lugar de middleware)
- Nonces CSP nativos
