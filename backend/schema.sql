-- Schema para Motor de Cálculo de Penas - Honduras
-- PostgreSQL + pgvector

CREATE EXTENSION IF NOT EXISTS vector;

CREATE TABLE IF NOT EXISTS delitos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nombre VARCHAR(500) NOT NULL,
    articulo VARCHAR(100) NOT NULL,
    conducta TEXT,
    clasificacion VARCHAR(200),
    pena_minima_meses INTEGER NOT NULL,
    pena_maxima_meses INTEGER NOT NULL,
    tiene_pena_alternativa BOOLEAN DEFAULT FALSE,
    pena_alternativa_min INTEGER DEFAULT 0,
    pena_alternativa_max INTEGER DEFAULT 0,
    penas_accesorias TEXT[] DEFAULT '{}',
    observaciones TEXT,
    es_grave BOOLEAN DEFAULT FALSE,
    embedding VECTOR(1536),
    creado_en TIMESTAMPTZ DEFAULT NOW(),
    actualizado_en TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_delitos_clasificacion ON delitos(clasificacion);
CREATE INDEX IF NOT EXISTS idx_delitos_nombre ON delitos(nombre);
CREATE INDEX IF NOT EXISTS idx_delitos_es_grave ON delitos(es_grave);

COMMENT ON TABLE delitos IS 'Catálogo de tipos penales del Código Penal de Honduras (Decreto 130-2017)';
COMMENT ON COLUMN delitos.embedding IS 'Vector embedding para búsqueda semántica (pgvector)';
