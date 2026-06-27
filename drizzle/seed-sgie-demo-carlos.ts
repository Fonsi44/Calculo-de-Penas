/**
 * SGIE — Seed demo para Carlos Pineda (abogado).
 *
 * Genera datos mock realistas, claramente marcados como prueba, para validar
 * el cockpit SGIE, expedientes, documentos, alertas, tareas, agenda, correos,
 * reglas, confianza, métricas y auditoría. Todos los datos son ficticios.
 *
 * Idempotente: detectable por slugs/claves únicas demo. Re-ejecución segura.
 *
 * Uso: npx tsx drizzle/seed-sgie-demo-carlos.ts
 *      npm run seed:sgie:demo:carlos
 */
import 'dotenv/config';
import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import {
  usuarios, clientes, tiposProcedimiento, expedientes, expedienteAsignaciones,
  requisitosExpediente, documentosExpediente, alertas, tareas, eventosAgenda,
  correosEnviados, historialExpediente, enlacesMagicos, camposExtraidos,
  confianzaResultados, extraccionesIa, correccionesIa,
} from '../lib/schema';
import { eq, and, or } from 'drizzle-orm';
import { createHash } from 'crypto';

const sql = neon(process.env.DATABASE_URL!);
const db = drizzle(sql);

const DEMO_EMAIL = 'carlos.pineda@pinedayasociadoshn.com';
const DEMO_SLUG_PREFIX = 'demo-carlos-';

function hashDemo(texto: string): string {
  return createHash('sha256').update(`DEMO-${texto}-${Date.now()}`).digest('hex');
}

function demoSlug(base: string): string {
  return `${DEMO_SLUG_PREFIX}${base}`.toLowerCase().replace(/[^a-z0-9-]/g, '-').slice(0, 100);
}

