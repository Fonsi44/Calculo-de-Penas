/**
 * SGIE — Motor documental (Fase 6).
 *
 * Procesa documentos ya persistidos vía jobs idempotentes. Responsabilidades:
 *   - Extraer texto de PDFs con capa textual (pdf-parse, sin OCR).
 *   - Clasificar heurísticamente por nombre, MIME y contenido textual.
 *   - Cache por hash SHA-256 (no re-procesar duplicados).
 *   - Actualizar estados documentales (§12.3).
 *   - No ejecutar procesamiento pesado en route handlers.
 *   - Sin IA (Fase 7).
 *
 * Referencia: pinedayasociados.md §12, §12.3–§12.5.
 */
import { db } from '@/lib/db';
import { documentosExpediente, extraccionesIa, jobsSgie, historialExpediente } from '@/lib/schema';
import { eq, and, ne } from 'drizzle-orm';
import { reclamarJob, completarJob, fallarJob } from '@/lib/sgie/jobs-db';

// ─── Tipos ───────────────────────────────────────────────────────────────────

export interface ResultadoExtraccion {
  texto: string;
  paginas: number;
  metodo: 'capa_texto_pdf' | 'vacio';
}

export interface ResultadoClasificacion {
  tipoDocumento: string;
  confianza: number; // 0–100
  evidencias: string[];
  motivo: string;
}

export interface ResultadoProcesamiento {
  documentoId: string;
  estadoFinal: string;
  textoExtraido?: string;
  clasificacion?: ResultadoClasificacion;
  cacheHit: boolean;
  error?: string;
}

// ─── Catálogo heurístico ─────────────────────────────────────────────────────

interface ReglaClasificacion {
  tipo: string;
  patronesNombre: RegExp[];
  patronesTexto: RegExp[];
  patronesMime: string[];
  peso: number;
}

const REGLAS_CLASIFICACION: ReglaClasificacion[] = [
  {
    tipo: 'identidad',
    patronesNombre: [/identidad|dni|cedula|tarjeta.*ident/i],
    patronesTexto: [/número\s*de\s*identidad|identidad\s*№|DNI\s*№|\b\d{4}-\d{4}-\d{5}\b/],
    patronesMime: ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'],
    peso: 3,
  },
  {
    tipo: 'rtn',
    patronesNombre: [/rtn|registro.*tributario/i],
    patronesTexto: [/R\.?T\.?N\.?|Registro\s+Tributario\s+Nacional|\b\d{14}\b/],
    patronesMime: ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'],
    peso: 3,
  },
  {
    tipo: 'acta',
    patronesNombre: [/acta|partida|certificad/i],
    patronesTexto: [/acta\s+de\s+|certific[aoó]\s+de\s+|partida\s+de\s+|Registro\s+Civil|folio\s+№/i],
    patronesMime: ['application/pdf', 'image/jpeg', 'image/png'],
    peso: 2,
  },
  {
    tipo: 'poder',
    patronesNombre: [/poder|mandato|representaci[oó]n/i],
    patronesTexto: [/poder\s+(general|especial)|mandato|apoderado|representante\s+legal|otorg[aá].*poder/i],
    patronesMime: ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
    peso: 3,
  },
  {
    tipo: 'contrato',
    patronesNombre: [/contrato|convenio|acuerdo/i],
    patronesTexto: [/contrato\s+(de|privado|mercantil|laboral|arrendamiento)|convenio|comparecen|cl[aá]usulas/i],
    patronesMime: ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
    peso: 2,
  },
  {
    tipo: 'constancia',
    patronesNombre: [/constancia|certificaci[oó]n/i],
    patronesTexto: [/constancia|hace\s+constar|certifica\s+que|por\s+medio\s+de\s+la\s+presente/i],
    patronesMime: ['application/pdf', 'image/jpeg', 'image/png'],
    peso: 2,
  },
  {
    tipo: 'demanda',
    patronesNombre: [/demanda|escrito\s+inicial|querella/i],
    patronesTexto: [/demanda|querella|escrito\s+inicial|juzgado|tribunal|expediente\s+judicial/i],
    patronesMime: ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
    peso: 2,
  },
  {
    tipo: 'sentencia',
    patronesNombre: [/sentencia|resoluci[oó]n|fallo/i],
    patronesTexto: [/sentencia|fallo|resuelve|condena|absuelve|juez|magistrado/i],
    patronesMime: ['application/pdf'],
    peso: 2,
  },
  {
    tipo: 'documento_personal',
    patronesNombre: [/foto|fotograf[ií]a|pasaporte|licencia|carnet/i],
    patronesTexto: [],
    patronesMime: ['image/jpeg', 'image/png', 'image/webp'],
    peso: 1,
  },
  {
    tipo: 'comprobante',
    patronesNombre: [/comprobante|recibo|factura|boleta|pago/i],
    patronesTexto: [/comprobante|recibo|factura|pago|total|importe/i],
    patronesMime: ['application/pdf', 'image/jpeg', 'image/png'],
    peso: 1,
  },
];

