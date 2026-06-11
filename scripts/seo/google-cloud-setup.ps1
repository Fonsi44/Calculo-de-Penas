#!/usr/bin/env pwsh
<#
.SYNOPSIS
    Configura Google Cloud, habilita APIs y diagnostica permisos para el panel SEO.

.DESCRIPTION
    Script idempotente que:
    1. Verifica gcloud CLI y autenticacion
    2. Habilita APIs (Analytics Data, Analytics Admin, Search Console)
    3. Diagnostica acceso de la service account a GA4 y Search Console
    4. Muestra instrucciones para conceder permisos manuales

.PARAMETER ProjectId
    ID del proyecto de Google Cloud.

.PARAMETER ServiceAccount
    Email de la service account a diagnosticar.

.PARAMETER Ga4PropertyId
    ID de la propiedad GA4 (numerico).

.EXAMPLE
    .\google-cloud-setup.ps1 -ProjectId "pineda-asociados-forms-nuevo"

.EXAMPLE
    .\google-cloud-setup.ps1 -ProjectId "pineda-asociados-forms-nuevo" `
        -ServiceAccount "id-seo-api-v2@pineda-asociados-forms-nuevo.iam.gserviceaccount.com" `
        -Ga4PropertyId "541022095"
#>

param(
    [Parameter(Mandatory = $true)]
    [string]$ProjectId,

    [string]$ServiceAccount,

    [string]$Ga4PropertyId,

    [string]$SearchConsoleSiteUrl = "https://www.pinedayasociadoshn.com/"
)

$ErrorActionPreference = "Continue"
$ScriptName = "google-cloud-setup"

function Write-Step { param([string]$M) Write-Host "[$ScriptName] $M" -ForegroundColor Cyan }
function Write-Ok   { param([string]$M) Write-Host "[$ScriptName] OK: $M" -ForegroundColor Green }
function Write-Warn { param([string]$M) Write-Host "[$ScriptName] WARN: $M" -ForegroundColor Yellow }
function Write-Err  { param([string]$M) Write-Host "[$ScriptName] ERROR: $M" -ForegroundColor Red }

# 1. Verificar gcloud
Write-Step "1/6 Verificando gcloud CLI..."
if (-not (Get-Command gcloud -ErrorAction SilentlyContinue)) {
    Write-Err "gcloud CLI no encontrada. Instala desde https://cloud.google.com/sdk/docs/install"
    exit 1
}
Write-Ok "gcloud CLI detectada"

# 2. Autenticacion
Write-Step "2/6 Verificando autenticacion..."
$activeAccount = gcloud auth list --filter="status:ACTIVE" --format="value(account)" 2>$null
if (-not $activeAccount) {
    Write-Warn "No hay sesion activa. Ejecutando gcloud auth login..."
    gcloud auth login
    $activeAccount = gcloud auth list --filter="status:ACTIVE" --format="value(account)" 2>$null
}
if (-not $activeAccount) {
    Write-Err "No se pudo autenticar. Ejecuta: gcloud auth login"
    exit 1
}
Write-Ok "Cuenta activa: $activeAccount"

# 3. Configurar proyecto
Write-Step "3/6 Configurando proyecto $ProjectId..."
gcloud config set project $ProjectId 2>$null | Out-Null
$currentProject = gcloud config get-value project 2>$null
if ($currentProject -ne $ProjectId) {
    Write-Err "No se pudo establecer el proyecto '$ProjectId'. Verifica que existe y tienes acceso."
    gcloud projects list --format="value(projectId)"
    exit 1
}
Write-Ok "Proyecto activo: $currentProject"

# 4. Habilitar APIs
Write-Step "4/6 Habilitando APIs necesarias..."
$requiredApis = @(
    "analyticsdata.googleapis.com",
    "analyticsadmin.googleapis.com",
    "searchconsole.googleapis.com"
)

foreach ($api in $requiredApis) {
    $enabled = gcloud services list --enabled --format="value(config.name)" 2>$null | Select-String -Pattern ([regex]::Escape($api))
    if ($enabled) {
        Write-Ok "Ya habilitada: $api"
    } else {
        Write-Host "  Habilitando $api..."
        gcloud services enable $api --project $ProjectId 2>&1 | Out-Null
        if ($LASTEXITCODE -eq 0) {
            Write-Ok "Habilitada: $api"
        } else {
            Write-Warn "No se pudo habilitar $api. Hazlo manualmente en:"
            Write-Host "  https://console.cloud.google.com/apis/library?project=$ProjectId"
        }
    }
}

