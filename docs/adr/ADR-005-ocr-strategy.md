# ADR-005: OCR strategy

**Fecha:** 2026-07-18. **Estado:** IMPLEMENTADO.

## Contexto

El pipeline documental del SGIE necesita extraer texto de documentos escaneados (PDF sin capa de texto, imágenes JPEG/PNG) para poder clasificarlos y procesarlos con IA. La extracción debe funcionar en el servidor Node.js de Next.js, sin depender de servicios externos que puedan aumentar costos o comprometer la privacidad de datos legales.

## Decisión

**Implementar una interfaz abstracta de proveedor OCR con Tesseract.js como implementación local por defecto.** El proveedor por defecto es un stub que no procesa nada y marca el documento como `ocr_pendiente`.

## Detalles de implementación

### Interfaz (`lib/sgie/ocr/provider.ts`)

```typescript
interface OcrProvider {
  name: string;
  isConfigured(): boolean;
  processDocument(input: { buffer: ArrayBuffer; mimeType: string; pageCount?: number }): Promise<OcrResult>;
}
```

### Proveedores

| Provider | `OCR_PROVIDER` | Requisitos | Comportamiento |
|----------|---------------|------------|----------------|
| Stub (default) | `stub` | Ninguno | Retorna `success: false`. Documento queda en `ocr_pendiente`. |
| Tesseract.js | `tesseract` | Dependencia npm | OCR local con modelo `spa` por defecto. |

### Implementación Tesseract.js (`lib/sgie/ocr/tesseract.ts`)

- **Imágenes**: soporta JPEG, PNG, WebP, TIFF, BMP. Usa `tesseract.js` directamente.
- **PDFs**: rasteriza cada página con `pdfjs-dist` + `OffscreenCanvas` a escala 2.0, luego procesa cada imagen con Tesseract.
- **Idioma**: configurable vía `TESSERACT_LANGUAGE` (default `spa`).
- **Confianza**: reporta 0–100 por página.
- **Fallos**: si una página falla, se registra como texto vacío sin abortar el documento completo.
- **Degradación**: si `OffscreenCanvas` no está disponible (entornos Node.js sin Chromium), retorna `null` para esa página.

### Por qué Tesseract.js y no cloud OCR

| Factor | Tesseract.js | Google Cloud Vision | AWS Textract |
|--------|-------------|---------------------|--------------|
| Costo | Gratuito | Por página (~$1.50/1000 páginas) | Por página (~$1.50/1000 páginas) |
| Privacidad | 100% local | Datos en servidores Google | Datos en servidores AWS |
| Datos legales | No salen del servidor | Sujetos a términos del proveedor | Sujetos a términos del proveedor |
| Precisión | Buena (modelo LSTM) | Excelente | Excelente |
| Latencia | Local (ms) | Red (segundos) | Red (segundos) |
| Setup | `npm install` | API key + credenciales | API key + credenciales |

La información contenida en documentos legales hondureños (identificaciones, RTN, escrituras, demandas) es confidencial del cliente. El principio es que **los datos del cliente no deben salir del servidor a menos que sea estrictamente necesario y con consentimiento explícito**. Tesseract.js permite OCR completamente local.

### Graceful degradation

El stub es el proveedor por defecto `OCR_PROVIDER`. Sin configuración:

1. `getOcrProvider()` retorna `StubOcrProvider`.
2. `processDocument()` retorna `{ success: false, error: 'OCR no configurado...' }`.
3. El documento queda en estado `ocr_pendiente` con auditoría.
4. **Nunca se inventa texto**. No hay fallback a extracción falsa.

Si `OCR_PROVIDER=tesseract` pero Tesseract falla (binario no disponible, modelo no descargado):
1. `processDocument()` retorna `{ success: false, error: mensaje de error }`.
2. El documento queda en `ocr_pendiente`.

Si una página específica falla:
1. Se registra con texto vacío.
2. El resto del documento se procesa normalmente.

### Almacenamiento

Los resultados OCR se guardan en `ocr_resultados`:
- `documento_id` → FK al documento
- `texto_extraido` → texto completo extraído
- `metodo` → 'tesseract' (o futuro proveedor)
- `confianza` → promedio 0–100
- `paginas` → número de páginas procesadas
- `duracion_ms` → tiempo de procesamiento

Por página, `document_text_pages` almacena `ocr_provider`, `ocr_confidence`, `rotation` e `illegible`.

## Consecuencias

- **Positivas**: OCR gratuito, 100% local, sin datos del cliente saliendo del servidor, interfaz extensible para futuros proveedores.
- **Negativas**: Tesseract.js es más lento que cloud OCR para documentos grandes. PDFs con muchas páginas pueden tomar minutos. `OffscreenCanvas` no está disponible en Node.js estándar (requiere headless Chromium o entorno con Web API).
- **Riesgo**: Tesseract.js puede tener precisión inferior a servicios cloud para documentos de baja calidad. Mitigado con el campo `confianza` que permite a la IA detectar y solicitar revisión humana.

## Referencias

- Interfaz: `lib/sgie/ocr/provider.ts`
- Implementación Tesseract: `lib/sgie/ocr/tesseract.ts`
- Esquema OCR: `drizzle/migrations/0035_fase2_documents_ocr_ai.sql`
