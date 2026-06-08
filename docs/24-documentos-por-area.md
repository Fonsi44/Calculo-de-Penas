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

> **Convenciones**: Obligatorio = indispensable para iniciar el caso. Fases: A = Apertura, T = Trámite, C = Cierre.
> Los documentos de identidad (DNI/pasaporte) y RTN se asumen requeridos para TODO caso y no se repiten por subservicio; se listan al inicio de cada área.

---

### 2.1 Derecho de Familia (slug: `derecho-de-familia`)

| Subservicio | Documento | Oblig. | Fase |
|---|---|---|---|
| General (todos) | Identidad del solicitante (DNI o pasaporte) | Sí | A |
| General (todos) | RTN del solicitante | Sí | A |
| Divorcio por mutuo acuerdo | Certificado de matrimonio original | Sí | A |
| Divorcio por mutuo acuerdo | Identidad de ambos cónyuges | Sí | A |
| Divorcio por mutuo acuerdo | Certificado de nacimiento de hijos | Sí | A |
| Divorcio por mutuo acuerdo | Escritura de bienes (si hay sociedad conyugal) | No | T |
| Divorcio contencioso | Certificado de matrimonio | Sí | A |
| Divorcio contencioso | Pruebas documentales de la causal invocada | Sí | T |
| Custodia compartida / exclusiva | Certificado de nacimiento de hijos | Sí | A |
| Custodia compartida / exclusiva | Informe psicológico (si aplica) | No | T |
| Régimen de visitas | Certificado de nacimiento de hijos | Sí | A |
| Pensión de alimentos | Comprobantes de ingresos del obligado | Sí | A |
| Pensión de alimentos | Certificado de nacimiento del beneficiario | Sí | A |
| Reconocimiento de unión de hecho | Pruebas de convivencia (testigos, facturas, fotos) | Sí | T |
| Adopción nacional | Certificado de idoneidad de SENAF/IHNFA | Sí | A |
| Restitución internacional de menores | Resolución del país requirente (Convenio La Haya) | Sí | A |
| Sucesiones intestadas/testamentarias | Certificado de defunción del causante | Sí | A |
| Sucesiones intestadas/testamentarias | Partida de nacimiento de herederos | Sí | A |
| Sucesiones intestadas/testamentarias | Escritura de bienes del causante | Sí | T |
| Testamentos | Identidad y RTN del testador | Sí | A |
| Testamentos | Relación detallada de bienes | Sí | A |
| Violencia intrafamiliar | Denuncia ante MP o Juzgado de Paz | Sí | A |
| Violencia intrafamiliar | Informe médico forense o psicológico | Sí | T |

### 2.2 Derecho Laboral (slug: `derecho-laboral`)

| Subservicio | Documento | Oblig. | Fase |
|---|---|---|---|
| General (todos) | Identidad del trabajador (DNI) | Sí | A |
| General (todos) | RTN del trabajador | Sí | A |
| Despido injustificado | Contrato de trabajo | Sí | A |
| Despido injustificado | Últimos 6 recibos de pago / constancia salarial | Sí | A |
| Despido injustificado | Carta de despido (si existe) | Sí | A |
| Despido indirecto | Pruebas del incumplimiento patronal | Sí | T |
| Aguinaldo / décimo tercer mes | Constancia de salario y tiempo laborado | Sí | A |
| Horas extras / recargos | Registro de horas trabajadas | Sí | T |
| Riesgos profesionales | Informe médico del accidente/enfermedad | Sí | A |
| Riesgos profesionales | Acta del IHSS o constancia de atención | Sí | A |
| Contrato individual de trabajo | Datos completos de empleador y trabajador | Sí | A |
| Reinstalación (fuero) | Documento que acredita el fuero (sindical, maternidad) | Sí | A |
| Acoso laboral / mobbing | Pruebas documentales (correos, mensajes, testigos) | Sí | T |
| Conciliación prejudicial | Citación del Inspector del Trabajo | Sí | A |
| Juicio oral laboral | Expediente administrativo previo | Sí | A |
| Casación laboral | Sentencia de segunda instancia | Sí | A |

