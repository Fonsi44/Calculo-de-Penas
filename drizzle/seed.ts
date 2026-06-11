import 'dotenv/config';
import { neon as neonSql } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import { sql as drizzleSql } from 'drizzle-orm';
import { ramasJuridicas, articulosConstitucion, articulosCp, delitos, categoriasBlog, categoriasFaq, roles, permisos, rolesPermisos, usuarios, areasJuridicas } from '../lib/schema';
import * as fs from 'fs';
import * as path from 'path';
import { blogCategories } from '../data/blog/categories';
import { faqCategoriesMeta } from '../data/faq-categories';
import { areasGenerales, hubPenal, hubMigrantes } from '../data/areas-juridicas';

const sql = neonSql(process.env.DATABASE_URL!);
const db = drizzle(sql);

interface RamaSeed {
  id: string;
  nombre: string;
  parent_id: string | null;
  nivel: number;
  orden: number;
}

interface ArticuloSeed {
  numero: number;
  articulo: string;
  titulo: string;
  capitulo: string;
  texto: string;
}

interface DelitoSeed {
  nombre: string;
  articulo: string;
  conducta?: string;
  rama_id?: string;
  constitucion_articulo_id?: number | null;
  pena_minima_meses: number;
  pena_maxima_meses: number;
  tiene_pena_alternativa?: boolean;
  pena_alternativa_min?: number;
  pena_alternativa_max?: number;
  penas_accesorias?: string[];
  observaciones?: string;
}

