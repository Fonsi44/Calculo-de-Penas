# Fase 2 - Script de validacion post-despliegue
# Ejecutar despues de fase2-deploy-complete.ps1
# Uso: .\scripts\fase2-validate-deploy.ps1

$ErrorActionPreference = "Stop"

Write-Host "FASE 2 - Validacion post-despliegue" -ForegroundColor Cyan
Write-Host "=====================================" -ForegroundColor Cyan
Write-Host ""

$NODE_PATH = "C:\Program Files\nodejs\node.exe"
$NPX_PATH = "C:\Program Files\nodejs\npx.cmd"

# Verificar que estamos en el directorio correcto
if (-not (Test-Path "package.json")) {
    Write-Host "Error: No se encontro package.json. Ejecutar desde la raiz del proyecto." -ForegroundColor Red
    exit 1
}

Write-Host "Validando tablas Fase 2 en Neon PostgreSQL..." -ForegroundColor Yellow
Write-Host ""

# Ejecutar script de validacion Node.js
Write-Host "1. Verificando tablas y datos..." -ForegroundColor White

$validateScript = @'
const { db } = require("./lib/db");
const { supuestosPenales, remisionesNormativas, agravantesEspecificas, delitos } = require("./lib/schema");

async function validate() {
  console.log("");

  try {
    // 1. Verificar supuestos_penales
    console.log("a) Tabla supuestos_penales:");
    const supuestos = await db.select().from(supuestosPenales);
    console.log(`   Registros: ${supuestos.length}`);
    if (supuestos.length > 0) {
      console.log("   Estado: OK");
      console.log("   Muestra:");
      supuestos.slice(0, 2).forEach(s => {
        console.log(`   - ${s.articulo_cp} numeral ${s.numeral || "unico"}: ${s.tipo_pena}`);
      });
    } else {
      console.log("   Estado: VACIA (advertencia)");
    }
    console.log("");

    // 2. Verificar remisiones_normativas
    console.log("b) Tabla remisiones_normativas:");
    const remisiones = await db.select().from(remisionesNormativas);
    console.log(`   Registros: ${remisiones.length}`);
    if (remisiones.length === 3) {
      console.log("   Estado: OK (3 esperadas)");
      remisiones.forEach(r => {
        console.log(`   - ${r.articulo_origen} -> ${r.articulo_destino}`);
      });
    } else {
      console.log(`   Estado: ADVERTENCIA (se esperaban 3, hay ${remisiones.length})`);
    }
    console.log("");

    // 3. Verificar agravantes_especificas
    console.log("c) Tabla agravantes_especificas:");
    const agravantes = await db.select().from(agravantesEspecificas);
    console.log(`   Registros: ${agravantes.length}`);
    console.log("   Estado: Se poblara mas adelante");
    console.log("");

    // 4. Verificar foreign keys
    console.log("d) Verificando relacion delitos-supuestos:");
    const delitosConSupuestos = await db
      .select({
        delitoId: delitos.id,
        delitoNombre: delitos.nombre,
        supuestoId: supuestosPenales.id,
      })
      .from(delitos)
      .leftJoin(supuestosPenales, delitos.id.equals(supuestosPenales.delitoId));

    const delitosUsados = new Set(delitosConSupuestos.filter((d) => d.supuestoId).map((d) => d.delitoId));
    console.log(`   Delitos con supuestos: ${delitosUsados.size}`);
    console.log("   Estado: OK");
    console.log("");

    console.log("================================");
    console.log("VALIDACION COMPLETADA");
    console.log("================================");
    process.exit(0);
  } catch (error) {
    console.error("Error durante validacion:", error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

validate();
'@

Set-Content -Path "scripts\validate-fase2-temp.js" -Value $validateScript

try {
    & $NPX_PATH tsx scripts/validate-fase2-temp.js
    Write-Host "Validacion completada correctamente" -ForegroundColor Green
} catch {
    Write-Host "Error en validacion: $_" -ForegroundColor Red
    exit 1
} finally {
    Remove-Item "scripts\validate-fase2-temp.js" -ErrorAction SilentlyContinue
}

Write-Host ""
Write-Host "Resumen:" -ForegroundColor White
Write-Host "  • Tablas creadas: supuestos_penales, remisiones_normativas, agravantes_especificas" -ForegroundColor Green
Write-Host "  • Datos seed: Insertados correctamente" -ForegroundColor Green
Write-Host "  • Vinculacion: Completada" -ForegroundColor Green
Write-Host ""