### 2.3 Derecho Civil y Notarial (slug: `derecho-civil-y-notarial`)

| Subservicio | Documento | Oblig. | Fase |
|---|---|---|---|
| General (todos) | Identidad del solicitante (DNI o pasaporte) | Sí | A |
| General (todos) | RTN del solicitante | Sí | A |
| Compraventa de inmuebles | Escritura anterior del inmueble | Sí | A |
| Compraventa de inmuebles | Certificado de libertad de gravamen | Sí | A |
| Compraventa de inmuebles | RTN de vendedor y comprador | Sí | A |
| Compraventa de inmuebles | Solvencia municipal del inmueble | Sí | T |
| Arrendamiento | Contrato de arrendamiento vigente | Sí | A |
| Donación entre vivos | Escritura del bien a donar | Sí | A |
| Hipoteca | Escritura del inmueble y avalúo | Sí | A |
| Mandato / poder notarial | Identidad de poderdante y apoderado | Sí | A |
| Constitución de sociedad civil | Reserva de denominación y RTN | Sí | A |
| Fideicomiso | Escritura de los bienes fideicomitidos | Sí | A |
| Prescripción adquisitiva / usucapión | Certificación de posesión del inmueble | Sí | A |
| Prescripción adquisitiva / usucapión | Declaraciones juradas de testigos | No | T |
| Reivindicación de inmuebles | Título de propiedad | Sí | A |
| Cobro judicial de deudas | Título ejecutivo (pagaré, letra de cambio, contrato) | Sí | A |
| Daños y perjuicios | Pruebas del daño y su cuantificación | Sí | T |
| Responsabilidad civil (accidente tránsito) | Parte policial del accidente | Sí | A |
| Responsabilidad civil (accidente tránsito) | Informe de daños y presupuesto de reparación | Sí | T |
| Protocolización de documentos | Documento original a protocolizar | Sí | A |

### 2.4 Derecho Mercantil y Empresarial (slug: `derecho-mercantil-empresarial`)

| Subservicio | Documento | Oblig. | Fase |
|---|---|---|---|
| General (todos) | RTN de la empresa o comerciante individual | Sí | A |
| General (todos) | Identidad del representante legal | Sí | A |
| Constitución de sociedades | Reserva de denominación social | Sí | A |
| Constitución de sociedades | Identidad y RTN de socios fundadores | Sí | A |
| Constitución de sociedades | Comprobante de capital social | Sí | A |
| Reformas estatutarias | Escritura de constitución vigente | Sí | A |
| Reformas estatutarias | Acta de junta que aprueba la reforma | Sí | A |
| Disolución y liquidación | Balance final de liquidación | Sí | C |
| Contratos mercantiles | Borrador del contrato o términos negociados | Sí | A |
| Gobierno corporativo | Estatutos sociales vigentes | Sí | A |
| Compliance corporativo | Manual de políticas y procedimientos (si existe) | No | T |
| Protección al consumidor | Denuncia o requerimiento del SBDC | Sí | A |
| Competencia desleal | Pruebas del acto desleal | Sí | T |
| Propiedad industrial | Muestra o representación de la marca / diseño | Sí | A |
| Derechos de autor / software | Obra o código fuente (muestra) | Sí | A |
| Contratos internacionales | Términos pactados y legislación aplicable | Sí | A |
| Cobro de facturas / cheques protestados | Factura impaga o cheque protestado | Sí | A |
| Litigio mercantil | Documentación completa del conflicto | Sí | A |

### 2.5 Derecho Bancario y Financiero (slug: `derecho-bancario-y-financiero`)

