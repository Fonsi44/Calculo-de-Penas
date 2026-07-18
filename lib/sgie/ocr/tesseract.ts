import { OcrProvider, OcrResult, OcrPageResult } from './provider';

const LANGUAGE = process.env.TESSERACT_LANGUAGE ?? 'spa';

function isImageMime(mimeType: string): boolean {
  return ['image/jpeg', 'image/png', 'image/webp', 'image/tiff', 'image/bmp'].includes(mimeType);
}

function isPdfMime(mimeType: string): boolean {
  return mimeType === 'application/pdf';
}

class TesseractOcrProvider implements OcrProvider {
  name = 'tesseract';

  isConfigured(): boolean {
    return true;
  }

  async processDocument(input: {
    buffer: ArrayBuffer;
    mimeType: string;
    pageCount?: number;
  }): Promise<OcrResult> {
    const pages: OcrPageResult[] = [];

    try {
      if (isImageMime(input.mimeType)) {
        const page = await this.ocrBuffer(input.buffer, 1);
        pages.push(page);
      } else if (isPdfMime(input.mimeType)) {
        const pageResults = await this.ocrPdfPages(input.buffer, input.pageCount);
        pages.push(...pageResults);
      } else {
        return {
          success: false,
          pages: [],
          method: 'ocr',
          error: `Tipo MIME no soportado para OCR: ${input.mimeType}`,
        };
      }

      if (pages.length === 0) {
        return {
          success: false,
          pages: [],
          method: 'ocr',
          error: 'No se generaron páginas de OCR',
        };
      }

      return { success: true, pages, method: 'ocr' };
    } catch (err) {
      return {
        success: false,
        pages: [],
        method: 'ocr',
        error: (err as Error).message || 'Error desconocido en OCR Tesseract',
      };
    }
  }

  private async ocrBuffer(
    buffer: ArrayBuffer,
    pageNumber: number,
  ): Promise<OcrPageResult> {
    const { createWorker } = await import('tesseract.js');
    const worker = await createWorker(LANGUAGE, 1);
    try {
      const buf = Buffer.from(buffer);
      const { data } = await worker.recognize(buf);
      return {
        pageNumber,
        text: data.text ?? '',
        confidence: data.confidence ?? null,
      };
    } finally {
      await worker.terminate();
    }
  }

  private async ocrPdfPages(
    buffer: ArrayBuffer,
    pageCount?: number,
  ): Promise<OcrPageResult[]> {
    const results: OcrPageResult[] = [];

    const pdfjsLib = await import('pdfjs-dist/legacy/build/pdf.mjs');
    const data = new Uint8Array(buffer);
    const doc = await pdfjsLib.getDocument({ data, disableAutoFetch: true, disableStream: true }).promise;
    const totalPages = pageCount ?? doc.numPages;

    for (let i = 1; i <= totalPages; i++) {
      try {
        const page = await doc.getPage(i);
        const viewport = page.getViewport({ scale: 2.0 });

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const imageBuffer = await renderPdfPageToBuffer(page as any, viewport as any);
        if (!imageBuffer) {
          results.push({ pageNumber: i, text: '', confidence: null });
          continue;
        }

        const { createWorker } = await import('tesseract.js');
        const worker = await createWorker(LANGUAGE, 1);
        try {
          const { data: ocrData } = await worker.recognize(imageBuffer);
          results.push({
            pageNumber: i,
            text: ocrData.text ?? '',
            confidence: ocrData.confidence ?? null,
          });
        } finally {
          await worker.terminate();
        }
      } catch {
        results.push({ pageNumber: i, text: '', confidence: null });
      }
    }

    return results;
  }
}

async function renderPdfPageToBuffer(
  page: { render: (params: { canvasContext: CanvasRenderingContext2D; viewport: { width: number; height: number } }) => { promise: Promise<void> } },
  viewport: { width: number; height: number },
): Promise<Buffer | null> {
  if (typeof OffscreenCanvas === 'undefined') return null;

  try {
    const canvas = new OffscreenCanvas(viewport.width, viewport.height);
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;
    await page.render({ canvasContext: ctx as unknown as CanvasRenderingContext2D, viewport }).promise;
    const imageData = ctx.getImageData(0, 0, viewport.width, viewport.height);
    return Buffer.from(imageData.data);
  } catch {
    return null;
  }
}

export { TesseractOcrProvider };
