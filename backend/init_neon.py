import asyncio
import json
import os
from pathlib import Path
from dotenv import load_dotenv
from sqlalchemy.ext.asyncio import create_async_engine
from sqlalchemy import text

load_dotenv(Path(__file__).parent / '.env')
DATABASE_URL = os.getenv('DATABASE_URL', 'postgresql+asyncpg://postgres:postgres@localhost:5432/penas')

DATA_DIR = Path(__file__).parent / 'data'

async def init():
    engine = create_async_engine(DATABASE_URL, echo=True)

    async with engine.begin() as conn:
        await conn.execute(text("CREATE EXTENSION IF NOT EXISTS vector"))

        # Create tables
        await conn.execute(text("""
            CREATE TABLE IF NOT EXISTS ramas_juridicas (
                id VARCHAR(100) PRIMARY KEY,
                nombre VARCHAR(300) NOT NULL,
                parent_id VARCHAR(100) REFERENCES ramas_juridicas(id),
                nivel INTEGER NOT NULL DEFAULT 1,
                orden INTEGER NOT NULL DEFAULT 0
            )
        """))

        await conn.execute(text("""
            CREATE TABLE IF NOT EXISTS articulos_constitucion (
                id INTEGER PRIMARY KEY,
                articulo VARCHAR(100) NOT NULL,
                titulo VARCHAR(200),
                capitulo VARCHAR(200),
                texto TEXT
            )
        """))

        await conn.execute(text("""
            CREATE TABLE IF NOT EXISTS delitos (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                nombre VARCHAR(500) NOT NULL,
                articulo VARCHAR(100) NOT NULL,
                conducta TEXT,
                clasificacion VARCHAR(200),
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
            )
        """))

        # Add new columns if they don't exist (for existing DB migration)
        for col in [
            ("ALTER TABLE delitos ADD COLUMN IF NOT EXISTS rama_id VARCHAR(100) REFERENCES ramas_juridicas(id)",),
            ("ALTER TABLE delitos ADD COLUMN IF NOT EXISTS constitucion_articulo_id INTEGER REFERENCES articulos_constitucion(id)",),
        ]:
            try:
                await conn.execute(text(col[0]))
            except Exception:
                pass

        # Seed ramas_juridicas
        ramas_file = DATA_DIR / 'ramas_juridicas.json'
        if ramas_file.exists():
            ramas = json.loads(ramas_file.read_text(encoding='utf-8'))
            for r in ramas:
                await conn.execute(
                    text("""INSERT INTO ramas_juridicas (id, nombre, parent_id, nivel, orden)
                            VALUES (:id, :nombre, :parent_id, :nivel, :orden)
                            ON CONFLICT (id) DO NOTHING"""),
                    {'id': r['id'], 'nombre': r['nombre'], 'parent_id': r.get('parent_id'),
                     'nivel': r['nivel'], 'orden': r['orden']}
                )
            print(f"Seeded {len(ramas)} ramas juridicas")

        # Seed articulos_constitucion
        arts_file = DATA_DIR / 'articulos_constitucion.json'
        if arts_file.exists():
            arts = json.loads(arts_file.read_text(encoding='utf-8'))
            for a in arts:
                await conn.execute(
                    text("""INSERT INTO articulos_constitucion (id, articulo, titulo, capitulo, texto)
                            VALUES (:id, :articulo, :titulo, :capitulo, :texto)
                            ON CONFLICT (id) DO NOTHING"""),
                    {'id': a['numero'], 'articulo': a['articulo'], 'titulo': a['titulo'],
                     'capitulo': a.get('capitulo'), 'texto': a.get('texto')}
                )
            print(f"Seeded {len(arts)} articulos constitucionales")

        # Seed delitos
        delitos_file = DATA_DIR / 'delitos.json'
        if delitos_file.exists():
            delitos = json.loads(delitos_file.read_text(encoding='utf-8'))

            # Build mapping of ramas to nombres to derive `clasificacion` when missing
            ramas_map = {}
            ramas_file = DATA_DIR / 'ramas_juridicas.json'
            if ramas_file.exists():
                ramas_list = json.loads(ramas_file.read_text(encoding='utf-8'))
                ramas_map = {r['id']: r['nombre'] for r in ramas_list}

            count = 0
            for d in delitos:
                es_grave = d.get('pena_maxima_meses', 0) >= 60

                # derive clasificacion from seed or from top-level rama_id
                clasificacion_val = d.get('clasificacion')
                rama_id = d.get('rama_id')
                if not clasificacion_val and rama_id:
                    top = str(rama_id).split('.')[0]
                    clasificacion_val = ramas_map.get(top)

                await conn.execute(
                    text("""INSERT INTO delitos (nombre, articulo, conducta, clasificacion, rama_id,
                            constitucion_articulo_id, pena_minima_meses, pena_maxima_meses,
                            tiene_pena_alternativa, pena_alternativa_min, pena_alternativa_max,
                            penas_accesorias, observaciones, es_grave)
                            VALUES (:nombre, :articulo, :conducta, :clasificacion, :rama_id,
                            :constitucion_articulo_id, :pena_minima_meses, :pena_maxima_meses,
                            :tiene_pena_alternativa, :pena_alternativa_min, :pena_alternativa_max,
                            :penas_accesorias, :observaciones, :es_grave)
                            ON CONFLICT DO NOTHING"""),
                    {'nombre': d['nombre'], 'articulo': d['articulo'],
                     'conducta': d.get('conducta'), 'clasificacion': clasificacion_val,
                     'rama_id': d.get('rama_id'), 'constitucion_articulo_id': d.get('constitucion_articulo_id'),
                     'pena_minima_meses': d['pena_minima_meses'],
                     'pena_maxima_meses': d['pena_maxima_meses'],
                     'tiene_pena_alternativa': d.get('tiene_pena_alternativa', False),
                     'pena_alternativa_min': d.get('pena_alternativa_min', 0),
                     'pena_alternativa_max': d.get('pena_alternativa_max', 0),
                     'penas_accesorias': d.get('penas_accesorias', []),
                     'observaciones': d.get('observaciones'),
                     'es_grave': es_grave}
                )
                count += 1

            # For existing rows that still have NULL `clasificacion`, update using ramas_map
            if ramas_map:
                for top_id, nombre in ramas_map.items():
                    await conn.execute(
                        text("""UPDATE delitos SET clasificacion = :nombre
                                WHERE (rama_id = :top_id OR rama_id LIKE :top_like) AND clasificacion IS NULL"""),
                        {'nombre': nombre, 'top_id': top_id, 'top_like': f"{top_id}.%"}
                    )

            print(f"Seeded {count} delitos")

    await engine.dispose()
    print("Database initialized successfully")

if __name__ == "__main__":
    asyncio.run(init())
