# Briefs Preliminares - Fase 2 (Candidatos a Creación)

Este documento contiene el análisis estratégico previo a la redacción de 3 nuevas páginas candidatas. El objetivo es determinar si la creación de estas URLs aportará valor orgánico y de negocio sin canibalizar el contenido actual, evaluando el riesgo jurídico y validando la viabilidad.

---

## Candidato 1: Unión de Hecho Póstuma y Declaratoria de Herederos

- **Query real que lo justifica:** "como declarar union de hecho si mi pareja murio honduras", "derechos de concubina viuda en honduras", "declaratoria de herederos union libre honduras".
- **Datos GSC/Bing/Clarity:** Las páginas de derecho de familia actuales (pensión, divorcio) reciben clics residuales por variaciones de "unión de hecho" y "herencia", indicando que los usuarios buscan respuestas específicas sobre sucesión sin estar casados.
- **Intención de Búsqueda:** Informacional / Transaccional. El usuario (generalmente la pareja sobreviviente) busca saber con urgencia si tiene derecho a los bienes del difunto (cuentas bancarias, seguros, casa) y qué trámite debe iniciar ante los juzgados para ser reconocida legalmente.
- **Área Legal:** Derecho de Familia y Derecho Civil (Sucesiones).
- **Por qué no basta con mejorar una página existente:** Actualmente no existe una página dedicada a "Sucesiones" o "Unión de Hecho Póstuma". Mezclarlo en la página general de Divorcios o Familia diluiría la relevancia para una búsqueda tan específica y procedimental.
- **Riesgo de Canibalización:** Muy bajo. No hay posts publicados actualmente sobre herencias, sucesiones o uniones de hecho póstumas.
- **Fuentes jurídicas verificables (Google Search):** Código de Familia de Honduras (Arts. relacionadas a Unión de Hecho), Código Civil (Libro de Sucesiones), Jurisprudencia de la Corte Suprema sobre reconocimiento post-mortem.
- **Estructura propuesta H1/H2/H3:**
  - H1: Unión de Hecho Póstuma y Declaratoria de Herederos en Honduras
  - H2: ¿Tengo derecho a heredar si vivíamos en unión libre y mi pareja falleció?
  - H2: Requisitos para el Reconocimiento de Unión de Hecho Póstuma
  - H3: Pruebas admitidas por los Juzgados de Familia
  - H3: Plazo legal para iniciar la acción
  - H2: Cómo solicitar la Declaratoria de Herederos Abintestato
  - H2: Preguntas Frecuentes (FAQ)
- **Enlaces internos:** Hacia la landing principal de `/servicios-juridicos/derecho-de-familia` y hacia contacto.
- **CTA:** "Si necesitas iniciar el reconocimiento legal de tu unión para proteger tu patrimonio, contacta a nuestros abogados de familia." (Apuntando a `/solicitar-consulta`).
- **Riesgo jurídico:** Medio. Debe dejarse claro que el reconocimiento depende de pruebas contundentes y del fallo de un juez; no es automático.
- **Recomendación final:** **CREAR**. Atiende una necesidad jurídica real, urgente y con alto potencial de conversión para el despacho.

---

## Candidato 2: Prescripción de Delitos en Honduras

- **Query real que lo justifica:** "cuando prescribe un delito de robo en honduras", "tiempo de prescripcion penal honduras", "limpieza de antecedentes penales por prescripcion honduras".
- **Datos GSC/Bing/Clarity:** Búsquedas informacionales elevadas en el sector penal (visible en los CTRs de la página de Allanamiento y Defensa Penal). Existe un alto volumen de usuarios con causas penales antiguas buscando regularizar su estatus.
- **Intención de Búsqueda:** Informacional. Usuarios que tienen órdenes de captura antiguas o que cometieron un delito hace años y desean saber si ya no pueden ser perseguidos legalmente.
- **Área Legal:** Derecho Penal.
- **Por qué no basta con mejorar una página existente:** Las páginas de servicios penales son transaccionales (ofrecen defensa). Un artículo profundo sobre prescripción (Art. 95, 96, 97 del Código Penal) requiere tablas de penas y plazos que no encajan en una landing de servicio.
- **Riesgo de Canibalización:** Bajo. Existe una página "cuando-prescribe-delito-en-honduras", pero requiere revisión. Si esta página ya existe en la DB (`cuando-prescribe-delito-en-honduras`), la estrategia debería ser FUSIONAR/OPTIMIZAR.
- **Fuentes jurídicas verificables (Google Search):** Código Penal de Honduras (Decreto 130-2017), Arts. sobre Causas de Extinción de la Responsabilidad Penal.
- **Estructura propuesta H1/H2/H3:**
  - H1: ¿Cuándo prescribe un delito en Honduras? (Nuevo Código Penal)
  - H2: Diferencia entre Prescripción de la Acción Penal y de la Pena
  - H2: Tabla de Plazos de Prescripción según el tipo de delito
  - H3: Delitos que NO prescriben en Honduras
  - H2: ¿Cómo interrumpe la fiscalía (Ministerio Público) la prescripción?
  - H2: Pasos para solicitar la extinción de la causa por prescripción