| Subservicio | Documento | Oblig. | Fase |
|---|---|---|---|
| General (todos) | Identidad del cliente (DNI) | Sí | A |
| General (todos) | RTN | Sí | A |
| Revisión de contratos crediticios | Contrato de préstamo / tarjeta de crédito | Sí | A |
| Revisión de contratos crediticios | Estado de cuenta actualizado | Sí | A |
| Reestructuración de deudas | Comprobantes de ingresos | Sí | A |
| Reestructuración de deudas | Relación de deudas y acreedores | Sí | A |
| Ejecución de garantías | Contrato de garantía (prenda, hipoteca, fiduciaria) | Sí | A |
| Defensa del usuario financiero | Respuesta del banco o constancia de reclamo | Sí | A |
| Cobro judicial bancario | Título ejecutivo (pagaré, contrato) | Sí | A |
| Garantías mobiliarias | Contrato de garantía y registro | Sí | A |
| Fideicomiso de garantía | Escritura del fideicomiso | Sí | A |
| Cumplimiento normativo CNBS | Requerimiento o resolución de la CNBS | Sí | A |
| Sanciones CNBS | Notificación de la sanción | Sí | A |
| Lavado de activos (defensa) | Requerimiento o denuncia de la UAF | Sí | A |

### 2.6 Derecho Administrativo y Servicio Civil (slug: `derecho-administrativo-y-servicio-civil`)

| Subservicio | Documento | Oblig. | Fase |
|---|---|---|---|
| General (todos) | Identidad del solicitante | Sí | A |
| Recurso de reposición / apelación | Acto administrativo impugnado | Sí | A |
| Recurso de reposición / apelación | Notificación del acto | Sí | A |
| Demanda contencioso-administrativa | Resolución que agota la vía administrativa | Sí | A |
| Sanciones regulatorias | Notificación de la sanción | Sí | A |
| Despido de servidores públicos | Acuerdo o resolución de despido | Sí | A |
| Procedimiento disciplinario | Pliego de cargos o resolución sancionadora | Sí | A |
| Concurso público | Convocatoria y resultados impugnados | Sí | A |
| Contratos del Estado | Contrato y pliego de condiciones | Sí | A |
| Responsabilidad patrimonial del Estado | Pruebas del daño y nexo causal con la Administración | Sí | T |
| Acceso a la información pública | Solicitud de información y respuesta/silencio | Sí | A |
| Habeas data / habeas corpus | Documento que acredita la violación del derecho | Sí | A |
| Acción de inconstitucionalidad | Ley o acto impugnado | Sí | A |
| Juicio de cuentas | Informe de auditoría o resolución del TSC | Sí | A |

### 2.7 Derecho Aduanero y Comercio Exterior (slug: `derecho-aduanero-y-comercio-exterior`)

| Subservicio | Documento | Oblig. | Fase |
|---|---|---|---|
| General (todos) | RTN del importador/exportador | Sí | A |
| General (todos) | Identidad del representante legal | Sí | A |
| Clasificación arancelaria | Ficha técnica del producto | Sí | A |
| Valoración aduanera | Factura comercial y documentos de transporte | Sí | A |
| Importación temporal | Contrato que justifica la temporalidad | Sí | A |
| Exportación definitiva | Factura de exportación y packing list | Sí | A |
| Tránsito aduanero | DUA-T y documentos de transporte | Sí | A |
| Zona libre (ZOLI, ZIP) | Contrato de arrendamiento o título de propiedad en zona | Sí | A |
| Devolución de impuestos | Declaraciones de exportación y comprobantes fiscales | Sí | T |
| Sanciones (contrabando/defraudación) | Acta de intervención o requerimiento aduanero | Sí | A |
| Recurso de reconsideración | Resolución sancionadora | Sí | A |
| Trámites VUCE | Lista de permisos previos requeridos | Sí | A |

### 2.8 Regulación Sanitaria y Salud (slug: `regulacion-sanitaria`)

| Subservicio | Documento | Oblig. | Fase |
|---|---|---|---|
| General (todos) | RTN del solicitante (empresa o persona) | Sí | A |
| Registro sanitario (medicamentos) | Formulario ARSA y certificado BPM | Sí | A |
| Registro de alimentos/bebidas | Formulario de notificación según categoría de riesgo | Sí | A |
| Cosméticos e higiene | Fórmula cualitativa y etiquetado | Sí | A |
| Dispositivos médicos | Clasificación y documentación técnica | Sí | A |
| BPM / BPAD | Manual de procedimientos y layout de planta | Sí | A |
| Establecimientos farmacéuticos | Plano y licencia municipal | Sí | A |
| Sanciones de ARSA | Notificación de la sanción | Sí | A |
| Responsabilidad médica | Historia clínica completa | Sí | A |
| Consentimiento informado | Protocolo de consentimiento del procedimiento | Sí | A |

