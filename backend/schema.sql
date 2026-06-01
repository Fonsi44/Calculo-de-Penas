-- Schema para Motor de Cálculo de Penas - Honduras
-- PostgreSQL + pgvector + ramas jurídicas + constitución

CREATE EXTENSION IF NOT EXISTS vector;

-- Tabla de ramas jurídicas
CREATE TABLE IF NOT EXISTS ramas_juridicas (
    id VARCHAR(100) PRIMARY KEY,
    nombre VARCHAR(300) NOT NULL,
    parent_id VARCHAR(100) REFERENCES ramas_juridicas(id),
    nivel INTEGER NOT NULL DEFAULT 1,
    orden INTEGER NOT NULL DEFAULT 0
);

-- Tabla de artículos constitucionales
CREATE TABLE IF NOT EXISTS articulos_constitucion (
    id INTEGER PRIMARY KEY,
    articulo VARCHAR(100) NOT NULL,
    titulo VARCHAR(200),
    capitulo VARCHAR(200),
    texto TEXT
);

-- Tabla de delitos
CREATE TABLE IF NOT EXISTS delitos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nombre VARCHAR(500) NOT NULL,
    articulo VARCHAR(100) NOT NULL,
    conducta TEXT,
    rama_id VARCHAR(100) REFERENCES ramas_juridicas(id),
    constitucion_articulo_id INTEGER REFERENCES articulos_constitucion(id),
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

CREATE INDEX IF NOT EXISTS idx_delitos_rama ON delitos(rama_id);
CREATE INDEX IF NOT EXISTS idx_delitos_nombre ON delitos(nombre);
CREATE INDEX IF NOT EXISTS idx_delitos_es_grave ON delitos(es_grave);
CREATE INDEX IF NOT EXISTS idx_ramas_parent ON ramas_juridicas(parent_id);

COMMENT ON TABLE delitos IS 'Catálogo de tipos penales del Código Penal de Honduras (Decreto 130-2017)';
COMMENT ON COLUMN delitos.rama_id IS 'Rama jurídica de la taxonomía del CP';
COMMENT ON COLUMN delitos.constitucion_articulo_id IS 'Artículo de la Constitución relacionado';
COMMENT ON COLUMN delitos.embedding IS 'Vector embedding para búsqueda semántica (pgvector)';