async function seed() {
  console.log('Iniciando seed...\n');

  // Check if data already exists to prevent duplicate seeding
  const existing = await sql`SELECT COUNT(*) as total FROM delitos`;
  if (Number(existing[0].total) > 0) {
    console.log(`✓ BD ya contiene ${existing[0].total} delitos — continuando con secciones nuevas...`);
  } else {

  // Ramas jurídicas — batch insert
  const ramasPath = path.resolve('data/ramas_juridicas.json');
  if (fs.existsSync(ramasPath)) {
    const ramas: RamaSeed[] = JSON.parse(fs.readFileSync(ramasPath, 'utf-8'));
    await db.insert(ramasJuridicas).values(
      ramas.map(r => ({
        id: r.id,
        nombre: r.nombre,
        parentId: r.parent_id,
        nivel: r.nivel,
        orden: r.orden,
      }))
    ).onConflictDoNothing();
    console.log(`✓ Ramas: ${ramas.length} insertadas`);
  }

  // Artículos constitucionales — batch insert
  const artsPath = path.resolve('data/articulos_constitucion.json');
  if (fs.existsSync(artsPath)) {
    const arts: ArticuloSeed[] = JSON.parse(fs.readFileSync(artsPath, 'utf-8'));
    await db.insert(articulosConstitucion).values(
      arts.map(a => ({
        id: a.numero,
        articulo: a.articulo,
        titulo: a.titulo,
        capitulo: a.capitulo,
        texto: a.texto,
      }))
    ).onConflictDoNothing();
    console.log(`✓ Artículos constitucionales: ${arts.length} insertados`);
  }

  // Artículos del Código Penal
  const cpPath = path.resolve('data/articulos_cp.json');
  if (fs.existsSync(cpPath)) {
    const cp: { articulo: string; libro: string; titulo: string; capitulo: string | null; seccion: string | null; epigrafe: string | null; texto: string; tema: string | null }[] = JSON.parse(fs.readFileSync(cpPath, 'utf-8'));
    await db.insert(articulosCp).values(
      cp.map(a => ({
        articulo: a.articulo,
        libro: a.libro,
        titulo: a.titulo,
        capitulo: a.capitulo,
        seccion: a.seccion,
        epigrafe: a.epigrafe,
        texto: a.texto,
        tema: a.tema,
      }))
    ).onConflictDoNothing();
    console.log(`✓ Artículos CP: ${cp.length} insertados`);
  }

  // Delitos — batch insert en chunks de 100
  const delitosPath = path.resolve('data/delitos.json');
  if (fs.existsSync(delitosPath)) {
    const delitosSeed: DelitoSeed[] = JSON.parse(fs.readFileSync(delitosPath, 'utf-8'));
    const batchSize = 100;
    let count = 0;
    for (let i = 0; i < delitosSeed.length; i += batchSize) {
      const batch = delitosSeed.slice(i, i + batchSize);
      await db.insert(delitos).values(
        batch.map(d => ({
          nombre: d.nombre,
          articulo: d.articulo,
          conducta: d.conducta,
          ramaId: d.rama_id,
          constitucionArticuloId: d.constitucion_articulo_id ?? null,
          penaMinimaMeses: d.pena_minima_meses,
          penaMaximaMeses: d.pena_maxima_meses,
          tienePenaAlternativa: d.tiene_pena_alternativa ?? false,
          penaAlternativaMin: d.pena_alternativa_min ?? 0,
          penaAlternativaMax: d.pena_alternativa_max ?? 0,
          penasAccesorias: d.penas_accesorias ?? [],
          observaciones: d.observaciones,
          esGrave: d.pena_maxima_meses >= 60,
        }))
      ).onConflictDoNothing();
      count += batch.length;
      console.log(`  ${count}/${delitosSeed.length} delitos...`);
    }
    console.log(`✓ Delitos: ${count} insertados`);
  }
  } // end else (delitos ya existían)

  // Categorías de blog — desde data/blog/categories.ts
  const existingCats = await sql`SELECT COUNT(*) as total FROM categorias_blog`;
  if (Number(existingCats[0].total) === 0) {
    await db.insert(categoriasBlog).values(
      blogCategories.map((c, i) => ({
        slug: c.slug,
        nombre: c.nombre,
        descripcion: c.descripcion,
        color: c.color,
        sortOrder: i,
      }))
    ).onConflictDoNothing();
    console.log(`✓ Categorías blog: ${blogCategories.length} insertadas`);
  }

  // Categorías FAQ — desde data/faq-categories.ts
  const existingFaqCats = await sql`SELECT COUNT(*) as total FROM categorias_faq`;
  if (Number(existingFaqCats[0].total) === 0) {
    await db.insert(categoriasFaq).values(
      faqCategoriesMeta.map((c, i) => ({
        slug: c.slug,
        titulo: c.titulo,
        descripcion: c.descripcion,
        sortOrder: i,
      }))
    ).onConflictDoNothing();
    console.log(`✓ Categorías FAQ: ${faqCategoriesMeta.length} insertadas`);
  }

  // Roles RBAC
  const existingRoles = await sql`SELECT COUNT(*) as total FROM roles`;
  if (Number(existingRoles[0].total) === 0) {
    const rolesData = [
      { nombre: 'super_admin', descripcion: 'Acceso completo al sistema' },
      { nombre: 'admin', descripcion: 'Gestión administrativa del CMS' },
      { nombre: 'editor', descripcion: 'Creación y edición de contenido' },
      { nombre: 'seo', descripcion: 'Gestión SEO y analítica' },
      { nombre: 'viewer', descripcion: 'Solo lectura' },
    ];
    await db.insert(roles).values(rolesData).onConflictDoNothing();
    console.log(`✓ Roles: ${rolesData.length} insertados`);

    // Permisos básicos
    const recursos = ['paginas', 'blog', 'faq', 'seo', 'usuarios', 'medios', 'ajustes', 'menus', 'redirects', 'auditoria', 'roles'];
    const acciones = ['crear', 'leer', 'editar', 'publicar', 'eliminar'];
    const permisosData: { recurso: string; accion: string; descripcion: string }[] = [];
    for (const recurso of recursos) {
      for (const accion of acciones) {
        permisosData.push({ recurso, accion, descripcion: `${accion} ${recurso}` });
      }
    }
    await db.insert(permisos).values(permisosData).onConflictDoNothing();
    console.log(`✓ Permisos: ${permisosData.length} insertados`);

    // Asignar todos los permisos a super_admin
    const [superAdminRol] = await db.select({ id: roles.id }).from(roles).where(drizzleSql`nombre = 'super_admin'`).limit(1);
    if (superAdminRol) {
      const todosPermisos = await db.select({ id: permisos.id }).from(permisos);
      await db.insert(rolesPermisos).values(
        todosPermisos.map(p => ({ rolId: superAdminRol.id, permisoId: p.id }))
      ).onConflictDoNothing();
      console.log(`✓ Permisos super_admin: ${todosPermisos.length} asignados`);
    }
  }

  // Áreas jurídicas — desde data/areas-juridicas.ts
  const existingAreas = await sql`SELECT COUNT(*) as total FROM areas_juridicas`;
  if (Number(existingAreas[0].total) === 0) {
    const allAreas: (typeof areasJuridicas.$inferInsert)[] = [];

    for (const a of areasGenerales) {
      allAreas.push({
        slug: a.slug, titulo: a.titulo, descripcionCorta: a.resumen, descripcionLarga: a.descripcion,
        icono: a.icono, categoria: 'servicio', grupo: null,
        subservicios: a.subservicios as any, faqs: a.faqs as any, sortOrder: allAreas.length,
      });
    }
    for (const g of hubPenal.grupos) {
      allAreas.push({
        slug: g.slug, titulo: g.titulo, descripcionCorta: g.resumen, descripcionLarga: g.descripcion,
        icono: g.icono, categoria: 'penal', grupo: 'penal',
        subservicios: g.subservicios as any, faqs: g.faqs as any, sortOrder: allAreas.length,
      });
    }
    for (const s of hubMigrantes.subareas) {
      allAreas.push({
        slug: s.slug, titulo: s.titulo, descripcionCorta: s.resumen, descripcionLarga: s.descripcion,
        icono: s.icono, categoria: 'migrante', grupo: 'migrante',
        subservicios: s.subservicios as any, faqs: s.faqs as any, sortOrder: allAreas.length,
      });
    }

    for (const area of allAreas) {
      await db.insert(areasJuridicas).values(area).onConflictDoNothing();
    }
    console.log(`✓ Áreas jurídicas: ${allAreas.length} insertadas`);
  }

  console.log('\n✔ Seed completado');
}

seed().catch((err) => {
  console.error('✖ Error en seed:', err);
  process.exit(1);
});