### 2.9 Extranjería en Honduras (slug: `extranjeria-en-honduras`)

| Subservicio | Documento | Oblig. | Fase |
|---|---|---|---|
| General (todos) | Pasaporte vigente del solicitante | Sí | A |
| General (todos) | Fotografía tamaño pasaporte reciente | Sí | A |
| Visa de turista / prórroga | Boleto de salida o itinerario | Sí | A |
| Visa de trabajo | Oferta de empleo o contrato de trabajo | Sí | A |
| Residencia temporal | Antecedentes penales apostillados del país de origen | Sí | A |
| Residencia temporal | Certificado médico emitido en Honduras | Sí | A |
| Residencia permanente | Tarjeta de residencia temporal vigente | Sí | A |
| Visa de inversionista | Escritura de la empresa o certificación de inversión | Sí | A |
| Visa de rentista / pensionado | Certificación de ingresos o pensión del exterior | Sí | A |
| Naturalización | Constancia de años de residencia (INM) | Sí | A |
| Permiso de salida de menores | Autorización notarial del padre ausente | Sí | A |
| Apostilla y traducción | Documentos originales del país de origen | Sí | A |
| Defensa en deportación | Orden de deportación o acta de retención | Sí | A |

### 2.10 Propiedad Intelectual (slug: `propiedad-intelectual`)

| Subservicio | Documento | Oblig. | Fase |
|---|---|---|---|
| General (todos) | RTN del solicitante | Sí | A |
| Registro de marcas | Representación gráfica de la marca | Sí | A |
| Registro de marcas | Lista de productos/servicios (Clasificación de Niza) | Sí | A |
| Patentes de invención | Memoria descriptiva y reivindicaciones | Sí | A |
| Modelos de utilidad | Descripción y dibujos del modelo | Sí | A |
| Diseños industriales | Representación gráfica del diseño | Sí | A |
| Derechos de autor | Obra (texto, código, imagen, audio, video) | Sí | A |
| Contratos de cesión / licencia | Términos pactados entre partes | Sí | A |
| Transferencia de tecnología | Contrato marco y descripción de la tecnología | Sí | A |
| Oposición al registro | Pruebas de uso previo o confusión | Sí | T |
| Defensa frente a infracciones | Pruebas de la infracción | Sí | T |
| Nombres de dominio | Certificado de registro de dominio | Sí | A |
| Auditoría de cartera IP | Listado de activos intangibles de la empresa | Sí | A |

### 2.11 Derecho Tributario y Fiscal (slug: `tributario-fiscal`)

| Subservicio | Documento | Oblig. | Fase |
|---|---|---|---|
| General (todos) | RTN del contribuyente | Sí | A |
| General (todos) | Identidad del representante legal (si es persona jurídica) | Sí | A |
| ISR / ISV / Aportación solidaria | Declaraciones de los períodos en cuestión | Sí | A |
| ISR / ISV | Libros contables y facturación | Sí | T |
| Planificación tributaria | Escritura de constitución y estructura societaria | Sí | A |
| Precios de transferencia | Contratos con partes vinculadas | Sí | A |
| Defensa en fiscalización | Requerimiento de fiscalización del SAR | Sí | A |
| Defensa en fiscalización | Documentación contable del período fiscalizado | Sí | T |
| Recurso de reconsideración / apelación | Resolución determinativa o sancionatoria del SAR | Sí | A |
| Contencioso tributario | Resolución que agota la vía administrativa | Sí | A |
| Devolución de pagos indebidos | Comprobantes de pago y declaraciones | Sí | A |
| Beneficios fiscales (zonas libres) | Resolución de calificación de zona libre | Sí | A |

