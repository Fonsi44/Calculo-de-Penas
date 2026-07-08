#Requires -Version 5.1
Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

function Stop-Safely {
  param([string] $Message)
  Write-Host ("ERROR: {0}" -f $Message) -ForegroundColor Red
  exit 1
}

function Confirm-Exact {
  param(
    [string] $Prompt,
    [string] $Expected
  )

  $answer = Read-Host $Prompt
  return $answer -ceq $Expected
}

function Get-SafeDatabaseInfo {
  param([string] $DatabaseUrl)

  try {
    $uri = [Uri] $DatabaseUrl
  } catch {
    Stop-Safely 'DATABASE_URL existe, pero no parece una URL valida.'
  }

  $dbName = $uri.AbsolutePath.TrimStart('/')
  if ([string]::IsNullOrWhiteSpace($dbName)) {
    $dbName = '(sin nombre visible)'
  }

  [PSCustomObject]@{
    Host = $uri.Host
    Database = $dbName
    SafeLabel = "$($uri.Host) $dbName"
  }
}

function Invoke-SqlJson {
  param(
    [string] $Name,
    [string] $Sql
  )

  $tempFile = Join-Path ([IO.Path]::GetTempPath()) ("validate-staging-security-{0}.mjs" -f ([Guid]::NewGuid().ToString('N')))
  $nodeScript = @'
import { neon } from '@neondatabase/serverless';

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
  console.error('DATABASE_URL no configurada.');
  process.exit(2);
}

const query = Buffer.from(process.argv[2], 'base64').toString('utf8');
const sql = neon(databaseUrl);
const rows = await sql(query);
console.log(JSON.stringify(rows));
'@

  try {
    Set-Content -LiteralPath $tempFile -Value $nodeScript -Encoding UTF8
    $encoded = [Convert]::ToBase64String([Text.Encoding]::UTF8.GetBytes($Sql))
    $output = & node $tempFile $encoded
    if ($LASTEXITCODE -ne 0) {
      Stop-Safely "Fallo la consulta SQL: $Name"
    }
    return ($output | ConvertFrom-Json)
  } finally {
    if (Test-Path -LiteralPath $tempFile) {
      Remove-Item -LiteralPath $tempFile -Force
    }
  }
}

function Show-TableSafe {
  param([object[]] $Rows)

  if (-not $Rows -or $Rows.Count -eq 0) {
    Write-Host '(sin filas)'
    return
  }

  $Rows | Format-Table -AutoSize
}

Write-Host 'Validacion staging/preview - seguridad Fase 0'
Write-Host 'No se imprimira DATABASE_URL completa.'

if ([string]::IsNullOrWhiteSpace($env:DATABASE_URL)) {
  Stop-Safely 'DATABASE_URL no esta configurada. Configure una URL de Neon staging/preview y vuelva a ejecutar.'
}

$dbInfo = Get-SafeDatabaseInfo -DatabaseUrl $env:DATABASE_URL
Write-Host ''
Write-Host 'Destino detectado (seguro):'
Write-Host ("  Host: {0}" -f $dbInfo.Host)
Write-Host ("  Base: {0}" -f $dbInfo.Database)

$label = $dbInfo.SafeLabel
if ($label -match '(?i)(prod|production)') {
  Stop-Safely 'La URL parece contener marcador de produccion. Abortado.'
}

if ($label -notmatch '(?i)(staging|preview|stage|dev|test)') {
  Write-Warning 'El host/base no contiene un marcador claro staging/preview/dev/test.'
  Write-Warning 'Continue solo si verifico en Neon/Vercel que esta URL NO es produccion.'
  if (-not (Confirm-Exact -Prompt 'Escriba exactamente CONFIRMO STAGING/PREVIEW para continuar' -Expected 'CONFIRMO STAGING/PREVIEW')) {
    Stop-Safely 'Confirmacion insuficiente. Abortado.'
  }
} else {
  if (-not (Confirm-Exact -Prompt 'Escriba exactamente STAGING para confirmar que NO es produccion' -Expected 'STAGING')) {
    Stop-Safely 'Confirmacion insuficiente. Abortado.'
  }
}

$adminSql = @'
SELECT COUNT(*) AS admins_activos
FROM usuarios
WHERE rol = 'admin'
  AND active = true
  AND COALESCE(bloqueado, false) = false;
'@

Write-Host ''
Write-Host 'Preflight: administradores activos'
$adminRows = @(Invoke-SqlJson -Name 'admins_activos_preflight' -Sql $adminSql)
$adminsActivos = [int] $adminRows[0].admins_activos
Write-Host ("admins_activos={0}" -f $adminsActivos)

if ($adminsActivos -lt 1) {
  Stop-Safely 'No hay administradores activos. No se aplicara la migracion.'
}

Write-Host ''
Write-Host 'Preflight correcto. La migracion 0024 puede aplicarse solo con confirmacion adicional.'
$apply = Confirm-Exact -Prompt 'Escriba exactamente APPLY 0024 TO STAGING para ejecutar drizzle-kit migrate, o Enter para omitir' -Expected 'APPLY 0024 TO STAGING'

if ($apply) {
  Write-Host ''
  Write-Host 'Aplicando migraciones Drizzle contra staging/preview confirmado...'
  & npx drizzle-kit migrate --config=drizzle.config.ts
  if ($LASTEXITCODE -ne 0) {
    Stop-Safely 'drizzle-kit migrate fallo. Revise el error anterior.'
  }
  Write-Host 'Migracion ejecutada.'
} else {
  Write-Host 'Migracion omitida por decision del operador.'
}

$defaultsSql = @'
SELECT column_name, column_default, is_nullable
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'usuarios'
  AND column_name IN ('rol', 'active')
ORDER BY column_name;
'@

$roleStateSql = @'
SELECT rol, active, COUNT(*) AS total
FROM usuarios
GROUP BY rol, active
ORDER BY rol, active;
'@

Write-Host ''
Write-Host 'Verificacion de defaults de usuarios'
$defaultRows = @(Invoke-SqlJson -Name 'defaults_usuarios' -Sql $defaultsSql)
Show-TableSafe -Rows $defaultRows

Write-Host ''
Write-Host 'Verificacion posterior: administradores activos'
$adminRowsAfter = @(Invoke-SqlJson -Name 'admins_activos_after' -Sql $adminSql)
$adminsActivosAfter = [int] $adminRowsAfter[0].admins_activos
Write-Host ("admins_activos={0}" -f $adminsActivosAfter)

if ($adminsActivosAfter -lt 1) {
  Stop-Safely 'Despues de la verificacion no hay administradores activos. Revise staging antes de continuar.'
}

Write-Host ''
Write-Host 'Auditoria agregada por rol/estado (sin datos personales)'
$roleStateRows = @(Invoke-SqlJson -Name 'usuarios_por_rol_estado' -Sql $roleStateSql)
Show-TableSafe -Rows $roleStateRows

Write-Host ''
Write-Host 'Validacion staging/preview completada.'
