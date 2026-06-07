# Catálogo de documentos por área legal

> **Para:** Desarrollador
> **Propósito:** Checklist de documentos predefinidos que el abogado puede solicitar al cliente según el área legal contratada
> **Depende de:** Twenty configurado (docs/20)

---

## 1. Estructura de datos

Crear `data/documentos-por-area.ts`:

```typescript
// data/documentos-por-area.ts

export interface DocTemplate {
  id: string;
  areaSlug: string;           // Slug del área (data/areas-juridicas.ts)
  subservicioSlug?: string;   // Opcional: específico de subservicio
  nombre: string;             // Nombre legible
  descripcion: string;        // Para qué sirve
  tipo: 'identificacion' | 'rtn' | 'escritura' | 'contrato' | 'certificado'
      | 'poder' | 'demanda' | 'recurso' | 'sentencia' | 'comprobante'
      | 'declaracion' | 'informe' | 'carta' | 'otro';
  obligatorio: boolean;       // ¿Indispensable para iniciar?
  requiereFirma: boolean;     // ¿Requiere firma del cliente?
  orden: number;              // Orden de solicitud
  fases: ('apertura' | 'tramite' | 'cierre')[];
}
```

---

## 2. Catálogo completo

### Derecho de Familia (slug: derecho-de-familia)

| Subservicio | Documento | Obligatorio | Fase |
|---|---|---|---|
| Divorcio mutuo acuerdo | Identidad de ambos cónyuges | Sí | Apertura |
| Divorcio mutuo acuerdo | Certificado de matrimonio original | Sí | Apertura |
| Divorcio mutuo acuerdo | RTN de ambos | Sí | Apertura |
| Divorcio mutuo acuerdo | Escritura de bienes (si aplica) | No | Trámite |
| Divorcio mutuo acuerdo | Certificado nacimiento de hijos | Sí | Apertura |
| Divorcio contensioso | Identidad del demandante | Sí | Apertura |
| Divorcio contensioso | Certificado de matrimonio | Sí | Apertura |
| Divorcio contensioso | Pruebas documentales (fotos, mensajes) | No | Trámite |
| Custodia compartida | Certificado nacimiento de hijos | Sí | Apertura |
| Custodia compartida | Informe psicológico (si aplica) | No | Trámite |
| Pensión alimenticia | Comprobantes de ingresos del obligado | Sí | Apertura |
| Pensión alimenticia | Certificado nacimiento del beneficiario | Sí | Apertura |
| Violencia doméstica | Denuncia ante MP | Sí | Apertura |
| Violencia doméstica | Informe médico forense | Sí | Apertura |

### Derecho Laboral (slug: derecho-laboral)

| Subservicio | Documento | Obligatorio | Fase |
|---|---|---|---|
| Despido injustificado | Contrato de trabajo | Sí | Apertura |
| Despido injustificado | Últimos 6 recibos de pago | Sí | Apertura |
| Despido injustificado | Carta de despido (si existe) | Sí | Apertura |
| Despido injustificado | RTN del trabajador | Sí | Apertura |
| Reclamo prestaciones | Contrato de trabajo | Sí | Apertura |
| Accidente laboral | Informe médico del accidente | Sí | Apertura |
| Accidente laboral | Acta del IHSS | Sí | Apertura |
| Acoso laboral | Pruebas documentales (correos, mensajes) | Sí | Trámite |

### Derecho Penal (slug: derecho-penal)

| Subservicio | Documento | Obligatorio | Fase |
|---|---|---|---|
| Defensa proceso penal | Identidad del imputado | Sí | Apertura |
| Defensa proceso penal | Citación o requerimiento fiscal | Sí | Apertura |
| Defensa proceso penal | Auto de prisión (si aplica) | Sí | Apertura |
| Defensa proceso penal | Pruebas de descargo | No | Trámite |
| Querella | Identidad del querellante | Sí | Apertura |
| Querella | Pruebas del delito | Sí | Apertura |
| Representación víctima | Identidad de la víctima | Sí | Apertura |
| Representación víctima | Denuncia ante MP | Sí | Apertura |
| Representación víctima | Informe médico forense | Sí | Apertura |
| Recursos apelación | Sentencia de primera instancia | Sí | Apertura |
| Medidas sustitutivas | Identidad del imputado | Sí | Apertura |
| Medidas sustitutivas | Pruebas de arraigo (trabajo, domicilio) | Sí | Trámite |
| Ejecución condena | Sentencia ejecutoriada | Sí | Apertura |
| Beneficios penitenciarios | Certificado conducta centro penal | Sí | Trámite |