### 2.12 Derecho Ambiental y Regulatorio (slug: `ambiental-regulatorio`)

| Subservicio | Documento | Oblig. | Fase |
|---|---|---|---|
| General (todos) | RTN del solicitante | Sí | A |
| Licencia ambiental | Formulario de categorización del proyecto | Sí | A |
| Evaluación de impacto ambiental | Estudio de impacto ambiental (EsIA) | Sí | A |
| Diagnóstico ambiental | Informe de cumplimiento de medidas | Sí | T |
| Permisos de vertimiento / emisiones | Caracterización de vertidos o emisiones | Sí | A |
| Manejo de residuos | Plan de manejo de residuos | Sí | A |
| Bosques y áreas protegidas | Plan de manejo forestal o plan de aprovechamiento | Sí | A |
| Sanciones ambientales | Resolución sancionatoria de MiAmbiente | Sí | A |
| Acción popular ambiental | Pruebas del daño ambiental | Sí | T |
| Responsabilidad por daño ambiental | Informe técnico de daños | Sí | T |
| Auditoría ambiental voluntaria | Informe de auditoría ambiental | Sí | A |

### 2.13 Conciliación y Arbitraje (slug: `conciliacion-y-arbitraje`)

| Subservicio | Documento | Oblig. | Fase |
|---|---|---|---|
| General (todos) | Identidad y RTN del solicitante | Sí | A |
| Cláusula compromisoria | Borrador del contrato donde se insertará la cláusula | Sí | A |
| Convención arbitral | Descripción de la controversia existente | Sí | A |
| Arbitraje institucional | Contrato que contiene la cláusula arbitral | Sí | A |
| Arbitraje ad hoc | Propuesta de reglas de procedimiento | Sí | A |
| Arbitraje internacional | Contrato internacional y cláusula arbitral | Sí | A |
| Conciliación prejudicial | Convocatoria del Centro de Mediación | Sí | A |
| Mediación privada | Acuerdo de mediación firmado por las partes | Sí | A |
| Homologación de laudos extranjeros | Laudo arbitral apostillado | Sí | A |
| Ejecución del laudo | Laudo arbitral ejecutoriado | Sí | A |
| Recurso de nulidad del laudo | Laudo impugnado | Sí | A |
| Mediación penal | Denuncia o querella (si la hay) | Sí | A |

---

### 2.14 Derecho Penal — Atención de casos penales litigiosos (slug: `atencion-casos-penales-litigiosos`)

| Subservicio | Documento | Oblig. | Fase |
|---|---|---|---|
| General (todos) | Identidad del imputado (DNI o pasaporte) | Sí | A |
| General (todos) | Citación, requerimiento fiscal o auto de prisión | Sí | A |
| Delitos contra la vida (homicidio, asesinato, femicidio) | Informe de autopsia o forense (si disponible) | No | T |
| Delitos contra la vida | Pruebas de descargo (coartadas, testigos, videos) | No | T |
| Lesiones | Informe médico forense de la víctima | Sí | T |
| Delitos sexuales | Denuncia o querella de la víctima | Sí | A |
| Delitos contra menores | Resolución de DINAF o juzgado de niñez | Sí | A |
| Robo / hurto | Acta de denuncia y relación de bienes sustraídos | Sí | A |
| Extorsión | Capturas de pantalla, grabaciones o mensajes | Sí | T |
| Estafas / fraudes | Contratos, comprobantes de pago, comunicaciones | Sí | T |
| Delitos financieros (cheques, tarjetas) | Documento bancario (cheque, estado de cuenta) | Sí | A |
| Narcotráfico / drogas | Acta de decomiso o dictamen pericial químico | Sí | A |
| Lavado de activos | Requerimiento de la UAF o acta de investigación | Sí | A |
| Delitos contra la administración pública | Denuncia o informe de auditoría (TSC) | Sí | A |
| Delitos contra el honor (calumnia, injuria) | Publicación o declaración objeto de la querella | Sí | A |
| Allanamiento de morada | Denuncia y prueba de titularidad del inmueble | Sí | A |
| Tráfico de armas | Acta de decomiso y dictamen balístico | Sí | A |

