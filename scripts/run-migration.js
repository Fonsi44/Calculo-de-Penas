const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

// Leer .env manualmente
const envContent = fs.readFileSync(path.join(__dirname, '..', '.env'), 'utf-8');
const dbUrlMatch = envContent.match(/DATABASE_URL="([^"]+)"/);
const DATABASE_URL = dbUrlMatch ? dbUrlMatch[1] : null;

if (!DATABASE_URL) {
  console.error('❌ No se encontró DATABASE_URL en .env');
  process.exit(1);
}

const client = new Client({
  connectionString: DATABASE_URL,
});

async function runMigration() {
  try {
    await client.connect();
    console.log('✅ Conectado a Neon DB');

    const migrationPath = path.join(__dirname, '..', 'drizzle', 'migrations', '0016_fase2_supuesto_penal.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf-8');

    // Dividir por statement-breakpoint
    const statements = migrationSQL.split('--> statement-breakpoint')
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith('--'));

    console.log(`📝 Ejecutando ${statements.length} statements...`);

    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      if (!statement || statement.startsWith('--')) continue;

      try {
        await client.query(statement);
        console.log(`  ✅ Statement ${i + 1}/${statements.length} ejecutado`);
      } catch (err) {
        if (err.message.includes('already exists') || err.message.includes('duplicate_object')) {
          console.log(`  ⚠️  Statement ${i + 1}/${statements.length} ya existe (ignorado)`);
        } else {
          console.error(`  ❌ Error en statement ${i + 1}/${statements.length}:`, err.message);
          throw err;
        }
      }
    }

    console.log('✅ Migración completada exitosamente');
    process.exit(0);
  } catch (err) {
    console.error('❌ Error ejecutando migración:', err);
    process.exit(1);
  } finally {
    await client.end();
  }
}

runMigration().catch(console.error);