- **Enlaces internos:** Hacia `/servicios-juridicos/derecho-penal` y a landing local de abogados penalistas.
- **CTA:** "Si tienes un caso penal antiguo y necesitas que un abogado solicite formalmente la prescripción ante el juez competente, escríbenos."
- **Riesgo jurídico:** Alto. Un usuario podría leer mal una tabla y creer que es libre, cruzando fronteras y siendo detenido. Debe llevar disclaimers estrictos de que el cálculo exacto requiere la revisión del expediente por un abogado.
- **Recomendación final:** **FUSIONAR / OPTIMIZAR**. Al verificar los logs del sistema, se detecta que ya existe el slug `cuando-prescribe-delito-en-honduras`. Se recomienda optimizarlo manualmente (Fase 1.5) en lugar de crear una página nueva desde cero.

---

## Candidato 3: Importación de pequeños paquetes / Régimen aduanero simplificado

- **Query real que lo justifica:** "como importar de china a honduras sin pagar tantos impuestos", "regimen simplificado aduanas honduras", "courier y aduanas honduras limite de compra".
- **Datos GSC/Bing/Clarity:** Las páginas de `guia-aduanera-importaciones-honduras` e `importar-china-guia-aduanera` atraen tráfico, pero a menudo los usuarios buscan soluciones para importaciones personales (compras online) o pequeños emprendimientos, no régimen general corporativo.
- **Intención de Búsqueda:** Informacional / Comercial. Emprendedores y compradores frecuentes que desean evitar la retención de paquetes en aduanas y conocer los límites exentos de impuestos.
- **Área Legal:** Derecho Administrativo / Aduanero.
- **Por qué no basta con mejorar una página existente:** Las guías actuales (`guia-aduanera-importaciones-honduras`) son muy densas y corporativas (flete, agentes aduaneros, DUA). El régimen simplificado para "couriers" y pequeños importadores es un tema lo suficientemente distinto y de alto volumen para merecer su propio artículo enfocado a Pymes/Emprendedores.
- **Riesgo de Canibalización:** Medio. Podría canibalizar las búsquedas genéricas de "importar a honduras". Debe distinguirse claramente en el título (ej: "Régimen Simplificado" / "Pequeños Paquetes").
- **Fuentes jurídicas verificables (Google Search):** Código Aduanero Uniforme Centroamericano (CAUCA) y su Reglamento (RECAUCA), normativas y comunicados recientes de la Administración Aduanera de Honduras respecto a envíos urgentes o couriers.
- **Estructura propuesta H1/H2/H3:**
  - H1: Guía de Importación de Pequeños Paquetes y Régimen Simplificado en Honduras
  - H2: ¿Qué es el régimen simplificado o envíos urgentes (Courier)?
  - H2: Límites de valor y peso para no pagar impuestos (o pagar tarifa reducida)
  - H3: Diferencia entre uso personal y fines comerciales
  - H2: ¿Por qué retiene aduanas mi paquete de SHEIN/Amazon/Alibaba?
  - H2: Requisitos legales para emprendedores que importan por paquetería
- **Enlaces internos:** Hacia la guía general de aduanas (para aquellos que superen los límites) y hacia `/servicios-juridicos/derecho-mercantil-y-corporativo`.
- **CTA:** "Si tu negocio creció y necesitas formalizar tus importaciones mediante el régimen general o defenderte ante un ajuste aduanero, contáctanos."
- **Riesgo jurídico:** Bajo. Son regulaciones públicas de aduanas. El riesgo es la desactualización si la Administración Aduanera cambia los topes (ej. el famoso límite de $500 o de uso personal).
- **Recomendación final:** **CREAR**. Complementa la guía general, ataca una query long-tail de muchísimo volumen en Honduras (compras de China/USA) y sirve como embudo para emprendedores que luego requerirán formalización mercantil.