### 2.15 Derecho Penal — Mediación, conflictos penales y multas (slug: `mediacion-conflictos-penales-y-multas`)

| Subservicio | Documento | Oblig. | Fase |
|---|---|---|---|
| General (todos) | Identidad del solicitante | Sí | A |
| Criterios de oportunidad | Denuncia o expediente fiscal | Sí | A |
| Suspensión condicional del proceso | Acuerdo de condiciones con el MP | Sí | A |
| Conciliación penal | Acta de conciliación (si ya hubo intento) | No | T |
| Acuerdo reparatorio | Comprobante de reparación del daño | Sí | T |
| Mediación penal | Solicitud de mediación ante el Centro de Mediación | Sí | A |
| Procedimiento abreviado | Conformidad del imputado por escrito | Sí | A |
| Recurso de multa administrativa | Boleta de multa o resolución sancionatoria | Sí | A |
| Sustitución de pena de multa | Sentencia que impone la multa | Sí | A |
| Justicia restaurativa | Solicitud de proceso restaurativo | Sí | A |

### 2.16 Derecho Penal — Menores, justicia juvenil y protección (slug: `menores-justicia-juvenil`)

| Subservicio | Documento | Oblig. | Fase |
|---|---|---|---|
| General (todos) | Certificado de nacimiento del menor | Sí | A |
| General (todos) | Identidad de los padres o representantes legales | Sí | A |
| Defensa de adolescentes infractores | Acta de aprehensión o citación del Juez de Niñez | Sí | A |
| Medidas socioeducativas | Informe del equipo multidisciplinario (si existe) | No | T |
| Privación de libertad | Resolución que ordena la medida | Sí | A |
| Medidas de protección | Denuncia o informe de situación de riesgo | Sí | A |
| Patria potestad / suspensión | Pruebas de la causal de suspensión | Sí | T |
| Adopción | Certificado de idoneidad | Sí | A |
| Maltrato infantil | Informe médico o psicológico del menor | Sí | T |
| Alimentos | Comprobantes de ingresos del obligado | Sí | A |
| Coordinación con DINAF | Oficio o requerimiento de DINAF | Sí | A |

### 2.17 Derecho Penal — Proceso penal completo (slug: `proceso-penal-completo`)

| Subservicio | Documento | Oblig. | Fase |
|---|---|---|---|
| General (todos) | Identidad del imputado | Sí | A |
| Investigación preliminar | Citación fiscal o acta de detención | Sí | A |
| Audiencia inicial | Requerimiento fiscal o auto de prisión | Sí | A |
| Etapa intermedia | Acusación fiscal o dictamen | Sí | A |
| Auto de apertura a juicio | Auto de apertura | Sí | A |
| Juicio oral | Lista de testigos y peritos de descargo | Sí | T |
| Prueba pericial | Informe pericial de parte (si se contrata) | No | T |
| Sentencia | Sentencia de primera instancia | Sí | C |
| Procedimiento abreviado | Conformidad firmada por el imputado | Sí | A |

### 2.18 Derecho Penal — Recursos y defensa avanzada (slug: `recursos-y-defensa-avanzada`)

| Subservicio | Documento | Oblig. | Fase |
|---|---|---|---|
| General (todos) | Identidad del recurrente | Sí | A |
| Apelación | Sentencia o auto recurrido | Sí | A |
| Apelación de auto de prisión | Auto que decreta la prisión preventiva | Sí | A |
| Casación | Sentencia de segunda instancia | Sí | A |
| Revisión | Sentencia firme y prueba nueva | Sí | A |
| Nulidad de actuaciones | Actuación viciada y fundamento de la nulidad | Sí | A |
| Amparo constitucional | Resolución que viola derechos fundamentales | Sí | A |
| Habeas corpus | Información sobre la detención (lugar, autoridad, fecha) | Sí | A |
| Acción de inconstitucionalidad | Ley o artículo impugnado | Sí | A |