### Derecho Civil y Notarial (slug: derecho-civil-y-notarial)

| Subservicio | Documento | Obligatorio | Fase |
|---|---|---|---|
| Compraventa inmuebles | Escritura anterior del inmueble | Sí | Apertura |
| Compraventa inmuebles | Certificado libertad de gravamen | Sí | Apertura |
| Compraventa inmuebles | RTN vendedor y comprador | Sí | Apertura |
| Testamentos | Identidad del testador | Sí | Apertura |
| Testamentos | Escritura de bienes del testador | Sí | Apertura |
| Juicio ejecutivo | Título ejecutivo (pagaré, letra cambio) | Sí | Apertura |
| Prescripción adquisitiva | Certificado de posesión del inmueble | Sí | Apertura |
| Prescripción adquisitiva | Testimonios de vecinos (declaraciones juradas) | No | Trámite |

---

## 3. Funciones helper

```typescript
// data/documentos-por-area.ts (cont.)

export function getDocumentosPorArea(areaSlug: string): DocTemplate[] {
  return DOCUMENTOS.filter(d => d.areaSlug === areaSlug);
}

export function getDocumentosSugeridos(
  areaSlug: string,
  subservicios: string[]
): DocTemplate[] {
  return DOCUMENTOS.filter(d =>
    d.areaSlug === areaSlug &&
    (!d.subservicioSlug || subservicios.includes(d.subservicioSlug))
  ).sort((a, b) => a.orden - b.orden);
}

export function getDocumentosObligatorios(areaSlug: string): DocTemplate[] {
  return DOCUMENTOS.filter(d =>
    d.areaSlug === areaSlug && d.obligatorio
  );
}
```

---

## 4. API endpoint para el abogado

```typescript
// app/api/twenty/documentos/route.ts
// Devuelve los documentos sugeridos para un área legal

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const area = searchParams.get('area');
  const subservicios = searchParams.get('subservicios')?.split(',');

  if (!area) {
    return Response.json({ error: 'Se requiere ?area=' }, { status: 400 });
  }

  const docs = getDocumentosSugeridos(area, subservicios || []);

  // Incluir la opcion "Otro" siempre disponible
  docs.push({
    id: 'otro',
    areaSlug: area,
    nombre: 'Otro documento',
    descripcion: 'Especifica el documento que necesitas',
    tipo: 'otro',
    obligatorio: false,
    requiereFirma: false,
    orden: 999,
    fases: ['apertura', 'tramite', 'cierre'],
  });

  return Response.json({ documentos: docs });
}
```

---

## 5. Flujo de solicitud de documentos

```
1. Abogado crea caso y selecciona área legal
2. Sistema sugiere docs según docs/24
3. Abogado:
   a) Acepta la lista sugerida (con un clic)
   b) Agrega documentos adicionales manuales (opción "Otro")
   c) Marca "no aplica" para docs opcionales
4. Sistema crea un DocRequest por cada documento
5. Cliente recibe WhatsApp: "Necesitamos que suba: [lista de docs]"
6. Cliente sube archivos por el portal
7. Abogado revisa y aprueba/rechaza cada documento
```

---

## Progreso

- [ ] 1. Crear data/documentos-por-area.ts con DocTemplate
- [ ] 2. Agregar todos los documentos de Derecho de Familia
- [ ] 3. Agregar todos los documentos de Derecho Laboral
- [ ] 4. Agregar todos los documentos de Derecho Penal
- [ ] 5. Agregar todos los documentos de Derecho Civil/Notarial
- [ ] 6. Agregar opción "Otro" universal
- [ ] 7. Crear funciones getDocumentosPorArea, getDocumentosSugeridos, getDocumentosObligatorios
- [ ] 8. Crear API endpoint GET /api/twenty/documentos?area=
- [ ] 9. Integrar con flujo de creación de caso