// ─── Extracción de texto ─────────────────────────────────────────────────────

async function descargarBlob(url: string): Promise<ArrayBuffer> {
  // Vercel Blob privado: requiere token en el fetch.
  // En desarrollo local con file:// usamos fs.
  if (url.startsWith('file://local/')) {
    const { readFile } = await import('fs/promises');
    const { join } = await import('path');
    const nombre = url.replace('file://local/', '');
    return (await readFile(join(process.cwd(), 'private-uploads', 'sgie', nombre))).buffer;
  }

  const token = process.env.BLOB_READ_WRITE_TOKEN;
  const headers: Record<string, string> = {};
  if (token && token.trim().length > 0 && !token.includes('PEGA_AQUI')) {
    headers['Authorization'] = `Bearer ${token.trim()}`;
  }

  const res = await fetch(url, { headers });
  if (!res.ok) {
    throw new Error(`No se pudo descargar el blob: HTTP ${res.status}`);
  }
  return res.arrayBuffer();
}

export async function extraerTextoDePdf(
  buffer: ArrayBuffer,
): Promise<ResultadoExtraccion> {
  try {
    // pdfjs-dist: extrae texto de la capa textual del PDF (sin OCR).
    // Usamos el build legacy para compatibilidad con Node.js.
    const pdfjsLib = await import('pdfjs-dist/legacy/build/pdf.mjs');

    const loadingTask = pdfjsLib.getDocument({
      data: new Uint8Array(buffer),
      disableAutoFetch: true,
      disableStream: true,
    });

    const pdf = await loadingTask.promise;
    const numPages = pdf.numPages;
    const partes: string[] = [];

    for (let i = 1; i <= numPages; i++) {
      const page = await pdf.getPage(i);
      const textContent = await page.getTextContent();
      const pageText = textContent.items
        .filter((item: unknown) => typeof (item as { str?: string }).str === 'string' && (item as { str: string }).str.trim().length > 0)
        .map((item: unknown) => (item as { str: string }).str)
        .join(' ');
      if (pageText.trim()) {
        partes.push(pageText.trim());
      }
    }

    const texto = partes.join('\n').trim();

    if (texto.length < 10) {
      return { texto: '', paginas: numPages, metodo: 'vacio' };
    }

    return {
      texto,
      paginas: numPages,
      metodo: 'capa_texto_pdf',
    };
  } catch {
    return { texto: '', paginas: 0, metodo: 'vacio' };
  }
}

// ─── Clasificación heurística ────────────────────────────────────────────────

export function clasificarDocumentoHeuristicamente(
  nombreOriginal: string,
  tipoMime: string,
  textoExtraido?: string,
): ResultadoClasificacion {
  const puntuaciones: Map<string, number> = new Map();
  const motivos: Map<string, string[]> = new Map();

  for (const regla of REGLAS_CLASIFICACION) {
    let puntuacion = 0;
    const coincidencias: string[] = [];

    // Nombre
    for (const pat of regla.patronesNombre) {
      if (pat.test(nombreOriginal)) {
        puntuacion += 2 * regla.peso;
        coincidencias.push(`nombre coincide con "${regla.tipo}": ${pat}`);
      }
    }

    // MIME
    if (regla.patronesMime.includes(tipoMime)) {
      puntuacion += regla.peso;
    }

    // Texto (solo si hay texto extraído)
    if (textoExtraido && regla.patronesTexto.length > 0) {
      for (const pat of regla.patronesTexto) {
        if (pat.test(textoExtraido)) {
          puntuacion += 3 * regla.peso;
          coincidencias.push(`texto coincide con "${regla.tipo}": ${pat}`);
        }
      }
    }

    if (puntuacion > 0) {
      puntuaciones.set(regla.tipo, puntuacion);
      motivos.set(regla.tipo, coincidencias);
    }
  }

  if (puntuaciones.size === 0) {
    return {
      tipoDocumento: 'otro',
      confianza: 20,
      evidencias: ['sin coincidencias heurísticas'],
      motivo: 'Ninguna regla heurística coincidió con el nombre, MIME o texto del documento.',
    };
  }

  // Ordenar por puntuación descendente
  const mejor = [...puntuaciones.entries()].sort((a, b) => b[1] - a[1])[0];
  const puntuacionMax = mejor[1];
  const maxTeorico = 20; // Puntuación máxima teórica aproximada

  // Calcular confianza normalizada 0-100
  const confianza = Math.min(100, Math.round((puntuacionMax / maxTeorico) * 100));

  const coincidencias = motivos.get(mejor[0]) ?? [];

  return {
    tipoDocumento: mejor[0],
    confianza,
    evidencias: coincidencias,
    motivo: `Clasificado como "${mejor[0]}" por heurística (confianza ${confianza}%). Coincidencias: ${coincidencias.length}`,
  };
}