### 2.19 Derecho Penal — Estrategia penal y litigio (slug: `estrategia-penal-y-litigio`)

| Subservicio | Documento | Oblig. | Fase |
|---|---|---|---|
| Auditoría de riesgo penal | Estatutos y objeto social de la empresa | Sí | A |
| Compliance penal | Manual de políticas existentes (si hay) | No | T |
| Investigaciones internas | Documentación del hecho investigado | Sí | A |
| Defensa corporativa | Denuncia o requerimiento contra la persona jurídica | Sí | A |
| Querella / acusación particular | Pruebas del delito denunciado | Sí | A |
| Peritajes privados | Documentación técnica del caso | Sí | A |
| Análisis jurisprudencial | Sentencias previas del mismo tribunal (si hay) | No | T |
| Negociación con el MP | Propuesta de acuerdo o criterio de oportunidad | No | T |

### 2.20 Derecho Penal — Ejecución penal y beneficios (slug: `ejecucion-penal-y-beneficios`)

| Subservicio | Documento | Oblig. | Fase |
|---|---|---|---|
| General (todos) | Sentencia ejecutoriada | Sí | A |
| Libertad condicional | Cómputo de pena actualizado | Sí | A |
| Libertad condicional | Certificado de conducta del centro penal | Sí | A |
| Redención de pena | Certificación de trabajo o estudio del centro penal | Sí | A |
| Traslado de centro penal | Solicitud motivada (familiar, salud, seguridad) | Sí | T |
| Indulto / conmutación | Certificación de sentencia y tiempo cumplido | Sí | A |
| Reclusión domiciliaria | Certificado médico (si es por salud) | Sí | A |
| Beneficios humanitarios | Certificado médico de enfermedad terminal o discapacidad | Sí | A |
| Revisión de cómputo | Cómputo de pena emitido por el juzgado de ejecución | Sí | A |
| Habeas corpus en prisión | Relato de condiciones de detención o violación de derechos | Sí | A |

---

### 2.21 Migrantes — Gestión documental y legalización (slug: `gestion-documental-y-legalizacion`)

| Subservicio | Documento | Oblig. | Fase |
|---|---|---|---|
| General (todos) | Pasaporte hondureño vigente del solicitante | Sí | A |
| General (todos) | Documento de identidad español (DNI/NIE) si aplica | No | A |
| Apostilla de La Haya | Documento original a apostillar | Sí | A |
| Traducción jurada | Documento original en español | Sí | A |
| Partidas (nacimiento, matrimonio, defunción) | Datos del registro (nombre, fecha, lugar) | Sí | A |
| Antecedentes penales | Solicitud firmada y copia de identidad | Sí | A |
| DNI / pasaporte hondureño | Pasaporte anterior o denuncia de extravío | Sí | A |
| Fe de vida | Documento de identidad vigente | Sí | A |
| Permiso de residencia / NIE | Tarjeta de residencia actual | Sí | A |
| Equivalencia de estudios | Título o certificado de estudios original | Sí | A |
| Coordinación con notarías en Honduras | Descripción del acto notarial requerido | Sí | A |
| Doble nacionalidad | Partida de nacimiento y documentos de los padres | Sí | A |

### 2.22 Migrantes — Actos notariales internacionales (slug: `actos-notariales-internacionales`)

| Subservicio | Documento | Oblig. | Fase |
|---|---|---|---|
| General (todos) | Pasaporte o DNI del poderdante | Sí | A |
| General (todos) | Datos completos del apoderado en Honduras | Sí | A |
| Poder general para pleitos | Descripción de los procesos judiciales a representar | Sí | A |
| Poder especial (venta, herencia, divorcio) | Detalle del acto específico a realizar | Sí | A |
| Poder para administración de bienes | Escritura de los bienes a administrar | Sí | A |
| Poder para trámites bancarios | Número de cuenta o producto bancario | Sí | A |
| Poder para sucesión | Certificado de defunción del causante | Sí | A |
| Testamentos | Relación detallada de bienes en ambos países | Sí | A |
| Capitulaciones matrimoniales | Certificado de matrimonio | Sí | A |
| Compraventa de inmuebles en Honduras | Escritura del inmueble | Sí | A |
| Donación | Escritura del bien a donar | Sí | A |
| Renuncia de derechos hereditarios | Certificado de defunción del causante | Sí | A |
| Disolución de comunidad de bienes | Escritura de los bienes en común | Sí | A |

