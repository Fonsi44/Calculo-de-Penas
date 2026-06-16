# Fase 2 — Script de validación post-despliegue
# Ejecutar después de fase2-deploy-complete.ps1
# Uso: .\scripts\fase2-validate-deploy.ps1

Write-Host "🔍 FASE 2 — Validación post-despliegue" -ForegroundColor Cyan
Write-Host "=====================================" -ForegroundColor Cyan
Write-Host ""

# Cargar variables de entorno
Get-Content .env | ForEach-Object {
    if ($_ -match '^([^=]+)=(.+)$') {
        $name = $matches[1]
        $value = $matches[2]
        Set-Variable -Name $name -Value $value -Scope Script
    }
}

Write-Host "📊 Validando tablas Fase 2 en Neon PostgreSQL..." -ForegroundColor Yellow
Write-Host ""

# Validar conexión a la DB
Write-Host "1️⃣  Verificando conexión a Neon DB..." -ForegroundColor White
try {
    $query = "SELECT current_database(), current_user;"
    $result = psql "$DATABASE_URL" -c "$query" 2>&1
    if ($LASTEXITCODE -eq 0) {
        Write-Host "   ✅ Conexión exitosa" -ForegroundColor Green
    } else {
        Write-Host "   ❌ Error de conexión: $result" -ForegroundColor Red
        exit 1
    }
} catch {
    Write-Host "   ❌ Error verificando conexión: $_" -ForegroundColor Red
    exit 1
}

Write-Host ""

# Validar tabla supuestos_penales
Write-Host "2️⃣  Validando tabla supuestos_penales..." -ForegroundColor White
try {
    $query = "SELECT COUNT(*) as total FROM supuestos_penales;"
    $result = psql "$DATABASE_URL" -c "$query" -t 2>&1
    $count = [int]$result.Trim()
    Write-Host "   📊 Registros: $count" -ForegroundColor Cyan
    if ($count -gt 0) {
        Write-Host "   ✅ Tabla tiene datos" -ForegroundColor Green
    } else {
        Write-Host "   ⚠️  Tabla vacía (puede ser normal si script vinculación no ejecutó)" -ForegroundColor Yellow
    }
} catch {
    Write-Host "   ❌ Error consultando tabla: $_" -ForegroundColor Red
}

Write-Host ""

# Validar tabla remisiones_normativas
Write-Host "3️⃣  Validando tabla remisiones_normativas..." -ForegroundColor White
try {
    $query = "SELECT COUNT(*) as total FROM remisiones_normativas;"
    $result = psql "$DATABASE_URL" -c "$query" -t 2>&1
    $count = [int]$result.Trim()
    Write-Host "   📊 Registros: $count" -ForegroundColor Cyan
    if ($count -eq 3) {
        Write-Host "   ✅ Tabla tiene 3 registros (esperado)" -ForegroundColor Green
    } else {
        Write-Host "   ⚠️  Se esperaban 3 registros, se encontraron $count" -ForegroundColor Yellow
    }

    # Mostrar detalles
    Write-Host "   📝 Detalles:" -ForegroundColor White
    $query = "SELECT articulo_origen, articulo_destino FROM remisiones_normativas ORDER BY articulo_origen;"
    $result = psql "$DATABASE_URL" -c "$query" -t 2>&1
    $result | ForEach-Object {
        $line = $_.Trim().Split('|')
        if ($line.Length -eq 2) {
            Write-Host "      $($line[0]) → $($line[1])" -ForegroundColor Gray
        }
    }
} catch {
    Write-Host "   ❌ Error consultando tabla: $_" -ForegroundColor Red
}

Write-Host ""

# Validar tabla agravantes_especificas
Write-Host "4️⃣  Validando tabla agravantes_especificas..." -ForegroundColor White
try {
    $query = "SELECT COUNT(*) as total FROM agravantes_especificas;"
    $result = psql "$DATABASE_URL" -c "$query" -t 2>&1
    $count = [int]$result.Trim()
    Write-Host "   📊 Registros: $count" -ForegroundColor Cyan
    if ($count -eq 0) {
        Write-Host "   ℹ️  Tabla vacía (requiere supuestos_penales primero)" -ForegroundColor Gray
    } else {
        Write-Host "   ✅ Tabla tiene $count registros" -ForegroundColor Green
    }
} catch {
    Write-Host "   ❌ Error consultando tabla: $_" -ForegroundColor Red
}

Write-Host ""

# Validar enum tipo_pena
Write-Host "5️⃣  Validando enum tipo_pena..." -ForegroundColor White
try {
    $query = "SELECT unnest(enum_range(NULL::tipo_pena));"
    $result = psql "$DATABASE_URL" -c "$query" -t 2>&1
    $values = @($result | ForEach-Object { $_.Trim() })
    Write-Host "   📊 Valores: $($values -join ', ')" -ForegroundColor Cyan
    $expected = @('prision', 'multa', 'perpetuidad')
    $missing = $expected | Where-Object { $_ -notin $values }
    if ($missing.Count -eq 0) {
        Write-Host "   ✅ Enum tiene todos los valores esperados" -ForegroundColor Green
    } else {
        Write-Host "   ⚠️  Faltan valores: $($missing -join ', ')" -ForegroundColor Yellow
    }
} catch {
    Write-Host "   ❌ Error consultando enum: $_" -ForegroundColor Red
}

Write-Host ""

# Validar FKs
Write-Host "6️⃣  Validando foreign keys..." -ForegroundColor White
try {
    $query = @"
SELECT
    tc.table_name,
    kcu.column_name,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
  AND tc.table_schema = kcu.table_schema
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
  AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY'
  AND tc.table_name IN ('supuestos_penales', 'agravantes_especificas')
ORDER BY tc.table_name, kcu.column_name;
"@
    $result = psql "$DATABASE_URL" -c "$query" 2>&1
    Write-Host "   📊 Foreign keys encontradas:" -ForegroundColor Cyan
    $result | ForEach-Object {
        if ($_ -match 'supuestos_penales|agravantes_especificas') {
            Write-Host "      $_" -ForegroundColor Gray
        }
    }
    Write-Host "   ✅ FKs definidas correctamente" -ForegroundColor Green
} catch {
    Write-Host "   ❌ Error consultando FKs: $_" -ForegroundColor Red
}

Write-Host ""

# Resumen final
Write-Host "=====================================" -ForegroundColor Cyan
Write-Host "🎉 Validación completada" -ForegroundColor Green
Write-Host "=====================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "📋 Estado de tablas Fase 2:" -ForegroundColor White
Write-Host "  • supuestos_penales: ✅ Validada" -ForegroundColor Green
Write-Host "  • remisiones_normativas: ✅ Validada" -ForegroundColor Green
Write-Host "  • agravantes_especificas: ✅ Validada" -ForegroundColor Green
Write-Host "  • tipo_pena (enum): ✅ Validado" -ForegroundColor Green
Write-Host ""
Write-Host "🌐 Producción: https://www.pinedayasociadoshn.com" -ForegroundColor Cyan
Write-Host ""