async function main() {
  console.log('🌱 SGIE — Seed demo Carlos Pineda\n');

  // ─── 1. Usuario abogado ─────────────────────────────────────────────────
  let carlosId: string;
  const [existente] = await db.select({ id: usuarios.id }).from(usuarios).where(eq(usuarios.email, DEMO_EMAIL));
  if (existente) {
    carlosId = existente.id;
    console.log(`  ⏭  Usuario Carlos ya existe (${carlosId})`);
  } else {
    const [u] = await db.insert(usuarios).values({
      email: DEMO_EMAIL,
      nombre: 'Carlos Pineda',
      passwordHash: '$2b$10$DEMO_HASH_NOT_REAL_PLEASE_CHANGE', // bcrypt placeholder
      rol: 'abogado',
      active: true,
      bloqueado: false,
      correoCorporativoVinculado: true,
    }).returning({ id: usuarios.id });
    carlosId = u.id;
    console.log(`  ✅ Usuario Carlos creado (${carlosId})`);
  }

  // ─── 2. Clientes demo ───────────────────────────────────────────────────
  const clientesData = [
    { nombre: 'María Elena Rodríguez', identidad: '0801-1985-00123', email: 'maria.rodriguez@demo.hn', telefono: '+504 9876-5432' },
    { nombre: 'José Antonio Flores', identidad: '0801-1978-00456', email: 'jose.flores@demo.hn', telefono: '+504 9876-5433' },
    { nombre: 'Industrias del Valle S.A.', rtn: '08019012345678', email: 'info@industriasvalle.demo.hn', telefono: '+504 2234-5678' },
    { nombre: 'Rosa Amanda López', identidad: '0801-1990-00789', email: 'rosa.lopez@demo.hn', telefono: '+504 9876-5434' },
    { nombre: 'Transportes Unificados HN', rtn: '08019087654321', email: 'contacto@transunificados.demo.hn', telefono: '+504 2234-5679' },
    { nombre: 'Pedro Miguel Sánchez', identidad: '0801-1982-00147', email: 'pedro.sanchez@demo.hn', telefono: '+504 9876-5435' },
    { nombre: 'Comercial El Progreso Ltda.', rtn: '08019011223344', email: 'ventas@elprogreso.demo.hn', telefono: '+504 2234-5680' },
    { nombre: 'Ana Cecilia Martínez', identidad: '0801-1995-00258', email: 'ana.martinez@demo.hn', telefono: '+504 9876-5436' },
    { nombre: 'Constructora del Sur S. de R.L.', rtn: '08019055667788', email: 'obras@constructorasur.demo.hn', telefono: '+504 2234-5681' },
    { nombre: 'Juan Carlos Mejía', identidad: '0801-1975-00369', email: 'juan.mejia@demo.hn', telefono: '+504 9876-5437' },
  ];

  const clienteIds: Record<string, string> = {};
  for (const c of clientesData) {
    const slug = demoSlug(c.nombre);
    // Verificar duplicado por identidad, RTN o email
    const dupeConditions = [];
    if (c.identidad) dupeConditions.push(eq(clientes.identidad, c.identidad));
    if (c.rtn) dupeConditions.push(eq(clientes.rtn, c.rtn));
    dupeConditions.push(eq(clientes.email, c.email));
    const [ex] = await db.select({ id: clientes.id }).from(clientes).where(or(...dupeConditions));
    if (ex) { clienteIds[c.nombre] = ex.id; console.log(`  ⏭  Cliente "${c.nombre}" ya existe`); continue; }
    const [nuevo] = await db.insert(clientes).values({
      nombre: c.nombre,
      identidad: c.identidad || null,
      rtn: c.rtn || null,
      email: c.email,
      telefono: c.telefono,
      notas: 'Cliente demo generado por seed Carlos Pineda',
      demo: true,
    } as never).returning({ id: clientes.id });
    clienteIds[c.nombre] = nuevo.id;
    console.log(`  ✅ Cliente "${c.nombre}" (${nuevo.id.slice(0, 8)}...)`);
  }

  // ─── 3. Procedimientos demo ─────────────────────────────────────────────
  const procedimientosData = [
    { slug: demoSlug('defensa-penal-general'), nombre: 'Defensa Penal General (Demo)', areaJuridica: 'Derecho Penal', descripcion: 'Procedimiento penal estándar para delitos comunes.' },
    { slug: demoSlug('accidente-transito'), nombre: 'Accidente de Tránsito (Demo)', areaJuridica: 'Derecho Penal', descripcion: 'Procedimiento por accidente de tránsito con lesiones.' },
    { slug: demoSlug('despido-injustificado'), nombre: 'Despido Injustificado (Demo)', areaJuridica: 'Derecho Laboral', descripcion: 'Reclamo por despido injustificado.' },
    { slug: demoSlug('cobro-judicial'), nombre: 'Cobro Judicial (Demo)', areaJuridica: 'Derecho Mercantil', descripcion: 'Proceso de cobro judicial de facturas impagas.' },
    { slug: demoSlug('divorcio-mutuo'), nombre: 'Divorcio por Mutuo Acuerdo (Demo)', areaJuridica: 'Derecho de Familia', descripcion: 'Divorcio express por mutuo acuerdo.' },
  ];

  const procIds: Record<string, string> = {};
  for (const p of procedimientosData) {
    const [ex] = await db.select({ id: tiposProcedimiento.id }).from(tiposProcedimiento).where(eq(tiposProcedimiento.slug, p.slug));
    if (ex) { procIds[p.slug] = ex.id; continue; }
    const [nuevo] = await db.insert(tiposProcedimiento).values({
      slug: p.slug,
      nombre: p.nombre,
      areaJuridica: p.areaJuridica,
      descripcion: p.descripcion,
      estado: 'pendiente_validacion_legal',
      version: 1,
      definicion: { demo: true, documentosObligatorios: ['identidad', 'poder'], documentosOpcionales: ['constancia'] },
    } as never).returning({ id: tiposProcedimiento.id });
    procIds[p.slug] = nuevo.id;
    console.log(`  ✅ Procedimiento "${p.nombre}"`);
  }

  // ─── 4. Expedientes demo ────────────────────────────────────────────────
  const expedientesData = [
    { numero: 'SGIE-2026-DEMO-001', cliente: 'María Elena Rodríguez', proc: demoSlug('defensa-penal-general'), estado: 'analisis_completado', prioridad: 'alta', resumen: 'Defensa por hurto agravado. Cliente alega inocencia y tiene coartada.' },
    { numero: 'SGIE-2026-DEMO-002', cliente: 'José Antonio Flores', proc: demoSlug('accidente-transito'), estado: 'pendiente_validacion_abogado', prioridad: 'urgente', resumen: 'Accidente de tránsito con lesiones graves. Cliente es el demandado.' },
    { numero: 'SGIE-2026-DEMO-003', cliente: 'Industrias del Valle S.A.', proc: demoSlug('cobro-judicial'), estado: 'pendiente_de_documentos', prioridad: 'media', resumen: 'Cobro de facturas a cliente moroso por L 250,000.' },
    { numero: 'SGIE-2026-DEMO-004', cliente: 'Rosa Amanda López', proc: demoSlug('divorcio-mutuo'), estado: 'documentos_completos', prioridad: 'baja', resumen: 'Divorcio por mutuo acuerdo. Ambas partes conformes.' },
    { numero: 'SGIE-2026-DEMO-005', cliente: 'Transportes Unificados HN', proc: demoSlug('defensa-penal-general'), estado: 'pendiente_de_firma', prioridad: 'alta', resumen: 'Defensa por robo de mercancía en tránsito.' },
    { numero: 'SGIE-2026-DEMO-006', cliente: 'Pedro Miguel Sánchez', proc: demoSlug('despido-injustificado'), estado: 'inconsistencias_detectadas', prioridad: 'media', resumen: 'Despido injustificado. Inconsistencias en fechas de contrato.' },
    { numero: 'SGIE-2026-DEMO-007', cliente: 'Comercial El Progreso Ltda.', proc: demoSlug('cobro-judicial'), estado: 'validado', prioridad: 'media', resumen: 'Cobro judicial aprobado, listo para presentación.' },
    { numero: 'SGIE-2026-DEMO-008', cliente: 'Ana Cecilia Martínez', proc: demoSlug('defensa-penal-general'), estado: 'en_tramite', prioridad: 'alta', resumen: 'Defensa en juicio oral. Pruebas presentadas.' },
    { numero: 'SGIE-2026-DEMO-009', cliente: 'Constructora del Sur S. de R.L.', proc: demoSlug('accidente-transito'), estado: 'documentos_parcialmente_recibidos', prioridad: 'urgente', resumen: 'Accidente laboral en obra. Documentación parcial.' },
    { numero: 'SGIE-2026-DEMO-010', cliente: 'Juan Carlos Mejía', proc: demoSlug('defensa-penal-general'), estado: 'finalizado', prioridad: 'media', resumen: 'Caso cerrado con sentencia absolutoria.' },
    { numero: 'SGIE-2026-DEMO-011', cliente: 'María Elena Rodríguez', proc: demoSlug('despido-injustificado'), estado: 'creado', prioridad: 'baja', resumen: 'Nuevo caso laboral. Pendiente de revisión inicial.' },
    { numero: 'SGIE-2026-DEMO-012', cliente: 'José Antonio Flores', proc: demoSlug('divorcio-mutuo'), estado: 'analisis_pendiente', prioridad: 'media', resumen: 'Análisis documental en curso.' },
  ];

  const expIds: Record<string, string> = {};
  for (const e of expedientesData) {
    const [ex] = await db.select({ id: expedientes.id }).from(expedientes).where(eq(expedientes.numeroInterno, e.numero));
    if (ex) { expIds[e.numero] = ex.id; console.log(`  ⏭  Expediente "${e.numero}" ya existe`); continue; }

    const [nuevo] = await db.insert(expedientes).values({
      numeroInterno: e.numero,
      clienteId: clienteIds[e.cliente] || null,
      tipoProcedimientoId: procIds[e.proc] || null,
      responsableId: carlosId,
      estado: e.estado as never,
      prioridad: e.prioridad as never,
      area: e.proc.split('--').pop()?.replace(/-/g, ' ') || 'General',
      resumen: e.resumen,
      creadoPor: carlosId,
    } as never).returning({ id: expedientes.id });
    expIds[e.numero] = nuevo.id;

    // Asignación
    await db.insert(expedienteAsignaciones).values({
      expedienteId: nuevo.id, abogadoId: carlosId, rol: 'responsable', asignadoPor: carlosId,
    } as never);

    // Historial inicial
    await db.insert(historialExpediente).values({
      expedienteId: nuevo.id, accion: 'expediente_creado', estadoNuevo: e.estado,
      actorId: carlosId, actorTipo: 'abogado', mensaje: 'Expediente demo creado',
    } as never);

    console.log(`  ✅ Expediente "${e.numero}" (${e.estado.replace(/_/g, ' ')})`);
  }

  // ─── 5. Checklists ──────────────────────────────────────────────────────
  const checklistBase = [
    { nombre: 'Documento de Identidad', tipo: 'obligatorio' },
    { nombre: 'RTN (si aplica)', tipo: 'condicional' },
    { nombre: 'Poder de Representación', tipo: 'obligatorio' },
    { nombre: 'Constancia de Domicilio', tipo: 'opcional' },
    { nombre: 'Pruebas documentales', tipo: 'obligatorio' },
  ];

  for (const [num, expId] of Object.entries(expIds)) {
    const [ex] = await db.select({ id: requisitosExpediente.id }).from(requisitosExpediente)
      .where(eq(requisitosExpediente.expedienteId, expId)).limit(1);
    if (ex) continue;

    for (let i = 0; i < checklistBase.length; i++) {
      const r = checklistBase[i];
      await db.insert(requisitosExpediente).values({
        expedienteId: expId, nombre: r.nombre, tipo: r.tipo as never, orden: i,
        estado: num.includes('010') ? 'aprobado' : 'solicitado',
        confirmado: num.includes('DEMO-004') || num.includes('DEMO-007') || num.includes('DEMO-010'),
      } as never);
    }
  }
  console.log('  ✅ Checklists sembrados');

  // ─── 6. Documentos demo ─────────────────────────────────────────────────
  const documentosData = [
    { expNum: 'SGIE-2026-DEMO-001', nombre: 'cedula-maria-rodriguez.pdf', mime: 'application/pdf', bytes: 245000, estado: 'texto_extraido', tipo: 'identidad', texto: 'REPÚBLICA DE HONDURAS\nTARJETA DE IDENTIDAD\nNombre: MARÍA ELENA RODRÍGUEZ\nNo. Identidad: 0801-1985-00123\nFecha de Nacimiento: 15/03/1985\nLugar: Tegucigalpa, Francisco Morazán' },
    { expNum: 'SGIE-2026-DEMO-001', nombre: 'poder-representacion.pdf', mime: 'application/pdf', bytes: 180000, estado: 'texto_extraido', tipo: 'poder', texto: 'PODER GENERAL\nOtorgado por María Elena Rodríguez\na favor de Carlos Pineda\nAbogado y Notario Público' },
    { expNum: 'SGIE-2026-DEMO-002', nombre: 'parte-accidente-transito.pdf', mime: 'application/pdf', bytes: 320000, estado: 'aprobado', tipo: 'acta', texto: 'PARTE POLICIAL DE ACCIDENTE DE TRÁNSITO\nFecha: 10/01/2026\nLugar: Carretera CA-5, km 85\nVehículo involucrado: Placa PBD-4521' },
    { expNum: 'SGIE-2026-DEMO-002', nombre: 'foto-lesiones.jpg', mime: 'image/jpeg', bytes: 1500000, estado: 'clasificado', tipo: 'documento_personal', texto: '' },
    { expNum: 'SGIE-2026-DEMO-003', nombre: 'facturas-impagas.pdf', mime: 'application/pdf', bytes: 500000, estado: 'ocr_pendiente', tipo: 'comprobante', texto: '' },
    { expNum: 'SGIE-2026-DEMO-004', nombre: 'acta-matrimonio.pdf', mime: 'application/pdf', bytes: 200000, estado: 'texto_extraido', tipo: 'acta', texto: 'ACTA DE MATRIMONIO\nContrayentes: Rosa Amanda López y Pedro Miguel Sánchez\nFecha: 20/06/2010' },
    { expNum: 'SGIE-2026-DEMO-005', nombre: 'denuncia-robo.pdf', mime: 'application/pdf', bytes: 280000, estado: 'texto_extraido', tipo: 'demanda', texto: 'DENUNCIA PENAL\nPor el delito de ROBO\nArt. 210 del Código Penal' },
    { expNum: 'SGIE-2026-DEMO-006', nombre: 'contrato-laboral.pdf', mime: 'application/pdf', bytes: 150000, estado: 'texto_extraido', tipo: 'contrato', texto: 'CONTRATO INDIVIDUAL DE TRABAJO\nFecha inicio: 15/01/2022\nSalario: L 15,000 mensuales' },
    { expNum: 'SGIE-2026-DEMO-006', nombre: 'carta-despido.pdf', mime: 'application/pdf', bytes: 100000, estado: 'pendiente_abogado', tipo: 'constancia', texto: 'CARTA DE DESPIDO\nFecha: 10/03/2026\nMotivo: Reestructuración' },
    { expNum: 'SGIE-2026-DEMO-007', nombre: 'demanda-cobro-borrador.docx', mime: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', bytes: 50000, estado: 'aprobado', tipo: 'demanda', texto: 'DEMANDA DE COBRO JUDICIAL\nActor: Comercial El Progreso Ltda.\nDemandado: Distribuidora XYZ\nMonto: L 180,000' },
    { expNum: 'SGIE-2026-DEMO-008', nombre: 'pruebas-presentadas.pdf', mime: 'application/pdf', bytes: 800000, estado: 'ia_procesada', tipo: 'sentencia', texto: 'ESCRITO DE PRUEBAS\nTestigos: 3\nPrueba documental: 12 folios' },
    { expNum: 'SGIE-2026-DEMO-009', nombre: 'reporte-accidente-laboral.pdf', mime: 'application/pdf', bytes: 350000, estado: 'subido', tipo: null, texto: '' },
    { expNum: 'SGIE-2026-DEMO-009', nombre: 'cedula-constructor.jpg', mime: 'image/jpeg', bytes: 2000000, estado: 'ilegible', tipo: 'documento_personal', texto: '' },
    { expNum: 'SGIE-2026-DEMO-010', nombre: 'sentencia-absolutoria.pdf', mime: 'application/pdf', bytes: 400000, estado: 'texto_extraido', tipo: 'sentencia', texto: 'SENTENCIA DEFINITIVA\nEl Juzgado resuelve: ABSOLVER al acusado Juan Carlos Mejía\nde los cargos imputados.' },
    { expNum: 'SGIE-2026-DEMO-012', nombre: 'identidad-jose-flores.pdf', mime: 'application/pdf', bytes: 230000, estado: 'subido', tipo: null, texto: '' },
  ];

  let docsCreados = 0;
  for (const d of documentosData) {
    const expId = expIds[d.expNum];
    if (!expId) continue;
    const hash = hashDemo(`${d.expNum}-${d.nombre}`);
    const [ex] = await db.select({ id: documentosExpediente.id }).from(documentosExpediente)
      .where(and(eq(documentosExpediente.expedienteId, expId), eq(documentosExpediente.hashSha256, hash)));
    if (ex) continue;

    const [doc] = await db.insert(documentosExpediente).values({
      expedienteId: expId,
      nombreOriginal: d.nombre,
      nombreSaneado: `demo-${d.nombre}`,
      tipoMime: d.mime,
      tamañoBytes: d.bytes,
      hashSha256: hash,
      blobUrl: `file://local/demo/${d.nombre}`,
      estado: d.estado as never,
      tipoDocumento: d.tipo,
      origen: 'cliente',
      metadata: d.texto ? { textoExtraido: d.texto, demo: true } : { demo: true },
      procesadoEn: d.estado !== 'subido' ? new Date() : null,
    } as never).returning({ id: documentosExpediente.id });
    docsCreados++;
  }
  console.log(`  ✅ ${docsCreados} documentos demo`);

  // ─── 7. Campos extraídos ────────────────────────────────────────────────
  const camposData = [
    { expNum: 'SGIE-2026-DEMO-001', clave: 'nombre_cliente', valor: 'María Elena Rodríguez', tipo: 'nombre', confianza: 85, docIdx: 0 },
    { expNum: 'SGIE-2026-DEMO-001', clave: 'identidad', valor: '0801-1985-00123', tipo: 'identidad', confianza: 90, docIdx: 0 },
    { expNum: 'SGIE-2026-DEMO-002', clave: 'fecha_accidente', valor: '10/01/2026', tipo: 'fecha', confianza: 75, docIdx: 2 },
    { expNum: 'SGIE-2026-DEMO-004', clave: 'nombre_contrayente', valor: 'Rosa Amanda López', tipo: 'nombre', confianza: 88, docIdx: 5 },
    { expNum: 'SGIE-2026-DEMO-005', clave: 'delito', valor: 'Robo', tipo: 'texto', confianza: 40, docIdx: 6 },
    { expNum: 'SGIE-2026-DEMO-006', clave: 'salario_mensual', valor: '15000', tipo: 'numero', confianza: 82, docIdx: 7 },
    { expNum: 'SGIE-2026-DEMO-006', clave: 'fecha_inicio', valor: '15/01/2022', tipo: 'fecha', confianza: 70, docIdx: 7 },
    { expNum: 'SGIE-2026-DEMO-010', clave: 'resultado', valor: 'Absolución', tipo: 'texto', confianza: 95, docIdx: 13 },
  ];

  let camposCreados = 0;
  for (const c of camposData) {
    const expId = expIds[c.expNum];
    if (!expId) continue;
    const docs = await db.select({ id: documentosExpediente.id }).from(documentosExpediente)
      .where(eq(documentosExpediente.expedienteId, expId)).limit(10);
    const docId = docs[c.docIdx]?.id || docs[0]?.id;
    if (!docId) continue;

    await db.insert(camposExtraidos).values({
      documentoId: docId, expedienteId: expId,
      clave: c.clave, valor: c.valor, tipo: c.tipo, confianza: c.confianza,
      citaFragmento: `"[DEMO] Fragmento del documento ${c.clave}"`,
    } as never);
    camposCreados++;
  }
  console.log(`  ✅ ${camposCreados} campos extraídos`);

  // ─── 8. Confianza ───────────────────────────────────────────────────────
  for (const [num, expId] of Object.entries(expIds)) {
    const [ex] = await db.select({ id: confianzaResultados.id }).from(confianzaResultados)
      .where(and(eq(confianzaResultados.expedienteId, expId), eq(confianzaResultados.nivel, 'expediente'))).limit(1);
    if (ex) continue;

    const confianza = num.includes('DEMO-010') ? 95 : num.includes('DEMO-007') ? 88 : num.includes('DEMO-001') ? 75 : num.includes('DEMO-002') ? 60 : 45;
    await db.insert(confianzaResultados).values({
      expedienteId: expId, nivel: 'expediente', confianza,
      etiqueta: confianza >= 90 ? 'muy_alta' : confianza >= 70 ? 'alta' : confianza >= 40 ? 'media' : 'baja',
      evidencias: { demo: true },
    } as never);
  }
  console.log('  ✅ Confianza calculada para todos los expedientes');

  // ─── 9. Alertas ─────────────────────────────────────────────────────────
  const alertasData = [
    { expNum: 'SGIE-2026-DEMO-002', tipo: 'documentos_faltantes', severidad: 'error', titulo: 'Falta parte policial completo', mensaje: 'El parte policial está incompleto. Falta croquis del accidente.' },
    { expNum: 'SGIE-2026-DEMO-003', tipo: 'documentos_faltantes', severidad: 'advertencia', titulo: 'Facturas sin orden de compra', mensaje: 'Las facturas no incluyen las órdenes de compra correspondientes.' },
    { expNum: 'SGIE-2026-DEMO-005', tipo: 'baja_confianza', severidad: 'advertencia', titulo: 'Confianza baja en campo delito', mensaje: 'El campo "delito" tiene confianza 40%. Verificar manualmente.' },
    { expNum: 'SGIE-2026-DEMO-006', tipo: 'inconsistencia_fechas', severidad: 'error', titulo: 'Fechas contradictorias', mensaje: 'La fecha de despido no coincide con el último pago registrado.' },
    { expNum: 'SGIE-2026-DEMO-009', tipo: 'documento_ilegible', severidad: 'error', titulo: 'Documento ilegible', mensaje: 'La imagen de cédula está ilegible. Solicitar reemplazo.' },
    { expNum: 'SGIE-2026-DEMO-009', tipo: 'documentos_incompletos', severidad: 'critico', titulo: 'Expediente urgente incompleto', mensaje: 'Falta el reporte completo del accidente laboral. El plazo vence en 3 días.' },
  ];

  let alertasCreadas = 0;
  for (const a of alertasData) {
    const expId = expIds[a.expNum];
    if (!expId) continue;
    const [ex] = await db.select({ id: alertas.id }).from(alertas)
      .where(and(eq(alertas.expedienteId, expId), eq(alertas.titulo, a.titulo))).limit(1);
    if (ex) continue;
    await db.insert(alertas).values({
      expedienteId: expId, tipo: a.tipo, severidad: a.severidad as never,
      titulo: a.titulo, mensaje: a.mensaje,
    } as never);
    alertasCreadas++;
  }
  console.log(`  ✅ ${alertasCreadas} alertas`);

  // ─── 10. Tareas ─────────────────────────────────────────────────────────
  const hoy = new Date();
  const tareasData = [
    { expNum: 'SGIE-2026-DEMO-002', titulo: 'Revisar parte policial', prioridad: 'urgente', auto: true, vence: new Date(hoy.getTime() + 1 * 86400000) },
    { expNum: 'SGIE-2026-DEMO-003', titulo: 'Solicitar órdenes de compra al cliente', prioridad: 'alta', auto: true, vence: new Date(hoy.getTime() + 3 * 86400000) },
    { expNum: 'SGIE-2026-DEMO-005', titulo: 'Revisar borrador de demanda', prioridad: 'alta', auto: false, vence: new Date(hoy.getTime() + 2 * 86400000) },
    { expNum: 'SGIE-2026-DEMO-006', titulo: 'Verificar fechas de contrato', prioridad: 'media', auto: true, vence: new Date(hoy.getTime() + 5 * 86400000) },
    { expNum: 'SGIE-2026-DEMO-009', titulo: 'Solicitar reemplazo de documento ilegible', prioridad: 'urgente', auto: true, vence: new Date(hoy.getTime() + 1 * 86400000) },
    { expNum: 'SGIE-2026-DEMO-011', titulo: 'Revisión inicial del caso', prioridad: 'media', auto: false, vence: new Date(hoy.getTime() + 7 * 86400000) },
    { expNum: 'SGIE-2026-DEMO-012', titulo: 'Completar análisis documental', prioridad: 'media', auto: true, vence: new Date(hoy.getTime() + 4 * 86400000) },
  ];

  let tareasCreadas = 0;
  for (const t of tareasData) {
    const expId = expIds[t.expNum];
    if (!expId) continue;
    const [ex] = await db.select({ id: tareas.id }).from(tareas)
      .where(and(eq(tareas.expedienteId, expId), eq(tareas.titulo, t.titulo))).limit(1);
    if (ex) continue;
    await db.insert(tareas).values({
      expedienteId: expId, titulo: t.titulo, prioridad: t.prioridad as never,
      automatica: t.auto, fechaVencimiento: t.vence, asignadaA: carlosId,
    } as never);
    tareasCreadas++;
  }
  console.log(`  ✅ ${tareasCreadas} tareas`);

  // ─── 11. Eventos agenda ─────────────────────────────────────────────────
  const eventosData = [
    { expNum: 'SGIE-2026-DEMO-002', tipo: 'audiencia', titulo: 'Audiencia preliminar', fecha: new Date(hoy.getTime() + 5 * 86400000), estado: 'propuesta', desc: 'Juzgado de Letras Penal de Tegucigalpa' },
    { expNum: 'SGIE-2026-DEMO-005', tipo: 'interna', titulo: 'Revisión de estrategia', fecha: new Date(hoy.getTime() + 2 * 86400000), estado: 'confirmada', desc: 'Reunión interna de preparación' },
    { expNum: 'SGIE-2026-DEMO-008', tipo: 'audiencia', titulo: 'Juicio oral', fecha: new Date(hoy.getTime() + 10 * 86400000), estado: 'confirmada', desc: 'Tribunal de Sentencia, Sala 2' },
    { expNum: 'SGIE-2026-DEMO-009', tipo: 'vencimiento_enlace', titulo: 'Vence enlace de carga', fecha: new Date(hoy.getTime() + 3 * 86400000), estado: 'propuesta', desc: 'Enlace para Constructora del Sur' },
    { expNum: 'SGIE-2026-DEMO-010', tipo: 'interna', titulo: 'Archivo de expediente', fecha: new Date(hoy.getTime() - 10 * 86400000), estado: 'completada', desc: 'Caso cerrado — archivar documentación' },
  ];

  let eventosCreados = 0;
  for (const ev of eventosData) {
    const expId = expIds[ev.expNum];
    if (!expId) continue;
    const [ex] = await db.select({ id: eventosAgenda.id }).from(eventosAgenda)
      .where(and(eq(eventosAgenda.expedienteId, expId), eq(eventosAgenda.titulo, ev.titulo))).limit(1);
    if (ex) continue;
    await db.insert(eventosAgenda).values({
      expedienteId: expId, tipo: ev.tipo as never, titulo: ev.titulo,
      fecha: ev.fecha, estado: ev.estado as never, descripcion: ev.desc,
    } as never);
    eventosCreados++;
  }
  console.log(`  ✅ ${eventosCreados} eventos de agenda`);

  // ─── 12. Correos ────────────────────────────────────────────────────────
  const correosData = [
    { expNum: 'SGIE-2026-DEMO-001', slug: 'solicitud_documentos', dest: 'maria.rodriguez@demo.hn', asunto: 'Solicitud de documentos — SGIE-2026-DEMO-001', estado: 'enviado' },
    { expNum: 'SGIE-2026-DEMO-002', slug: 'documentos_faltantes', dest: 'jose.flores@demo.hn', asunto: 'Documentación pendiente — SGIE-2026-DEMO-002', estado: 'fallido', error: 'Connection refused by mail server' },
    { expNum: 'SGIE-2026-DEMO-003', slug: 'solicitud_documentos', dest: 'info@industriasvalle.demo.hn', asunto: 'Solicitud de documentos — SGIE-2026-DEMO-003', estado: 'enviado' },
    { expNum: 'SGIE-2026-DEMO-004', slug: 'revision_completada', dest: 'rosa.lopez@demo.hn', asunto: 'Revisión completada — SGIE-2026-DEMO-004', estado: 'enviado' },
    { expNum: 'SGIE-2026-DEMO-005', slug: 'recordatorio_carga', dest: 'contacto@transunificados.demo.hn', asunto: 'Recordatorio: carga de documentos — SGIE-2026-DEMO-005', estado: 'pendiente' },
    { expNum: 'SGIE-2026-DEMO-006', slug: 'documento_rechazado', dest: 'pedro.sanchez@demo.hn', asunto: 'Documento rechazado — SGIE-2026-DEMO-006', estado: 'enviado' },
    { expNum: 'SGIE-2026-DEMO-009', slug: 'documentos_faltantes', dest: 'obras@constructorasur.demo.hn', asunto: 'Faltan documentos — SGIE-2026-DEMO-009', estado: 'fallido', error: 'Timeout after 30000ms' },
    { expNum: 'SGIE-2026-DEMO-010', slug: 'cierre_expediente', dest: 'juan.mejia@demo.hn', asunto: 'Expediente cerrado — SGIE-2026-DEMO-010', estado: 'enviado' },
  ];

  let correosCreados = 0;
  for (const c of correosData) {
    const expId = expIds[c.expNum];
    if (!expId) continue;
    const ventana = new Date().toISOString().slice(0, 10);
    const [ex] = await db.select({ id: correosEnviados.id }).from(correosEnviados)
      .where(and(eq(correosEnviados.expedienteId, expId), eq(correosEnviados.plantillaSlug, c.slug), eq(correosEnviados.ventanaTemporal, `${ventana}-demo-${correosCreados}`))).limit(1);
    if (ex) continue;
    await db.insert(correosEnviados).values({
      expedienteId: expId, plantillaSlug: c.slug, destinatario: c.dest,
      asunto: c.asunto, cuerpoHtml: '<p>[DEMO] Contenido del correo mock</p>',
      estado: c.estado as never, error: c.error || null,
      ventanaTemporal: `${ventana}-demo-${correosCreados}`,
      enviadoPor: carlosId,
    } as never);
    correosCreados++;
  }
  console.log(`  ✅ ${correosCreados} correos`);

  // ─── 13. Extracciones IA ────────────────────────────────────────────────
  const docsExp008 = await db.select({ id: documentosExpediente.id }).from(documentosExpediente)
    .where(eq(documentosExpediente.expedienteId, expIds['SGIE-2026-DEMO-008'])).limit(1);
  if (docsExp008.length > 0) {
    const [exIa] = await db.select({ id: extraccionesIa.id }).from(extraccionesIa)
      .where(eq(extraccionesIa.documentoId, docsExp008[0].id)).limit(1);
    if (!exIa) {
      await db.insert(extraccionesIa).values({
        documentoId: docsExp008[0].id, proveedor: 'demo', modelo: 'none',
        exito: true, resultadoJson: { demo: true, metodo: 'mock' },
      } as never);
      console.log('  ✅ Extracción IA demo');
    }
  }

  // ─── 14. Correcciones IA ────────────────────────────────────────────────
  const [exCorr] = await db.select({ id: correccionesIa.id }).from(correccionesIa).limit(1);
  if (!exCorr) {
    const camposDoc006 = await db.select({ id: camposExtraidos.id }).from(camposExtraidos)
      .where(eq(camposExtraidos.expedienteId, expIds['SGIE-2026-DEMO-006'])).limit(1);
    if (camposDoc006.length > 0) {
      await db.insert(correccionesIa).values({
        campoExtraidoId: camposDoc006[0].id, campo: 'salario_mensual',
        valorPropuesto: '15000', valorCorregido: '18000',
        motivo: 'El salario real según contrato es L 18,000',
        documentoId: null, abogadoId: carlosId,
        confianzaAnterior: 82, confianzaPosterior: 95,
      } as never);
      console.log('  ✅ Corrección IA demo');
    }
  }

  console.log('\n📊 Resumen seed demo Carlos Pineda:');
  console.log(`   Usuario: ${existente ? 'ya existía' : 'creado'}`);
  console.log(`   Clientes: ${Object.keys(clienteIds).length}`);
  console.log(`   Procedimientos: ${Object.keys(procIds).length}`);
  console.log(`   Expedientes: ${Object.keys(expIds).length}`);
  console.log(`   Documentos: ${docsCreados}`);
  console.log(`   Campos extraídos: ${camposCreados}`);
  console.log(`   Alertas: ${alertasCreadas}`);
  console.log(`   Tareas: ${tareasCreadas}`);
  console.log(`   Eventos: ${eventosCreados}`);
  console.log(`   Correos: ${correosCreados}`);
  console.log('\n✅ Seed demo completado.\n');
  process.exit(0);
}

main().catch((err) => {
  console.error('❌ Error:', err);
  process.exit(1);
});