### 2.23 Migrantes — Asuntos civiles y familiares desde el extranjero (slug: `asuntos-civiles-y-familiares-desde-el-extranjero`)

| Subservicio | Documento | Oblig. | Fase |
|---|---|---|---|
| General (todos) | Pasaporte o DNI del solicitante | Sí | A |
| Divorcio internacional | Certificado de matrimonio | Sí | A |
| Divorcio internacional | Última residencia común o domicilio de ambos | Sí | A |
| Reconocimiento de sentencia extranjera | Sentencia apostillada y traducida | Sí | A |
| Custodia internacional de menores | Certificado de nacimiento del menor | Sí | A |
| Sustracción parental | Denuncia y documentación del traslado ilícito | Sí | A |
| Pensión de alimentos internacional | Comprobantes de ingresos del obligado | Sí | A |
| Ejecución de alimentos | Sentencia de alimentos del país de origen | Sí | A |
| Sucesión internacional | Certificado de defunción del causante | Sí | A |
| Sucesión internacional | Escritura de bienes en ambos países | Sí | A |
| Adopción internacional | Certificado de idoneidad del país de residencia | Sí | A |
| Matrimonio civil en Honduras | Certificado de nacimiento y fe de soltería | Sí | A |
| Reagrupación familiar | Documentación que acredita el vínculo familiar | Sí | A |
| Nacionalidad española | Certificado de nacimiento y antecedentes penales | Sí | A |
| Inscripción de matrimonio / nacimiento | Certificado de matrimonio o nacimiento original | Sí | A |

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

- [x] 1. Crear data/documentos-por-area.ts con DocTemplate
- [x] 2.1 Derecho de Familia — 17 subservicios
- [x] 2.2 Derecho Laboral — 16 subservicios
- [x] 2.3 Derecho Civil y Notarial — 19 subservicios
- [x] 2.4 Derecho Mercantil y Empresarial — 17 subservicios
- [x] 2.5 Derecho Bancario y Financiero — 14 subservicios
- [x] 2.6 Derecho Administrativo — 14 subservicios
- [x] 2.7 Derecho Aduanero — 12 subservicios
- [x] 2.8 Regulación Sanitaria — 10 subservicios
- [x] 2.9 Extranjería en Honduras — 13 subservicios
- [x] 2.10 Propiedad Intelectual — 13 subservicios
- [x] 2.11 Derecho Tributario — 12 subservicios
- [x] 2.12 Derecho Ambiental — 11 subservicios
- [x] 2.13 Conciliación y Arbitraje — 12 subservicios
- [x] 2.14 Penal – Casos litigiosos — 17 subservicios
- [x] 2.15 Penal – Mediación y multas — 10 subservicios
- [x] 2.16 Penal – Menores — 11 subservicios
- [x] 2.17 Penal – Proceso completo — 9 subservicios
- [x] 2.18 Penal – Recursos — 9 subservicios
- [x] 2.19 Penal – Estrategia — 8 subservicios
- [x] 2.20 Penal – Ejecución — 10 subservicios
- [x] 2.21 Migrantes – Documental — 12 subservicios
- [x] 2.22 Migrantes – Actos notariales — 13 subservicios
- [x] 2.23 Migrantes – Civiles y familiares — 15 subservicios
- [ ] 8. Agregar opción "Otro" universal
- [ ] 9. Crear funciones getDocumentosPorArea, getDocumentosSugeridos, getDocumentosObligatorios
- [ ] 10. Crear API endpoint GET /api/twenty/documentos?area=
- [ ] 11. Integrar con flujo de creación de caso