// ─── Cache por hash ──────────────────────────────────────────────────────────

interface CacheResultado {
  documentoId: string;
  textoExtraido: string | null;
  tipoDocumento: string | null;
  confianza: number | null;
  estado: string;
}

export async function buscarCachePorHash(
  hashSha256: string,
  excluirDocumentoId: string,
): Promise<CacheResultado | null> {
  // Buscar entre todos los documentos con el mismo hash, excluyendo al solicitante
  const [cache] = await db
    .select({
      documentoId: documentosExpediente.id,
      metadata: documentosExpediente.metadata,
      tipoDocumento: documentosExpediente.tipoDocumento,
      estado: documentosExpediente.estado,
    })
    .from(documentosExpediente)
    .where(
      and(
        eq(documentosExpediente.hashSha256, hashSha256),
        // Excluir el documento actual
        ne(documentosExpediente.id, excluirDocumentoId),
      ),
    )
    .limit(1);

  if (!cache) return null;

  // Si el cache hit está en 'subido' o no fue procesado, no sirve como cache
  if ((!cache.tipoDocumento || cache.estado === 'subido') && !cache.metadata) return null;

  const meta = (cache.metadata ?? {}) as Record<string, unknown>;
  const texto = typeof meta.textoExtraido === 'string' ? meta.textoExtraido : null;

  // Solo servimos cache si tiene texto extraído
  if (!texto) return null;

  return {
    documentoId: cache.documentoId,
    textoExtraido: texto,
    tipoDocumento: cache.tipoDocumento,
    confianza: typeof meta.confianzaClasificacion === 'number' ? meta.confianzaClasificacion : null,
    estado: cache.estado,
  };
}

// ─── Orquestador principal ───────────────────────────────────────────────────

