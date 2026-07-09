/**
 * SGIE — Abstracción de OCR (Fase 3).
 *
 * Interfaz común para proveedores de OCR externos. El pipeline documental la
 * usa cuando un documento (PDF escaneado o imagen) no tiene capa de texto
 * extraíble con pdfjs-dist.
 *
 * PROVEEDOR POR DEFECTO: 'stub'. Si no hay OCR real configurado, el stub
 * devuelve `{ success: false }` y el documento queda en `ocr_pendiente` con
 * auditoría — NUNCA se inventa texto.
 *
 * PROVEEDOR REAL FUTURO: configurable por `OCR_PROVIDER` (ej. 'google',
 * 'aws', 'azure'). No se instala ninguna dependencia pesada en esta fase;
 * cuando se valide un proveedor, se añade su implementación aquí siguiendo la
 * misma interfaz y se activa por entorno.
 *
 * Variables de entorno (ninguna obligatoria para el MVP):
 *   OCR_PROVIDER          Proveedor activo (default: 'stub').
 *   OCR_*                 Credenciales del proveedor real cuando aplique.
 *
 * Referencia: docs/implementation/mvp-fase-3-extraccion-ocr-revision-asistente.md
 */

export interface OcrPageInput {
  pageNumber: number;
  /** Imagen/raster de la página (cuando el proveedor la necesite). */
  image?: Uint8Array;
}

export interface OcrPageResult {
  pageNumber: number;
  text: string;
  confidence: number | null; // 0–100 cuando el proveedor lo informe
}

export interface OcrResult {
  success: boolean;
  pages: OcrPageResult[];
  method: 'ocr';
  error?: string;
}

export interface OcrProvider {
  /** Identificador del proveedor ('stub', 'google', 'aws', ...). */
  name: string;
  /** ¿Hay credenciales/configuración suficientes para operar? */
  isConfigured(): boolean;
  /** Procesa el documento y devuelve texto por página. */
  processDocument(input: {
    buffer: ArrayBuffer;
    mimeType: string;
    pageCount?: number;
  }): Promise<OcrResult>;
}

/**
 * Provider stub: sin OCR real. Devuelve success:false para que el documento
 * quede en `ocr_pendiente` con auditoría. Es el provider por defecto.
 */
class StubOcrProvider implements OcrProvider {
  name = 'stub';
  isConfigured(): boolean {
    return false;
  }
  async processDocument(): Promise<OcrResult> {
    return {
      success: false,
      pages: [],
      method: 'ocr',
      error: 'OCR no configurado (provider stub). Configure OCR_PROVIDER y credenciales para procesar escaneos.',
    };
  }
}

/**
 * Devuelve el provider OCR activo según `OCR_PROVIDER`. Por defecto, stub.
 *
 * Para añadir un proveedor real: implementar la interfaz OcrProvider, leer sus
 * credenciales del entorno aquí, y devolverlo cuando `OCR_PROVIDER` coincida.
 */
export function getOcrProvider(): OcrProvider {
  const provider = (process.env.OCR_PROVIDER ?? 'stub').trim().toLowerCase();
  if (provider === 'stub' || provider.length === 0) {
    return new StubOcrProvider();
  }
  // Futuro: 'google' | 'aws' | 'azure' → instanciar su implementación.
  // Mientras tanto, caer a stub para no romper el build.
  return new StubOcrProvider();
}
