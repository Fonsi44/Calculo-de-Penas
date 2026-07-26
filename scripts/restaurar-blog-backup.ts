import 'dotenv/config';
import { neon } from '@neondatabase/serverless';
import * as fs from 'node:fs';
import * as path from 'node:path';

async function main() {
  const isApply = process.argv.includes('--aplicar');
  let fileArg = '';
  
  const fileArgIndex = process.argv.indexOf('--file');
  if (fileArgIndex !== -1 && fileArgIndex + 1 < process.argv.length) {
    fileArg = process.argv[fileArgIndex + 1];
  }

  console.log('═══════════════════════════════════════════════════════════');
  console.log(isApply ? '🚀 RESTAURACIÓN: MODO APLICAR ACTIVO' : '🔍 RESTAURACIÓN: MODO DRY-RUN ACTIVO');
  console.log('═══════════════════════════════════════════════════════════\n');

  if (!process.env.DATABASE_URL || process.env.DATABASE_URL.includes('placeholder')) {
    console.error('❌ Error: DATABASE_URL no está configurada.');
    process.exit(1);
  }

  // Localizar el archivo de backup
  let backupPath = '';
  if (fileArg) {
    backupPath = path.resolve(fileArg);
  } else {
    const dir = path.join(process.cwd(), 'auditoria-blog');
    if (fs.existsSync(dir)) {
      const files = fs.readdirSync(dir)
        .filter(f => f.startsWith('backup-') && f.endsWith('.json'))
        .sort((a, b) => b.localeCompare(a)); // Más reciente primero
      if (files.length > 0) {
        backupPath = path.join(dir, files[0]);
      }
    }
  }

  if (!backupPath || !fs.existsSync(backupPath)) {
    console.error(`❌ Error: No se encontró ningún archivo de respaldo en la ruta especificada o en auditoria-blog/.`);
    console.log('   Por favor especifique la ruta usando: npx tsx scripts/restaurar-blog-backup.ts --file ruta/al/archivo.json');
    process.exit(1);
  }

  console.log(`📁 Usando archivo de respaldo: ${path.basename(backupPath)}`);
  console.log(`   Ruta completa: ${backupPath}\n`);

  let backupData: any[];
  try {
    const content = fs.readFileSync(backupPath, 'utf8');
    const parsed = JSON.parse(content);
    if (Array.isArray(parsed)) {
      backupData = parsed;
    } else if (parsed && Array.isArray(parsed.posts)) {
      backupData = parsed.posts;
    } else {
      throw new Error('El formato del archivo JSON de respaldo no contiene un arreglo de posts.');
    }
  } catch (err: any) {
    console.error(`❌ Error al leer o parsear el archivo de respaldo: ${err.message}`);
    process.exit(1);
  }

  console.log(`📊 Total de registros en el respaldo: ${backupData.length}`);

  const sql = neon(process.env.DATABASE_URL);
  
  console.log('📡 Consultando estado actual de la base de datos...');
  const dbPosts = await sql`SELECT * FROM blog_posts`;
  console.log(`📊 Total de registros en base de datos: ${dbPosts.length}\n`);

  const dbMap = new Map<string, any>(dbPosts.map((p: any) => [p.slug, p]));
  
  let totalModificados = 0;
  let totalDespublicadosAReactivar = 0;
  let totalNuevos = 0;

  for (const backupItem of backupData) {
    const dbItem = dbMap.get(backupItem.slug);

    if (!dbItem) {
      console.log(`[+] NUEVO REGISTRO: El artículo "${backupItem.slug}" no existe en base de datos.`);
      totalNuevos++;
      if (isApply) {
        // Insertar registro
        const keys = Object.keys(backupItem).filter(k => backupItem[k] !== undefined);
        const columns = keys.map(k => k).join(', ');
        const values = keys.map(k => backupItem[k]);
        
        // Construimos placeholders dinámicos de postgres
        const placeholders = keys.map((_, i) => `$${i + 1}`).join(', ');
        const queryText = `INSERT INTO blog_posts (${columns}) VALUES (${placeholders})`;
        
        // Ejecutamos pasándole los argumentos de forma segura
        await (sql as any)(queryText, values);
        console.log(`    -> Insertado correctamente.`);
      }
      continue;
    }

    // Comparar columnas
    const fieldsToUpdate: any = {};
    const differences: string[] = [];

    // Mapeo de correspondencias JSON a columnas postgres
    const columnsToCompare = [
      { key: 'title', column: 'title' },
      { key: 'description', column: 'description' },
      { key: 'body', column: 'body' },
      { key: 'category', column: 'category' },
      { key: 'author', column: 'author' },
      { key: 'reading_time', column: 'reading_time' },
      { key: 'cover_image', column: 'cover_image' },
      { key: 'featured', column: 'featured' },
      { key: 'published', column: 'published' },
      { key: 'meta_title', column: 'meta_title' },
      { key: 'meta_description', column: 'meta_description' },
      { key: 'og_image', column: 'og_image' },
      { key: 'noindex', column: 'noindex' },
      { key: 'canonical_url', column: 'canonical_url' },
      { key: 'review_status', column: 'review_status' },
      { key: 'reviewed_by', column: 'reviewed_by' },
      { key: 'legal_review_notes', column: 'legal_review_notes' }
    ];

    for (const item of columnsToCompare) {
      const backupVal = backupItem[item.key] ?? backupItem[item.column];
      const dbVal = dbItem[item.column] ?? dbItem[item.key];

      // Normalizar nulos o undefined
      const normBackup = backupVal === undefined || backupVal === null ? null : backupVal;
      const normDb = dbVal === undefined || dbVal === null ? null : dbVal;

      if (normBackup !== normDb) {
        differences.push(
          `      • ${item.column}: ` +
          `[DB] "${typeof normDb === 'string' && normDb.length > 50 ? normDb.slice(0, 45) + '...' : normDb}" ` +
          `-> [Respaldado] "${typeof normBackup === 'string' && normBackup.length > 50 ? normBackup.slice(0, 45) + '...' : normBackup}"`
        );
        fieldsToUpdate[item.column] = normBackup;
      }
    }

    // Verificar si se reactiva despublicación
    if (backupItem.published === true && dbItem.published === false) {
      totalDespublicadosAReactivar++;
    }

    if (differences.length > 0) {
      console.log(`[≠] DIVERGENCIA en post: "${backupItem.slug}" (id: ${dbItem.id})`);
      differences.forEach(d => console.log(d));
      totalModificados++;

      if (isApply) {
        // Ejecutar actualización
        const keys = Object.keys(fieldsToUpdate);
        if (keys.length > 0) {
          const setClause = keys.map((k, idx) => `${k} = $${idx + 1}`).join(', ');
          const values = keys.map(k => fieldsToUpdate[k]);
          values.push(dbItem.id); // Para la cláusula WHERE id = $N
          const queryText = `UPDATE blog_posts SET ${setClause} WHERE id = $${values.length}`;
          
          await (sql as any)(queryText, values);
          console.log(`    -> Campos revertidos correctamente.`);
        }
      }
    }
  }

  console.log('\n── RESUMEN DE LA AUDITORÍA DE RESTAURACIÓN ──');
  console.log(`• Posts modificados que se revertirán:   ${totalModificados}`);
  console.log(`• Posts despublicados a reactivar:       ${totalDespublicadosAReactivar}`);
  console.log(`• Posts nuevos a crear:                  ${totalNuevos}`);
  console.log('─────────────────────────────────────────────');

  if (totalModificados === 0 && totalNuevos === 0) {
    console.log('✅ Base de datos e inventario de respaldo están en sincronía. Nada que restaurar.');
  } else if (!isApply) {
    console.log('\n💡 Ejecute con la bandera --aplicar para escribir estos cambios en la base de datos viva.');
    console.log('   Ejemplo: npx tsx scripts/restaurar-blog-backup.ts --aplicar');
  } else {
    console.log('\n✅ Restauración de la base de datos completada satisfactoriamente.');
  }
}

main().catch(err => {
  console.error('❌ Error catastrófico en script de restauración:', err);
  process.exit(1);
});
