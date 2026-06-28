/**
 * SGIE — Generación de PDF de reportes server-side (Sprint 3, tarea 2).
 *
 * Usa `pdfkit` (ligera, sin Chromium/Puppeteer, pura Node). Genera un PDF
 * profesional con título, fecha, filtros, métricas, tablas y pie de página.
 *
 * No depende de datos sensibles: recibe un payload ya agregado y con scope
 * aplicado. Devuelve un Buffer listo para Response.
 *
 * Sprint 3. Dependencia añadida: pdfkit (justificada en CHANGELOG).
 */
import PDFDocument from 'pdfkit';
import type { MetricasReporte } from './reportes-db';
import { traducirEstadoExpediente } from './estados';

export interface FiltrosPdf {
  fechaDesde?: string;
  fechaHasta?: string;
  estado?: string;
}

/**
 * Genera el PDF de un reporte SGIE. Devuelve un Buffer.
 */
export function generarPdfReporte(opts: {
  metricas: MetricasReporte;
  filtros: FiltrosPdf;
  generadoPor: string;
}): Buffer {
  const { metricas, filtros, generadoPor } = opts;
  const doc = new PDFDocument({ size: 'A4', margin: 50, bufferPages: true });
  const chunks: Buffer[] = [];
  doc.on('data', (c: Buffer) => chunks.push(c));

  // ── Cabecera ──────────────────────────────────────────────────────────────
  doc
    .fontSize(20)
    .fillColor('#0f172a')
    .font('Helvetica-Bold')
    .text('Reporte SGIE', { align: 'left' });

  doc.moveDown(0.3);
  doc
    .fontSize(9)
    .fillColor('#64748b')
    .font('Helvetica')
    .text(`Pineda y Asociados · Generado el ${new Date().toLocaleString('es-HN')} por ${generadoPor}`);

  // Línea separadora
  doc.moveTo(50, doc.y + 4).lineTo(doc.page.width - 50, doc.y + 4).strokeColor('#d4af37').lineWidth(1.5).stroke();
  doc.moveDown(1);

  // ── Filtros aplicados ─────────────────────────────────────────────────────
  doc.fontSize(11).fillColor('#0f172a').font('Helvetica-Bold').text('Filtros aplicados');
  doc.moveDown(0.2);
  doc.fontSize(9).fillColor('#475569').font('Helvetica');
  const tieneFiltros = filtros.fechaDesde || filtros.fechaHasta || filtros.estado;
  if (!tieneFiltros) {
    doc.text('• Sin filtros (todos los datos accesibles)');
  } else {
    if (filtros.fechaDesde) doc.text(`• Desde: ${filtros.fechaDesde.slice(0, 10)}`);
    if (filtros.fechaHasta) doc.text(`• Hasta: ${filtros.fechaHasta.slice(0, 10)}`);
    if (filtros.estado) doc.text(`• Estado: ${traducirEstadoExpediente(filtros.estado)}`);
  }
  doc.moveDown(1);

  // ── Métricas principales ──────────────────────────────────────────────────
  doc.fontSize(11).fillColor('#0f172a').font('Helvetica-Bold').text('Métricas principales');
  doc.moveDown(0.2);
  const metricasPrincipales: [string, number][] = [
    ['Expedientes totales', metricas.expedientes.total],
    ['Tareas vencidas', metricas.tareas.vencidas],
    ['Tareas completadas', metricas.tareas.completadas],
    ['Documentos pendientes', metricas.documentos.pendientesValidacion],
    ['Alertas activas', metricas.alertas.activas],
    ['Enlaces activos', metricas.enlaces.activos],
  ];
  doc.fontSize(9).fillColor('#475569').font('Helvetica');
  for (const [label, valor] of metricasPrincipales) {
    doc.text(`• ${label}: `, { continued: true })
      .font('Helvetica-Bold').fillColor('#0f172a').text(String(valor));
    doc.font('Helvetica').fillColor('#475569');
  }
  doc.moveDown(1);

  // ── Tabla: expedientes por estado ─────────────────────────────────────────
  dibujarTabla(doc, 'Expedientes por estado', ['Estado', 'Cantidad'],
    metricas.expedientes.porEstado.map((e) => [traducirEstadoExpediente(e.estado), String(e.n)]));

  // ── Tabla: expedientes por abogado ────────────────────────────────────────
  if (metricas.expedientes.porAbogado.length > 0) {
    dibujarTabla(doc, 'Expedientes por abogado', ['Abogado', 'Cantidad'],
      metricas.expedientes.porAbogado.map((a) => [a.nombre, String(a.n)]));
  }

  // ── Tabla: expedientes por cliente (top 8) ────────────────────────────────
  if (metricas.expedientes.porCliente.length > 0) {
    dibujarTabla(doc, 'Expedientes por cliente (top)', ['Cliente', 'Cantidad'],
      metricas.expedientes.porCliente.slice(0, 8).map((c) => [c.nombre, String(c.n)]));
  }

  // ── Pie de página en todas las páginas ────────────────────────────────────
  const range = doc.bufferedPageRange();
  for (let i = range.start; i < range.start + range.count; i++) {
    doc.switchToPage(i);
    doc.fontSize(8).fillColor('#94a3b8').font('Helvetica')
      .text(
        `Pineda y Asociados · SGIE · Página ${i + 1} de ${range.count} · Documento confidencial`,
        50,
        doc.page.height - 40,
        { align: 'center', width: doc.page.width - 100 },
      );
  }

  doc.end();

  // Sincronizar: pdfkit emite 'end' pero el Buffer se completa al final.
  // Como generamos sync con bufferPages, devolvemos la concatenación.
  return Buffer.concat(chunks);
}

/** Dibuja una tabla simple con cabecera + filas. */
function dibujarTabla(
  doc: InstanceType<typeof PDFDocument>,
  titulo: string,
  cabeceras: string[],
  filas: string[][],
): void {
  doc.moveDown(0.5);
  doc.fontSize(11).fillColor('#0f172a').font('Helvetica-Bold').text(titulo);
  doc.moveDown(0.2);

  const colWidth = (doc.page.width - 100) / cabeceras.length;
  const startY = doc.y;

  // Cabecera
  doc.font('Helvetica-Bold').fontSize(9).fillColor('#0f172a');
  cabeceras.forEach((h, i) => {
    doc.text(h, 50 + i * colWidth, startY, { width: colWidth });
  });
  doc.moveTo(50, doc.y).lineTo(doc.page.width - 50, doc.y).strokeColor('#cbd5e1').lineWidth(0.5).stroke();
  doc.moveDown(0.2);

  // Filas
  doc.font('Helvetica').fillColor('#334155');
  for (const fila of filas) {
    const rowY = doc.y;
    fila.forEach((celda, i) => {
      doc.text(celda, 50 + i * colWidth, rowY, { width: colWidth });
    });
    doc.moveDown(0.4);
  }
}