export async function procesarDocumento(
  documentoId: string,
): Promise<ResultadoProcesamiento> {
  // 1. Cargar documento
  const [doc] = await db
    .select()
    .from(documentosExpediente)
    .where(eq(documentosExpediente.id, documentoId));

  if (!doc) {
    return { documentoId, estadoFinal: 'error', cacheHit: false, error: 'Documento no encontrado' };
  }

  // 2. Si ya está en estado procesable, no reprocesar
  const estadosFinales = new Set([
    'texto_extraido', 'clasificado', 'ocr_pendiente', 'ilegible',
    'pendiente_abogado', 'aprobado', 'rechazado', 'duplicado',
  ]);
  if (estadosFinales.has(doc.estado)) {
    return {
      documentoId,
      estadoFinal: doc.estado,
      cacheHit: true,
      textoExtraido: typeof (doc.metadata as Record<string, unknown> | null)?.textoExtraido === 'string'
        ? (doc.metadata as Record<string, unknown>).textoExtraido as string
        : undefined,
    };
  }

  // 3. Buscar cache por hash (otro documento ya procesado con mismo hash)
  const cache = await buscarCachePorHash(doc.hashSha256, documentoId);
  if (cache && cache.textoExtraido) {
    // Reutilizar texto y clasificación del cache
    await db
      .update(documentosExpediente)
      .set({
        estado: 'texto_extraido',
        tipoDocumento: cache.tipoDocumento,
        procesadoEn: new Date(),
        metadata: {
          ...(doc.metadata as Record<string, unknown> ?? {}),
          textoExtraido: cache.textoExtraido,
          cacheHit: true,
          cacheFuenteDocumentoId: cache.documentoId,
          confianzaClasificacion: cache.confianza,
        },
      })
      .where(eq(documentosExpediente.id, documentoId));

    await registrarHistorial(documentoId, doc.expedienteId, 'procesado_cache', 'subido', 'texto_extraido',
      `Texto y clasificación reutilizados del documento ${cache.documentoId} (mismo hash)`);

    return {
      documentoId,
      estadoFinal: 'texto_extraido',
      textoExtraido: cache.textoExtraido,
      clasificacion: cache.tipoDocumento ? {
        tipoDocumento: cache.tipoDocumento,
        confianza: cache.confianza ?? 80,
        evidencias: ['cache por hash SHA-256'],
        motivo: 'Reutilizado de documento previo con mismo hash',
      } : undefined,
      cacheHit: true,
    };
  }

  // 4. Marcar como procesando
  await db
    .update(documentosExpediente)
    .set({ estado: 'clasificando' })
    .where(eq(documentosExpediente.id, documentoId));

  // 5. Extraer texto (solo PDFs)
  let textoExtraido = '';
  let metodo = 'no_aplica';

  if (doc.tipoMime === 'application/pdf') {
    try {
      const buffer = await descargarBlob(doc.blobUrl);
      const resultado = await extraerTextoDePdf(buffer);
      textoExtraido = resultado.texto;
      metodo = resultado.metodo;

      if (!textoExtraido || resultado.metodo === 'vacio') {
        // Sin capa de texto → OCR pendiente o ilegible
        const metadatosPrevios = (doc.metadata as Record<string, unknown> | null) ?? {};
        await db
          .update(documentosExpediente)
          .set({
            estado: 'ocr_pendiente',
            procesadoEn: new Date(),
            metadata: {
              ...metadatosPrevios,
              extraccionMetodo: 'vacio',
              paginasDetectadas: resultado.paginas,
            },
          })
          .where(eq(documentosExpediente.id, documentoId));

        await registrarHistorial(documentoId, doc.expedienteId, 'texto_no_extraido', 'clasificando', 'ocr_pendiente',
          'PDF sin capa de texto detectable; requiere OCR o reemplazo');

        return {
          documentoId,
          estadoFinal: 'ocr_pendiente',
          cacheHit: false,
        };
      }
    } catch (err) {
      const metadatosPrevios = (doc.metadata as Record<string, unknown> | null) ?? {};
      await db
        .update(documentosExpediente)
        .set({
          estado: 'ilegible',
          procesadoEn: new Date(),
          metadata: {
            ...metadatosPrevios,
            errorExtraccion: (err as Error).message,
          },
        })
        .where(eq(documentosExpediente.id, documentoId));

      await registrarHistorial(documentoId, doc.expedienteId, 'error_extraccion', 'clasificando', 'ilegible',
        `Error al extraer texto: ${(err as Error).message}`);

      return {
        documentoId,
        estadoFinal: 'ilegible',
        cacheHit: false,
        error: (err as Error).message,
      };
    }
  }

  // 6. Clasificar heurísticamente
  const clasificacion = clasificarDocumentoHeuristicamente(
    doc.nombreOriginal,
    doc.tipoMime,
    textoExtraido || undefined,
  );

  // 7. Determinar estado final según tipo MIME
  let estadoFinal: string;
  if (doc.tipoMime === 'application/pdf' && textoExtraido) {
    estadoFinal = 'texto_extraido';
  } else if (doc.tipoMime.startsWith('image/')) {
    // Imágenes: sin OCR aún → pendiente_abogado para revisión visual
    estadoFinal = 'clasificado';
  } else {
    // DOCX, TXT: clasificado, texto no extraíble sin librería adicional
    estadoFinal = 'clasificado';
  }

  // Si la confianza es muy baja, dejamos pendiente_abogado
  if (clasificacion.confianza < 30) {
    estadoFinal = 'pendiente_abogado';
  }

  // 8. Guardar resultado
  const metadatosPrevios = (doc.metadata as Record<string, unknown> | null) ?? {};
  const nuevoMetadata = {
    ...metadatosPrevios,
    textoExtraido: textoExtraido || undefined,
    confianzaClasificacion: clasificacion.confianza,
    evidenciasClasificacion: clasificacion.evidencias,
    clasificacionMotivo: clasificacion.motivo,
    extraccionMetodo: metodo,
    procesadoEn: new Date().toISOString(),
  };

  await db
    .update(documentosExpediente)
    .set({
      estado: estadoFinal as typeof documentosExpediente.$inferSelect.estado,
      tipoDocumento: clasificacion.tipoDocumento,
      procesadoEn: new Date(),
      metadata: nuevoMetadata,
    })
    .where(eq(documentosExpediente.id, documentoId));

  await registrarHistorial(documentoId, doc.expedienteId,
    estadoFinal === 'texto_extraido' ? 'texto_extraido' : 'clasificado',
    'clasificando', estadoFinal,
    `Clasificación heurística: ${clasificacion.tipoDocumento} (${clasificacion.confianza}%). ` +
    (textoExtraido ? `Texto extraído (${textoExtraido.length} chars).` : 'Sin texto extraído.'));

  // 9. Registrar extracción IA (esqueleto para Fase 7)
  if (textoExtraido) {
    try {
      await db.insert(extraccionesIa).values({
        documentoId,
        proveedor: 'heuristico',
        modelo: 'pdf-parse',
        exito: true,
        duracionMs: 0,
        resultadoJson: {
          metodo: 'capa_texto_pdf',
          longitud: textoExtraido.length,
          clasificacion: clasificacion.tipoDocumento,
          confianza: clasificacion.confianza,
        },
      });
    } catch {
      // No interrumpir el flujo si la tabla extracciones_ia no está disponible
    }
  }

  return {
    documentoId,
    estadoFinal,
    textoExtraido: textoExtraido || undefined,
    clasificacion,
    cacheHit: false,
  };
}

