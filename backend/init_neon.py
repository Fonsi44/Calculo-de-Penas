import asyncio
import os
from pathlib import Path
from dotenv import load_dotenv
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker
from sqlalchemy import text, select, func

load_dotenv(Path(__file__).parent / '.env')
DATABASE_URL = os.getenv('DATABASE_URL', 'postgresql+asyncpg://postgres:postgres@localhost:5432/penas')


async def init():
    print(f"Conectando a: {DATABASE_URL.split('@')[-1].split('?')[0]}")
    engine = create_async_engine(DATABASE_URL, echo=True)

    async with engine.begin() as conn:
        print("Creando extensión vector...")
        await conn.execute(text("CREATE EXTENSION IF NOT EXISTS vector"))

        print("Creando tabla delitos...")
        await conn.execute(text("""
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
            )
        """))

        print("Creando índices...")
        await conn.execute(text("CREATE INDEX IF NOT EXISTS idx_delitos_clasificacion ON delitos(clasificacion)"))
        await conn.execute(text("CREATE INDEX IF NOT EXISTS idx_delitos_nombre ON delitos(nombre)"))
        await conn.execute(text("CREATE INDEX IF NOT EXISTS idx_delitos_es_grave ON delitos(es_grave)"))

    print("Base de datos inicializada correctamente.")
    await engine.dispose()


if __name__ == "__main__":
    asyncio.run(init())