# 5. Diagnosticar service account
Write-Step "5/6 Diagnosticando service account..."
if ($ServiceAccount) {
    Write-Host "  Service account: $ServiceAccount"
    Write-Host ""

    # Verificar que existe
    $saCheck = gcloud iam service-accounts describe $ServiceAccount --project $ProjectId 2>$null
    if ($saCheck) {
        Write-Ok "Service account existe en el proyecto."
    } else {
        Write-Warn "Service account NO encontrada en el proyecto $ProjectId."
        Write-Host "  Crear service account:"
        Write-Host "    gcloud iam service-accounts create ID --display-name='SEO API' --project=$ProjectId"
        Write-Host "  Generar clave:"
        Write-Host "    gcloud iam service-accounts keys create key.json --iam-account=$ServiceAccount"
    }

    # Testear acceso GA4
    if ($Ga4PropertyId) {
        Write-Host ""
        Write-Host "  Para verificar acceso GA4. Ejecuta manualmente con node:"
        Write-Host "    node -e `"const {google} = require('googleapis'); const auth = new google.auth.GoogleAuth({scopes: ['https://www.googleapis.com/auth/analytics.readonly']}); auth.getClient().then(c => google.analyticsdata({version:'v1beta',auth:c}).properties.runReport({property:'properties/$Ga4PropertyId',requestBody:{dateRanges:[{startDate:'7daysAgo',endDate:'today'}],metrics:[{name:'activeUsers'}]}}).then(r => console.log('OK', r.data.rows?.[0]?.metricValues?.[0]?.value ?? 0)).catch(e => console.error('FAIL', e.message)))`""
    }

    Write-Host ""
    Write-Host "  Para testear Search Console:"
    Write-Host "    node -e `"const {google} = require('googleapis'); const auth = new google.auth.GoogleAuth({scopes: ['https://www.googleapis.com/auth/webmasters.readonly']}); auth.getClient().then(c => google.searchconsole({version:'v1',auth:c}).sites.list().then(r => console.log('OK', r.data.siteEntry?.map(s=>s.siteUrl))).catch(e => console.error('FAIL', e.message)))`""
} else {
    Write-Warn "No se especifico -ServiceAccount. Saltando diagnostico."
    Write-Host "  Las credenciales de service account se usan directamente en el codigo via"
    Write-Host "  GOOGLE_SERVICE_ACCOUNT_EMAIL y GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY."
    Write-Host "  Para diagnosticar, ejecuta:"
    Write-Host "    node scripts/ga-setup.mjs"
}

# 6. Instrucciones finales
Write-Step "6/6 Instrucciones manuales"
Write-Host ""
Write-Host "  === PASOS MANUALES PARA ACTIVAR EL PANEL SEO ===" -ForegroundColor Yellow
Write-Host ""
Write-Host "  1. Google Analytics 4:" -ForegroundColor White
Write-Host "     a. Ve a https://analytics.google.com/"
Write-Host "     b. Selecciona la propiedad GA4"
Write-Host "     c. Admin > Acceso a la propiedad > Administradores de propiedad"
Write-Host "     d. Anade la service account con rol VISOR"
Write-Host "        Email: $ServiceAccount"
Write-Host ""
Write-Host "  2. Google Search Console:" -ForegroundColor White
Write-Host "     a. Ve a https://search.google.com/search-console"
Write-Host "     b. Selecciona la propiedad: $SearchConsoleSiteUrl"
Write-Host "     c. Ajustes > Usuarios y permisos > Anadir usuario"
Write-Host "     d. Anade la service account con permiso RESTRINGIDO o COMPLETO"
Write-Host "        Email: $ServiceAccount"
Write-Host ""
Write-Host "  3. Vercel (produccion):" -ForegroundColor White
Write-Host "     a. Ve a Project Settings > Environment Variables"
Write-Host "     b. Asegura que existen estas variables (sin NEXT_PUBLIC_):"
Write-Host "        GOOGLE_SERVICE_ACCOUNT_EMAIL"
Write-Host "        GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY"
Write-Host "        GOOGLE_ANALYTICS_PROPERTY_ID"
Write-Host "        GOOGLE_SEARCH_CONSOLE_SITE_URL"
Write-Host "        INDEXNOW_KEY"
Write-Host ""
Write-Host "  4. Verificar en el panel SEO:" -ForegroundColor White
Write-Host "     a. Ve a https://www.pinedayasociadoshn.com/intranet/admin/seo"
Write-Host "     b. Pestaña Resumen SEO o llama a /api/admin/seo/health"
Write-Host "     c. Todas las integraciones deben mostrar ACTIVO"
Write-Host ""
Write-Ok "Script completado."