// ─── Runner de jobs ──────────────────────────────────────────────────────────

export async function procesarJobsPendientes(limite = 5): Promise<{
  procesados: number;
  fallidos: number;
  resultados: ResultadoProcesamiento[];
}> {
  // Buscar jobs pendientes de tipo extraccion_texto o clasificacion
  const jobs = await db
    .select()
    .from(jobsSgie)
    .where(
      and(
        eq(jobsSgie.estado, 'pendiente'),
        // Solo jobs de motor documental
        eq(jobsSgie.tipo, 'extraccion_texto' as never), // Narrowed by the and clause
      ),
    )
    .limit(limite);

  // Also get clasificacion jobs
  const jobsClasif = await db
    .select()
    .from(jobsSgie)
    .where(
      and(
        eq(jobsSgie.estado, 'pendiente'),
        eq(jobsSgie.tipo, 'clasificacion' as never),
      ),
    )
    .limit(limite);

  const todosJobs = [...jobs, ...jobsClasif].slice(0, limite);

  const resultados: ResultadoProcesamiento[] = [];
  let procesados = 0;
  let fallidos = 0;

  for (const job of todosJobs) {
    const documentoId = job.refId;
    if (!documentoId) {
      await fallarJob(job.id, 'Job sin refId (documentoId)');
      fallidos++;
      continue;
    }

    try {
      await reclamarJob(job.id);

      const resultado = await procesarDocumento(documentoId);

      if (resultado.error) {
        await fallarJob(job.id, resultado.error);
        fallidos++;
      } else {
        await completarJob(job.id);
        procesados++;
      }

      resultados.push(resultado);
    } catch (err) {
      await fallarJob(job.id, (err as Error).message);
      fallidos++;
      resultados.push({
        documentoId,
        estadoFinal: 'error',
        cacheHit: false,
        error: (err as Error).message,
      });
    }
  }

  return { procesados, fallidos, resultados };
}

// ─── Historial ───────────────────────────────────────────────────────────────

async function registrarHistorial(
  documentoId: string,
  expedienteId: string,
  accion: string,
  estadoAnterior: string,
  estadoNuevo: string,
  mensaje: string,
): Promise<void> {
  try {
    await db.insert(historialExpediente).values({
      expedienteId,
      accion: `documento_${accion}`,
      estadoAnterior,
      estadoNuevo,
      actorTipo: 'sistema',
      metadata: { documentoId },
      mensaje,
    });
  } catch {
    // No interrumpir el procesamiento si el historial falla
  }
}

// ─── API pública del motor ───────────────────────────────────────────────────

export { descargarBlob };
