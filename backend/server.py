from fastapi import FastAPI, APIRouter, Query, HTTPException, Body, Depends
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
import uuid
from datetime import datetime, timezone
from enum import Enum
import math
import re

from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column
from sqlalchemy import (
    select, func, text, String, Integer, Boolean,
    DateTime, Text, ARRAY
)


ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

DATABASE_URL = os.getenv('DATABASE_URL', 'postgresql+asyncpg://postgres:postgres@localhost:5432/penas')
engine = create_async_engine(DATABASE_URL, echo=False, pool_size=5, max_overflow=10)
async_session = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)


class Base(DeclarativeBase):
    pass


class DelitoDB(Base):
    __tablename__ = 'delitos'

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    nombre: Mapped[str] = mapped_column(String(500), nullable=False, index=True)
    articulo: Mapped[str] = mapped_column(String(100), nullable=False)
    conducta: Mapped[Optional[str]] = mapped_column(Text)
    clasificacion: Mapped[Optional[str]] = mapped_column(String(200), index=True)
    pena_minima_meses: Mapped[int] = mapped_column(Integer, nullable=False)
    pena_maxima_meses: Mapped[int] = mapped_column(Integer, nullable=False)
    tiene_pena_alternativa: Mapped[bool] = mapped_column(Boolean, default=False)
    pena_alternativa_min: Mapped[int] = mapped_column(Integer, default=0)
    pena_alternativa_max: Mapped[int] = mapped_column(Integer, default=0)
    penas_accesorias: Mapped[Optional[List[str]]] = mapped_column(ARRAY(Text), default=list)
    observaciones: Mapped[Optional[str]] = mapped_column(Text)
    es_grave: Mapped[bool] = mapped_column(Boolean, default=False, index=True)
    creado_en: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
    actualizado_en: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)


async def get_db():
    async with async_session() as session:
        yield session


app = FastAPI(title="Motor de Cálculo de Penas - Honduras", version="1.0.0")

# Crear tablas al cargar el módulo (para serverless en Vercel)
try:
    import asyncio
    loop = asyncio.new_event_loop()
    asyncio.set_event_loop(loop)
    async def _init_tables():
        async with engine.begin() as conn:
            await conn.execute(text("CREATE EXTENSION IF NOT EXISTS vector"))
            await conn.run_sync(Base.metadata.create_all)
    loop.run_until_complete(_init_tables())
    loop.close()
except Exception:
    pass
api_router = APIRouter(prefix="/api")

# =============================================
# MODELOS
# =============================================

class GradoAutoria(str, Enum):
    AUTOR_DIRECTO = "autor_directo"
    COAUTOR = "coautor"
    INDUCTOR = "inductor"
    COOPERADOR_NECESARIO = "cooperador_necesario"
    COMPLICE = "complice"

class GradoEjecucion(str, Enum):
    CONSUMADO = "consumado"
    TENTATIVA_ACABADA = "tentativa_acabada"
    TENTATIVA_INACABADA = "tentativa_inacabada"

class TipoConcurso(str, Enum):
    NINGUNO = "ninguno"
    REAL = "real"
    IDEAL = "ideal"
    MEDIAL = "medial"
    CONTINUADO = "continuado"

class TipoPena(str, Enum):
    PRISION = "prision"
    MULTA = "multa"

class DelitoBase(BaseModel):
    nombre: str
    articulo: str
    conducta: str
    clasificacion: str
    pena_minima_meses: int
    pena_maxima_meses: int
    pena_alternativa_min: Optional[int] = 0
    pena_alternativa_max: Optional[int] = 0
    tiene_pena_alternativa: bool = False
    penas_accesorias: List[str] = []
    observaciones: Optional[str] = None
    es_grave: bool = False

class DelitoCreate(DelitoBase):
    pass

class DelitoUpdate(BaseModel):
    nombre: Optional[str] = None
    articulo: Optional[str] = None
    conducta: Optional[str] = None
    clasificacion: Optional[str] = None
    pena_minima_meses: Optional[int] = None
    pena_maxima_meses: Optional[int] = None
    pena_alternativa_min: Optional[int] = None
    pena_alternativa_max: Optional[int] = None
    tiene_pena_alternativa: Optional[bool] = None
    penas_accesorias: Optional[List[str]] = None
    observaciones: Optional[str] = None
    es_grave: Optional[bool] = None

class Delito(DelitoBase):
    id: str

class DelitoConfig(BaseModel):
    delito_id: str
    pena_seleccionada: TipoPena = TipoPena.PRISION
    variables_activas: List[str] = []
    grado_autoria: GradoAutoria = GradoAutoria.AUTOR_DIRECTO
    grado_ejecucion: GradoEjecucion = GradoEjecucion.CONSUMADO
    reduccion_tentativa: int = 1
    agravantes: List[str] = []
    atenuantes: List[str] = []
    eximentes: List[str] = []
    eximente_completa: bool = False

class CalculoRequest(BaseModel):
    delitos: List[DelitoConfig]
    tipo_concurso: TipoConcurso = TipoConcurso.NINGUNO

# =============================================
# CIRCUNSTANCIAS MODIFICATIVAS (CP HONDURAS)
# =============================================

AGRAVANTES = [
    {"id": "alevosia", "articulo": "Art. 27.1 CP", "nombre": "Alevosía", "descripcion": "Emplear medios que aseguren la ejecución sin riesgo para el autor"},
    {"id": "disfraz", "articulo": "Art. 27.2 CP", "nombre": "Disfraz o abuso de superioridad", "descripcion": "Usar disfraz o abusar de superioridad de fuerzas"},
    {"id": "precio", "articulo": "Art. 27.3 CP", "nombre": "Precio, recompensa o promesa", "descripcion": "Cometer el delito mediante precio, recompensa o promesa"},
    {"id": "discriminacion", "articulo": "Art. 27.4 CP", "nombre": "Motivos discriminatorios", "descripcion": "Por motivos de raza, género, religión, orientación sexual, etc."},
    {"id": "ensanamiento", "articulo": "Art. 27.5 CP", "nombre": "Ensañamiento", "descripcion": "Aumentar deliberada e inhumanamente el sufrimiento de la víctima"},
    {"id": "abuso_confianza", "articulo": "Art. 27.6 CP", "nombre": "Abuso de confianza", "descripcion": "Quebrantar relación de confianza con la víctima"},
    {"id": "prevalimiento", "articulo": "Art. 27.7 CP", "nombre": "Prevalimiento del carácter público", "descripcion": "Aprovecharse de la condición de funcionario público"},
    {"id": "reincidencia", "articulo": "Art. 27.8 CP", "nombre": "Reincidencia", "descripcion": "Haber sido condenado previamente por delito de igual naturaleza"},
    {"id": "multiples_victimas", "articulo": "Art. 27.9 CP", "nombre": "Pluralidad de víctimas", "descripcion": "Cometer el delito contra múltiples víctimas"},
    {"id": "victima_vulnerable", "articulo": "Art. 27.10 CP", "nombre": "Víctima especialmente vulnerable", "descripcion": "Menor de edad, persona con discapacidad, anciano, etc."},
]

ATENUANTES = [
    {"id": "eximente_incompleta", "articulo": "Art. 26.1 CP", "nombre": "Eximente incompleta", "descripcion": "Cuando no concurran todos los requisitos de una eximente"},
    {"id": "arrebato", "articulo": "Art. 26.3 CP", "nombre": "Arrebato u obcecación", "descripcion": "Actuar por estímulos tan poderosos que produzcan arrebato"},
    {"id": "confesion", "articulo": "Art. 26.4 CP", "nombre": "Confesión del delito", "descripcion": "Haber confesado el delito antes de conocer el procedimiento"},
    {"id": "reparacion", "articulo": "Art. 26.5 CP", "nombre": "Reparación del daño", "descripcion": "Haber reparado el daño o disminuido sus efectos"},
    {"id": "dilaciones", "articulo": "Art. 26.6 CP", "nombre": "Dilaciones indebidas", "descripcion": "Dilaciones extraordinarias e indebidas en el procedimiento"},
    {"id": "menor_edad", "articulo": "Art. 26.7 CP", "nombre": "Menor de 21 años", "descripcion": "Ser menor de veintiún años"},
    {"id": "grave_adiccion", "articulo": "Art. 26.2 CP", "nombre": "Grave adicción", "descripcion": "Actuar bajo influencia de grave adicción a sustancias"},
]

EXIMENTES = [
    {"id": "anomalia", "articulo": "Art. 25.1 CP", "nombre": "Anomalía o alteración psíquica", "completa": True},
    {"id": "intoxicacion", "articulo": "Art. 25.2 CP", "nombre": "Intoxicación plena", "completa": True},
    {"id": "alteracion_percepcion", "articulo": "Art. 25.3 CP", "nombre": "Alteración de la percepción", "completa": True},
    {"id": "legitima_defensa", "articulo": "Art. 25.4 CP", "nombre": "Legítima defensa", "completa": True},
    {"id": "estado_necesidad", "articulo": "Art. 25.5 CP", "nombre": "Estado de necesidad", "completa": True},
    {"id": "miedo_insuperable", "articulo": "Art. 25.6 CP", "nombre": "Miedo insuperable", "completa": True},
    {"id": "cumplimiento_deber", "articulo": "Art. 25.7 CP", "nombre": "Cumplimiento de un deber", "completa": True},
    {"id": "eximente_incompleta", "articulo": "Art. 26.1 CP", "nombre": "Eximente incompleta", "completa": False},
]

GRADOS_AUTORIA = [
    {"id": "autor_directo", "nombre": "Autor Directo", "articulo": "Art. 28 p. 1° CP", "descripcion": "Realiza el hecho por sí solo", "efecto": "pena_integra"},
    {"id": "coautor", "nombre": "Coautor", "articulo": "Art. 28 p. 1° CP", "descripcion": "Realizan el hecho conjuntamente", "efecto": "pena_integra"},
    {"id": "inductor", "nombre": "Inductor", "articulo": "Art. 28 p. 2° a) CP", "descripcion": "Induce directamente a otro a ejecutarlo", "efecto": "pena_integra"},
    {"id": "cooperador_necesario", "nombre": "Cooperador Necesario", "articulo": "Art. 28 p. 2° b) CP", "descripcion": "Coopera con acto sin el cual no se habría efectuado", "efecto": "pena_integra"},
    {"id": "complice", "nombre": "Cómplice", "articulo": "Art. 29 CP", "descripcion": "Coopera con actos anteriores o simultáneos (no necesarios)", "efecto": "pena_inferior_1_grado"},
]

GRADOS_EJECUCION = [
    {"id": "consumado", "nombre": "Consumado", "articulo": "Art. 15 CP", "descripcion": "Se han realizado todos los actos y producido el resultado", "efecto": "pena_integra"},
    {"id": "tentativa_acabada", "nombre": "Tentativa Acabada", "articulo": "Art. 16 y 62 CP", "descripcion": "Se practican todos los actos pero no se produce el resultado", "efecto": "pena_inferior_1_2_grados"},
    {"id": "tentativa_inacabada", "nombre": "Tentativa Inacabada", "articulo": "Art. 16 y 62 CP", "descripcion": "Se practica solo parte de los actos de ejecución", "efecto": "pena_inferior_1_2_grados"},
]

TIPOS_CONCURSO = [
    {"id": "real", "nombre": "Concurso Real", "articulo": "Art. 37 CP", "descripcion": "Pluralidad de hechos delictivos independientes. Se acumulan las penas respetando los límites legales máximos."},
    {"id": "ideal", "nombre": "Concurso Ideal", "articulo": "Art. 36 CP", "descripcion": "Un solo hecho constituye dos o más delitos. Se aplica la pena del delito más grave en su mitad superior."},
    {"id": "medial", "nombre": "Concurso Medial", "articulo": "Art. 36.2 CP", "descripcion": "Un delito es medio necesario para cometer otro. Se aplica la pena superior en grado a la del delito más grave."},
    {"id": "continuado", "nombre": "Delito Continuado", "articulo": "Art. 35 CP", "descripcion": "Pluralidad de acciones con misma finalidad delictiva. Pena aumentada hasta el máximo legal."},
]

# =============================================
# FUNCIONES AUXILIARES
# =============================================

def parse_pena_texto(texto: str) -> tuple:
    """Parsea texto de pena a meses"""
    texto = texto.lower().strip()
    
    # Buscar patrones como "X a Y años", "X años", "X meses"
    patron_rango_anos = r"(\d+)\s*a\s*(\d+)\s*años?"
    patron_rango_meses = r"(\d+)\s*a\s*(\d+)\s*meses?"
    patron_anos = r"(\d+)\s*años?"
    patron_meses = r"(\d+)\s*meses?"
    
    match = re.search(patron_rango_anos, texto)
    if match:
        return int(match.group(1)) * 12, int(match.group(2)) * 12
    
    match = re.search(patron_rango_meses, texto)
    if match:
        return int(match.group(1)), int(match.group(2))
    
    match = re.search(patron_anos, texto)
    if match:
        meses = int(match.group(1)) * 12
        return meses, meses
    
    match = re.search(patron_meses, texto)
    if match:
        meses = int(match.group(1))
        return meses, meses
    
    return 0, 0

def meses_a_texto(meses: int) -> str:
    """Convierte meses a texto legible"""
    if meses <= 0:
        return "0 meses"
    if meses >= 480:  # 40 años
        return "Prisión perpetua"
    
    años = meses // 12
    meses_restantes = meses % 12
    
    if años > 0 and meses_restantes > 0:
        return f"{años} año{'s' if años != 1 else ''} y {meses_restantes} mes{'es' if meses_restantes != 1 else ''}"
    elif años > 0:
        return f"{años} año{'s' if años != 1 else ''}"
    else:
        return f"{meses_restantes} mes{'es' if meses_restantes != 1 else ''}"

def reducir_grado(minimo: int, maximo: int, grados: int = 1) -> tuple:
    """Reduce la pena en grados (Art. 70-71 CP Honduras)"""
    for _ in range(grados):
        nuevo_max = minimo
        nuevo_min = max(1, minimo // 2)
        minimo, maximo = nuevo_min, nuevo_max
    return minimo, maximo

def aumentar_grado(minimo: int, maximo: int, grados: int = 1) -> tuple:
    """Aumenta la pena en grados"""
    for _ in range(grados):
        nuevo_min = maximo
        nuevo_max = min(480, int(maximo * 1.5))
        minimo, maximo = nuevo_min, nuevo_max
    return minimo, maximo

def aplicar_mitad_superior(minimo: int, maximo: int) -> tuple:
    """Aplica la pena en su mitad superior"""
    punto_medio = (minimo + maximo) // 2
    return punto_medio, maximo

def aplicar_mitad_inferior(minimo: int, maximo: int) -> tuple:
    """Aplica la pena en su mitad inferior"""
    punto_medio = (minimo + maximo) // 2
    return minimo, punto_medio

# =============================================
# ENDPOINTS DE DELITOS (CRUD)
# =============================================

@api_router.get("/")
async def root():
    return {"message": "Motor de Cálculo de Penas - Código Penal de Honduras"}

@api_router.get("/delitos")
async def listar_delitos(
    clasificacion: Optional[str] = Query(None),
    busqueda: Optional[str] = Query(None),
    skip: int = 0,
    limit: int = 100,
    session: AsyncSession = Depends(get_db)
):
    """Lista delitos con filtros opcionales"""
    stmt = select(DelitoDB).order_by(DelitoDB.nombre)

    if clasificacion:
        stmt = stmt.where(DelitoDB.clasificacion.ilike(f"%{clasificacion}%"))
    if busqueda:
        stmt = stmt.where(
            DelitoDB.nombre.ilike(f"%{busqueda}%")
            | DelitoDB.articulo.ilike(f"%{busqueda}%")
            | DelitoDB.conducta.ilike(f"%{busqueda}%")
        )

    stmt = stmt.offset(skip).limit(limit)
    result = await session.execute(stmt)
    delitos = result.scalars().all()

    return [
        {
            "id": str(d.id),
            "nombre": d.nombre,
            "articulo": d.articulo,
            "conducta": d.conducta,
            "clasificacion": d.clasificacion,
            "pena_minima_meses": d.pena_minima_meses,
            "pena_maxima_meses": d.pena_maxima_meses,
            "tiene_pena_alternativa": d.tiene_pena_alternativa,
            "pena_alternativa_min": d.pena_alternativa_min,
            "pena_alternativa_max": d.pena_alternativa_max,
            "penas_accesorias": d.penas_accesorias or [],
            "observaciones": d.observaciones,
            "es_grave": d.es_grave,
            "pena_texto": f"{meses_a_texto(d.pena_minima_meses)} a {meses_a_texto(d.pena_maxima_meses)}"
        }
        for d in delitos
    ]

@api_router.get("/delitos/count")
async def contar_delitos(session: AsyncSession = Depends(get_db)):
    """Cuenta total de delitos"""
    result = await session.execute(select(func.count(DelitoDB.id)))
    total = result.scalar()
    return {"total": total}

@api_router.get("/delitos/{delito_id}")
async def obtener_delito(delito_id: str, session: AsyncSession = Depends(get_db)):
    """Obtiene un delito por ID"""
    try:
        d = await session.get(DelitoDB, uuid.UUID(delito_id))
        if not d:
            raise HTTPException(status_code=404, detail="Delito no encontrado")
        return {
            "id": str(d.id),
            "nombre": d.nombre,
            "articulo": d.articulo,
            "conducta": d.conducta,
            "clasificacion": d.clasificacion,
            "pena_minima_meses": d.pena_minima_meses,
            "pena_maxima_meses": d.pena_maxima_meses,
            "tiene_pena_alternativa": d.tiene_pena_alternativa,
            "pena_alternativa_min": d.pena_alternativa_min,
            "pena_alternativa_max": d.pena_alternativa_max,
            "penas_accesorias": d.penas_accesorias or [],
            "observaciones": d.observaciones,
            "es_grave": d.es_grave,
            "pena_texto": f"{meses_a_texto(d.pena_minima_meses)} a {meses_a_texto(d.pena_maxima_meses)}"
        }
    except (ValueError, Exception):
        raise HTTPException(status_code=404, detail="Delito no encontrado")

@api_router.post("/delitos")
async def crear_delito(delito: DelitoCreate, session: AsyncSession = Depends(get_db)):
    """Crea un nuevo delito"""
    db_delito = DelitoDB(
        nombre=delito.nombre,
        articulo=delito.articulo,
        conducta=delito.conducta,
        clasificacion=delito.clasificacion,
        pena_minima_meses=delito.pena_minima_meses,
        pena_maxima_meses=delito.pena_maxima_meses,
        tiene_pena_alternativa=delito.tiene_pena_alternativa,
        pena_alternativa_min=delito.pena_alternativa_min,
        pena_alternativa_max=delito.pena_alternativa_max,
        penas_accesorias=delito.penas_accesorias or [],
        observaciones=delito.observaciones,
        es_grave=delito.pena_maxima_meses >= 60,
    )
    session.add(db_delito)
    await session.commit()
    return {"message": "Delito creado", "id": str(db_delito.id)}

@api_router.put("/delitos/{delito_id}")
async def actualizar_delito(delito_id: str, delito: DelitoUpdate, session: AsyncSession = Depends(get_db)):
    """Actualiza un delito existente"""
    try:
        db_delito = await session.get(DelitoDB, uuid.UUID(delito_id))
    except ValueError:
        raise HTTPException(status_code=400, detail="ID de delito inválido")

    if not db_delito:
        raise HTTPException(status_code=404, detail="Delito no encontrado")

    update_data = {k: v for k, v in delito.model_dump().items() if v is not None}
    if not update_data:
        raise HTTPException(status_code=400, detail="No hay datos para actualizar")

    if "pena_maxima_meses" in update_data:
        update_data["es_grave"] = update_data["pena_maxima_meses"] >= 60
    update_data["actualizado_en"] = datetime.now(timezone.utc)

    for key, value in update_data.items():
        setattr(db_delito, key, value)

    await session.commit()
    return {"message": "Delito actualizado"}

@api_router.delete("/delitos/{delito_id}")
async def eliminar_delito(delito_id: str, session: AsyncSession = Depends(get_db)):
    """Elimina un delito"""
    try:
        db_delito = await session.get(DelitoDB, uuid.UUID(delito_id))
    except ValueError:
        raise HTTPException(status_code=400, detail="ID de delito inválido")

    if not db_delito:
        raise HTTPException(status_code=404, detail="Delito no encontrado")

    await session.delete(db_delito)
    await session.commit()
    return {"message": "Delito eliminado"}

@api_router.get("/clasificaciones")
async def listar_clasificaciones(session: AsyncSession = Depends(get_db)):
    """Lista todas las clasificaciones de delitos"""
    stmt = select(DelitoDB.clasificacion, func.count(DelitoDB.id).label("cantidad")).where(
        DelitoDB.clasificacion.isnot(None)
    ).group_by(DelitoDB.clasificacion).order_by(DelitoDB.clasificacion)

    result = await session.execute(stmt)
    rows = result.all()
    return [{"nombre": row.clasificacion, "cantidad": row.cantidad} for row in rows]

# =============================================
# ENDPOINTS DE CIRCUNSTANCIAS
# =============================================

@api_router.get("/agravantes")
async def listar_agravantes():
    return AGRAVANTES

@api_router.get("/atenuantes")
async def listar_atenuantes():
    return ATENUANTES

@api_router.get("/eximentes")
async def listar_eximentes():
    return EXIMENTES

@api_router.get("/grados-autoria")
async def listar_grados_autoria():
    return GRADOS_AUTORIA

@api_router.get("/grados-ejecucion")
async def listar_grados_ejecucion():
    return GRADOS_EJECUCION

@api_router.get("/tipos-concurso")
async def listar_tipos_concurso():
    return TIPOS_CONCURSO

# =============================================
# CÁLCULO DE PENAS
# =============================================

async def calcular_pena_individual(config: DelitoConfig, session: AsyncSession) -> dict:
    """Calcula la pena individual para un delito"""
    try:
        delito = await session.get(DelitoDB, uuid.UUID(config.delito_id))
    except ValueError:
        raise HTTPException(status_code=400, detail=f"ID de delito inválido: {config.delito_id}")

    if not delito:
        raise HTTPException(status_code=404, detail=f"Delito {config.delito_id} no encontrado")
    
    # Pena base
    if config.pena_seleccionada == TipoPena.PRISION:
        pena_min = delito.pena_minima_meses
        pena_max = delito.pena_maxima_meses
        tipo_pena = "prisión"
    else:
        pena_min = delito.pena_alternativa_min or 0
        pena_max = delito.pena_alternativa_max or 0
        tipo_pena = "multa"
    
    pena_base_min, pena_base_max = pena_min, pena_max
    
    # Verificar eximente completa
    if config.eximente_completa:
        return {
            "delito": {
                "id": str(delito.id),
                "nombre": delito.nombre,
                "articulo": delito.articulo,
                "clasificacion": delito.clasificacion,
                "penas_accesorias": delito.penas_accesorias or [],
            },
            "pena_min": 0,
            "pena_max": 0,
            "tipo_pena": tipo_pena,
            "exento": True,
            "pena_base_min": pena_base_min,
            "pena_base_max": pena_base_max,
            "modificaciones": ["Eximente completa aplicada - EXENTO"]
        }
    
    modificaciones = []
    
    # 1. AUTORÍA (Art. 28-29 CP)
    if config.grado_autoria == GradoAutoria.COMPLICE:
        pena_min, pena_max = reducir_grado(pena_min, pena_max, 1)
        modificaciones.append("Cómplice: pena inferior en 1 grado (Art. 29 CP)")
    
    # 2. EJECUCIÓN (Art. 16, 62 CP)
    if config.grado_ejecucion in [GradoEjecucion.TENTATIVA_ACABADA, GradoEjecucion.TENTATIVA_INACABADA]:
        pena_min, pena_max = reducir_grado(pena_min, pena_max, config.reduccion_tentativa)
        modificaciones.append(f"Tentativa: pena inferior en {config.reduccion_tentativa} grado(s) (Art. 62 CP)")
    
    # 3. EXIMENTES INCOMPLETAS (Art. 26.1 CP)
    for ex_id in config.eximentes:
        ex = next((e for e in EXIMENTES if e["id"] == ex_id), None)
        if ex and not ex.get("completa", True):
            pena_min, pena_max = reducir_grado(pena_min, pena_max, 1)
            modificaciones.append(f"Eximente incompleta: pena inferior en 1 grado")
    
    # 4. ATENUANTES (Art. 26 CP)
    if len(config.atenuantes) >= 2:
        pena_min, pena_max = reducir_grado(pena_min, pena_max, 1)
        modificaciones.append("2+ atenuantes: pena inferior en 1 grado")
    elif len(config.atenuantes) == 1:
        pena_min, pena_max = aplicar_mitad_inferior(pena_min, pena_max)
        modificaciones.append("1 atenuante: pena en mitad inferior")
    
    # 5. AGRAVANTES (Art. 27 CP)
    if len(config.agravantes) >= 2:
        pena_min, pena_max = aumentar_grado(pena_min, pena_max, 1)
        modificaciones.append("2+ agravantes: pena superior en 1 grado")
    elif len(config.agravantes) == 1:
        pena_min, pena_max = aplicar_mitad_superior(pena_min, pena_max)
        modificaciones.append("1 agravante: pena en mitad superior")
    
    return {
        "delito": {
            "id": str(delito.id),
            "nombre": delito.nombre,
            "articulo": delito.articulo,
            "clasificacion": delito.clasificacion,
            "penas_accesorias": delito.penas_accesorias or [],
        },
        "pena_min": max(1, pena_min),
        "pena_max": max(1, pena_max),
        "tipo_pena": tipo_pena,
        "exento": False,
        "pena_base_min": pena_base_min,
        "pena_base_max": pena_base_max,
        "modificaciones": modificaciones
    }

def aplicar_concurso(penas: List[dict], tipo_concurso: TipoConcurso) -> dict:
    """Aplica las reglas de concurso según CP Honduras"""
    
    penas_activas = [p for p in penas if not p.get("exento", False)]
    
    if len(penas_activas) == 0:
        return {"pena_min": 0, "pena_max": 0, "descripcion": "Todos los delitos exentos", "articulo": ""}
    
    if len(penas_activas) == 1 or tipo_concurso == TipoConcurso.NINGUNO:
        return {
            "pena_min": penas_activas[0]["pena_min"],
            "pena_max": penas_activas[0]["pena_max"],
            "descripcion": "Delito único - se aplica pena individual",
            "articulo": ""
        }
    
    if tipo_concurso == TipoConcurso.REAL:
        # Art. 37 CP Honduras: Acumulación material con límites
        total_min = sum(p["pena_min"] for p in penas_activas)
        total_max = sum(p["pena_max"] for p in penas_activas)
        
        # Límite: triple de la pena más grave, máximo 40 años (480 meses)
        pena_mayor = max(p["pena_max"] for p in penas_activas)
        limite = min(pena_mayor * 3, 480)
        
        total_max = min(total_max, limite)
        total_min = min(total_min, total_max)
        
        return {
            "pena_min": total_min,
            "pena_max": total_max,
            "descripcion": f"Concurso Real (Art. 37 CP): Se acumulan las penas. Límite: triple de la mayor o 40 años.",
            "articulo": "Art. 37 CP"
        }
    
    elif tipo_concurso == TipoConcurso.IDEAL:
        # Art. 36 CP Honduras: Pena del más grave en mitad superior
        delito_mas_grave = max(penas_activas, key=lambda p: p["pena_max"])
        pena_min, pena_max = aplicar_mitad_superior(
            delito_mas_grave["pena_min"],
            delito_mas_grave["pena_max"]
        )
        return {
            "pena_min": pena_min,
            "pena_max": pena_max,
            "descripcion": "Concurso Ideal (Art. 36 CP): Un hecho, varios delitos. Pena del más grave en mitad superior.",
            "articulo": "Art. 36 CP"
        }
    
    elif tipo_concurso == TipoConcurso.MEDIAL:
        # Art. 36.2 CP Honduras: Pena superior en grado
        delito_mas_grave = max(penas_activas, key=lambda p: p["pena_max"])
        pena_min, pena_max = aumentar_grado(
            delito_mas_grave["pena_min"],
            delito_mas_grave["pena_max"]
        )
        return {
            "pena_min": pena_min,
            "pena_max": pena_max,
            "descripcion": "Concurso Medial (Art. 36.2 CP): Delito medio para cometer otro. Pena superior en grado.",
            "articulo": "Art. 36.2 CP"
        }
    
    elif tipo_concurso == TipoConcurso.CONTINUADO:
        # Art. 35 CP Honduras: Delito continuado
        delito_mas_grave = max(penas_activas, key=lambda p: p["pena_max"])
        # Se aplica la pena del tipo más grave pudiendo llegar hasta el máximo
        pena_min = delito_mas_grave["pena_min"]
        pena_max = delito_mas_grave["pena_max"]
        pena_min, pena_max = aplicar_mitad_superior(pena_min, pena_max)
        
        return {
            "pena_min": pena_min,
            "pena_max": pena_max,
            "descripcion": "Delito Continuado (Art. 35 CP): Pluralidad de acciones con misma finalidad. Pena en mitad superior.",
            "articulo": "Art. 35 CP"
        }
    
    return {"pena_min": 0, "pena_max": 0, "descripcion": "Tipo de concurso no reconocido", "articulo": ""}

@api_router.post("/calcular")
async def calcular_pena(request: CalculoRequest, session: AsyncSession = Depends(get_db)):
    """Calcula la pena total según el flujo completo"""
    
    resultados_individuales = []
    penas_para_concurso = []
    todas_penas_accesorias = []
    
    for config in request.delitos:
        resultado = await calcular_pena_individual(config, session)
        penas_para_concurso.append(resultado)
        
        delito = resultado["delito"]
        penas_accesorias_delito = delito.get("penas_accesorias", [])
        
        if not resultado["exento"]:
            todas_penas_accesorias.extend(penas_accesorias_delito)
        
        # Agravantes y atenuantes nombres
        agravantes_nombres = [next((a["nombre"] for a in AGRAVANTES if a["id"] == aid), aid) for aid in config.agravantes]
        atenuantes_nombres = [next((a["nombre"] for a in ATENUANTES if a["id"] == aid), aid) for aid in config.atenuantes]
        
        if resultado["exento"]:
            pena_texto = "EXENTO (eximente completa)"
        else:
            pena_texto = f"{meses_a_texto(resultado['pena_min'])} a {meses_a_texto(resultado['pena_max'])} de {resultado['tipo_pena']}"
        
        grado_autoria_nombre = next((g["nombre"] for g in GRADOS_AUTORIA if g["id"] == config.grado_autoria.value), config.grado_autoria.value)
        grado_ejecucion_nombre = next((g["nombre"] for g in GRADOS_EJECUCION if g["id"] == config.grado_ejecucion.value), config.grado_ejecucion.value)
        
        resultados_individuales.append({
            "delito_id": str(delito["id"]),
            "nombre": delito["nombre"],
            "articulo": delito["articulo"],
            "clasificacion": delito.get("clasificacion", ""),
            "pena_base_min": resultado["pena_base_min"],
            "pena_base_max": resultado["pena_base_max"],
            "pena_base_texto": f"{meses_a_texto(resultado['pena_base_min'])} a {meses_a_texto(resultado['pena_base_max'])}",
            "pena_individual_min": resultado["pena_min"],
            "pena_individual_max": resultado["pena_max"],
            "pena_individual_texto": pena_texto,
            "grado_autoria": grado_autoria_nombre,
            "grado_ejecucion": grado_ejecucion_nombre,
            "agravantes_aplicadas": agravantes_nombres,
            "atenuantes_aplicadas": atenuantes_nombres,
            "penas_accesorias": penas_accesorias_delito,
            "modificaciones": resultado.get("modificaciones", []),
            "exento": resultado["exento"]
        })
    
    # Aplicar concurso
    resultado_concurso = aplicar_concurso(penas_para_concurso, request.tipo_concurso)
    
    # Pena principal texto
    if resultado_concurso["pena_max"] == 0:
        pena_principal_texto = "EXENTO"
    else:
        pena_principal_texto = f"{meses_a_texto(resultado_concurso['pena_min'])} a {meses_a_texto(resultado_concurso['pena_max'])} de prisión"
    
    # Análisis jurídico
    analisis_juridico = generar_analisis_juridico(resultados_individuales, request.tipo_concurso, resultado_concurso)
    
    return {
        "delitos_analizados": resultados_individuales,
        "tipo_concurso": request.tipo_concurso.value if request.tipo_concurso != TipoConcurso.NINGUNO else "ninguno",
        "concurso_descripcion": resultado_concurso["descripcion"],
        "concurso_articulo": resultado_concurso.get("articulo", ""),
        "pena_principal": pena_principal_texto,
        "pena_principal_minimo_meses": resultado_concurso["pena_min"],
        "pena_principal_maximo_meses": resultado_concurso["pena_max"],
        "penas_accesorias": list(set(todas_penas_accesorias)),
        "analisis_juridico": analisis_juridico,
        "fecha": datetime.now().strftime("%d/%m/%Y %H:%M"),
        "disclaimer": "Este cálculo es orientativo y no sustituye la función jurisdiccional. La determinación definitiva de la pena corresponde exclusivamente a los tribunales de justicia de Honduras."
    }

def generar_analisis_juridico(delitos, tipo_concurso, resultado_concurso) -> str:
    """Genera análisis jurídico detallado"""
    lineas = []
    lineas.append("═" * 50)
    lineas.append("ANÁLISIS JURÍDICO DEL CÁLCULO DE PENA")
    lineas.append("Código Penal de Honduras (Decreto 130-2017)")
    lineas.append("═" * 50)
    lineas.append(f"\nFecha: {datetime.now().strftime('%d/%m/%Y %H:%M')}")
    lineas.append(f"Total de delitos analizados: {len(delitos)}")
    
    for i, d in enumerate(delitos, 1):
        lineas.append(f"\n{'─' * 40}")
        lineas.append(f"DELITO {i}: {d['nombre'].upper()}")
        lineas.append(f"{'─' * 40}")
        lineas.append(f"• Artículo: {d['articulo']}")
        lineas.append(f"• Clasificación: {d['clasificacion']}")
        lineas.append(f"• Pena base: {d['pena_base_texto']}")
        lineas.append(f"• Grado de autoría: {d['grado_autoria']}")
        lineas.append(f"• Grado de ejecución: {d['grado_ejecucion']}")
        
        if d['modificaciones']:
            lineas.append("\nModificaciones aplicadas:")
            for mod in d['modificaciones']:
                lineas.append(f"  → {mod}")
        
        if d['agravantes_aplicadas']:
            lineas.append(f"\nAgravantes (Art. 27 CP): {', '.join(d['agravantes_aplicadas'])}")
        if d['atenuantes_aplicadas']:
            lineas.append(f"Atenuantes (Art. 26 CP): {', '.join(d['atenuantes_aplicadas'])}")
        
        lineas.append(f"\n★ PENA INDIVIDUAL: {d['pena_individual_texto']}")
        
        if d['penas_accesorias']:
            lineas.append(f"\nPenas accesorias: {', '.join(d['penas_accesorias'])}")
    
    if len(delitos) > 1 and tipo_concurso != TipoConcurso.NINGUNO:
        lineas.append(f"\n{'═' * 50}")
        lineas.append("CONCURSO DE DELITOS")
        lineas.append(f"{'═' * 50}")
        lineas.append(f"Tipo: {tipo_concurso.value.upper()}")
        lineas.append(f"Base legal: {resultado_concurso.get('articulo', '')}")
        lineas.append(f"Efecto: {resultado_concurso['descripcion']}")
    
    return "\n".join(lineas)

# =============================================
# SEED DATA - POBLAR BASE DE DATOS
# =============================================

@api_router.post("/seed")
async def seed_database(session: AsyncSession = Depends(get_db)):
    """Pobla la base de datos con los delitos del CP Honduras"""
    
    # Verificar si ya hay datos
    result = await session.execute(select(func.count(DelitoDB.id)))
    count = result.scalar()
    if count and count > 0:
        return {"message": f"Base de datos ya tiene {count} delitos", "seeded": False}
    
    # Lista de delitos basada en los datos proporcionados
    delitos_seed = [
        {"nombre": "Abandono de animales", "articulo": "Art. 342 CP", "conducta": "Abandonar animales bajo custodia poniendo en riesgo su vida o integridad", "clasificacion": "Delitos contra el bienestar animal", "pena_minima_meses": 6, "pena_maxima_meses": 24, "penas_accesorias": ["Inhabilitación para la tenencia de animales"]},
        {"nombre": "Abandono de funciones públicas", "articulo": "Art. 500 CP", "conducta": "Abandonar injustificadamente un cargo o función pública", "clasificacion": "Delitos contra la administración pública", "pena_minima_meses": 12, "pena_maxima_meses": 36, "penas_accesorias": ["Inhabilitación especial"]},
        {"nombre": "Abandono de menores o personas vulnerables", "articulo": "Art. 228 CP", "conducta": "Abandonar a persona menor de edad, con discapacidad, anciana o enferma", "clasificacion": "Trata de personas y explotación humana", "pena_minima_meses": 36, "pena_maxima_meses": 72, "penas_accesorias": []},
        {"nombre": "Aborto", "articulo": "Art. 196 CP", "conducta": "Provocar aborto fuera de los supuestos legales", "clasificacion": "Delitos contra la vida", "pena_minima_meses": 36, "pena_maxima_meses": 72, "penas_accesorias": []},
        {"nombre": "Abuso de autoridad", "articulo": "Art. 499 CP", "conducta": "Ejercer arbitrariamente funciones públicas causando perjuicio", "clasificacion": "Delitos contra la administración pública", "pena_minima_meses": 24, "pena_maxima_meses": 60, "penas_accesorias": ["Inhabilitación especial"]},
        {"nombre": "Abuso de dispositivos informáticos", "articulo": "Art. 400 CP", "conducta": "Uso indebido de dispositivos o credenciales informáticas", "clasificacion": "Seguridad informática", "pena_minima_meses": 12, "pena_maxima_meses": 36, "penas_accesorias": ["Multa"]},
        {"nombre": "Acceso no autorizado a sistemas informáticos", "articulo": "Art. 398 CP", "conducta": "Acceso sin autorización a sistemas protegidos", "clasificacion": "Seguridad informática", "pena_minima_meses": 12, "pena_maxima_meses": 36, "penas_accesorias": []},
        {"nombre": "Acoso laboral", "articulo": "Art. 294 CP", "conducta": "Hostigamiento laboral desde posición de superioridad", "clasificacion": "Derechos laborales", "pena_minima_meses": 12, "pena_maxima_meses": 36, "penas_accesorias": ["Inhabilitación"]},
        {"nombre": "Allanamiento de domicilio", "articulo": "Art. 270 CP", "conducta": "Entrar o permanecer en domicilio ajeno sin autorización", "clasificacion": "Inviolabilidad domiciliaria", "pena_minima_meses": 12, "pena_maxima_meses": 36, "penas_accesorias": []},
        {"nombre": "Amenazas", "articulo": "Art. 246 CP", "conducta": "Anunciar la causación de un mal grave e ilícito", "clasificacion": "Delitos contra la libertad", "pena_minima_meses": 12, "pena_maxima_meses": 36, "penas_accesorias": []},
        {"nombre": "Asesinato", "articulo": "Art. 193 CP", "conducta": "Dar muerte a otro concurriendo circunstancias agravantes", "clasificacion": "Delitos contra la vida", "pena_minima_meses": 240, "pena_maxima_meses": 360, "penas_accesorias": []},
        {"nombre": "Asociación para delinquir", "articulo": "Art. 554 CP", "conducta": "Integrar asociación estable para cometer delitos", "clasificacion": "Criminalidad organizada", "pena_minima_meses": 36, "pena_maxima_meses": 72, "penas_accesorias": []},
        {"nombre": "Asociación terrorista", "articulo": "Art. 587 CP", "conducta": "Formar parte de organización terrorista", "clasificacion": "Terrorismo", "pena_minima_meses": 120, "pena_maxima_meses": 180, "penas_accesorias": []},
        {"nombre": "Calumnia", "articulo": "Art. 230 CP", "conducta": "Imputar falsamente delito a una persona", "clasificacion": "Delitos contra el honor", "pena_minima_meses": 6, "pena_maxima_meses": 12, "tiene_pena_alternativa": True, "pena_alternativa_min": 6, "pena_alternativa_max": 12, "penas_accesorias": []},
        {"nombre": "Chantaje", "articulo": "Art. 247 CP", "conducta": "Amenazar para obtener beneficio indebido", "clasificacion": "Delitos contra la libertad", "pena_minima_meses": 36, "pena_maxima_meses": 72, "penas_accesorias": []},
        {"nombre": "Coacción", "articulo": "Art. 245 CP", "conducta": "Obligar a otro mediante violencia o intimidación", "clasificacion": "Delitos contra la libertad", "pena_minima_meses": 12, "pena_maxima_meses": 36, "penas_accesorias": []},
        {"nombre": "Cohecho propio", "articulo": "Art. 492 CP", "conducta": "Solicitar dádivas para realizar u omitir acto del cargo", "clasificacion": "Delitos contra la administración pública", "pena_minima_meses": 72, "pena_maxima_meses": 120, "penas_accesorias": ["Inhabilitación absoluta"]},
        {"nombre": "Concusión", "articulo": "Art. 497 CP", "conducta": "Exigir ventajas abusando del cargo público", "clasificacion": "Delitos contra la administración pública", "pena_minima_meses": 72, "pena_maxima_meses": 120, "penas_accesorias": ["Inhabilitación"]},
        {"nombre": "Conducción temeraria", "articulo": "Art. 323 CP", "conducta": "Conducir poniendo en peligro grave la seguridad vial", "clasificacion": "Seguridad vial", "pena_minima_meses": 6, "pena_maxima_meses": 24, "penas_accesorias": ["Privación del derecho a conducir"]},
        {"nombre": "Contaminación ambiental", "articulo": "Art. 324 CP", "conducta": "Contaminar aguas, suelos o aire causando daño ambiental", "clasificacion": "Delitos contra el medio ambiente", "pena_minima_meses": 48, "pena_maxima_meses": 96, "penas_accesorias": ["Multa"]},
        {"nombre": "Contrabando", "articulo": "Art. 428 CP", "conducta": "Introducir o extraer mercancías eludiendo controles aduaneros", "clasificacion": "Hacienda pública", "pena_minima_meses": 60, "pena_maxima_meses": 120, "penas_accesorias": ["Multa proporcional"]},
        {"nombre": "Crimen de lesa humanidad", "articulo": "Art. 139 CP", "conducta": "Cometer actos inhumanos de forma sistemática o generalizada", "clasificacion": "Comunidad internacional", "pena_minima_meses": 240, "pena_maxima_meses": 360, "penas_accesorias": []},
        {"nombre": "Daños", "articulo": "Art. 381 CP", "conducta": "Dañar bienes ajenos sin agravantes", "clasificacion": "Delitos contra el patrimonio", "pena_minima_meses": 12, "pena_maxima_meses": 36, "penas_accesorias": []},
        {"nombre": "Daños agravados", "articulo": "Art. 382 CP", "conducta": "Dañar bienes concurriendo circunstancias agravantes", "clasificacion": "Delitos contra el patrimonio", "pena_minima_meses": 36, "pena_maxima_meses": 72, "penas_accesorias": []},
        {"nombre": "Defraudación fiscal", "articulo": "Art. 431 CP", "conducta": "Eludir impuestos mediante engaño o simulación", "clasificacion": "Hacienda pública", "pena_minima_meses": 60, "pena_maxima_meses": 120, "penas_accesorias": ["Multa proporcional"]},
        {"nombre": "Desaparición forzada", "articulo": "Art. 140 CP", "conducta": "Privar de libertad y ocultar paradero de la víctima", "clasificacion": "Comunidad internacional", "pena_minima_meses": 240, "pena_maxima_meses": 300, "penas_accesorias": []},
        {"nombre": "Enriquecimiento ilícito", "articulo": "Art. 484 CP", "conducta": "Incrementar patrimonio injustificadamente como funcionario", "clasificacion": "Delitos contra la administración pública", "pena_minima_meses": 96, "pena_maxima_meses": 144, "penas_accesorias": ["Inhabilitación absoluta"]},
        {"nombre": "Espionaje", "articulo": "Art. 563 CP", "conducta": "Obtener o revelar información que afecte la seguridad del Estado", "clasificacion": "Seguridad del Estado", "pena_minima_meses": 180, "pena_maxima_meses": 240, "penas_accesorias": []},
        {"nombre": "Estafa", "articulo": "Art. 365 CP", "conducta": "Obtener beneficio patrimonial mediante engaño", "clasificacion": "Delitos contra el patrimonio", "pena_minima_meses": 24, "pena_maxima_meses": 60, "penas_accesorias": []},
        {"nombre": "Estafa agravada", "articulo": "Art. 366 CP", "conducta": "Estafa con agravantes legales", "clasificacion": "Delitos contra el patrimonio", "pena_minima_meses": 60, "pena_maxima_meses": 120, "penas_accesorias": []},
        {"nombre": "Estragos", "articulo": "Art. 185 CP", "conducta": "Provocar incendio, explosión u otros estragos", "clasificacion": "Seguridad colectiva", "pena_minima_meses": 120, "pena_maxima_meses": 240, "penas_accesorias": []},
        {"nombre": "Estupro", "articulo": "Art. 254 CP", "conducta": "Acceso carnal con menor mediante engaño", "clasificacion": "Libertad e indemnidad sexual", "pena_minima_meses": 72, "pena_maxima_meses": 120, "penas_accesorias": []},
        {"nombre": "Extorsión", "articulo": "Art. 373 CP", "conducta": "Obligar a otro a realizar u omitir actos mediante intimidación", "clasificacion": "Delitos contra el patrimonio", "pena_minima_meses": 72, "pena_maxima_meses": 120, "penas_accesorias": []},
        {"nombre": "Extorsión agravada", "articulo": "Art. 374 CP", "conducta": "Extorsión con agravantes", "clasificacion": "Delitos contra el patrimonio", "pena_minima_meses": 120, "pena_maxima_meses": 180, "penas_accesorias": []},
        {"nombre": "Falsificación de documentos públicos", "articulo": "Art. 456 CP", "conducta": "Falsificar documentos públicos o mercantiles", "clasificacion": "Delitos contra la fe pública", "pena_minima_meses": 72, "pena_maxima_meses": 120, "penas_accesorias": []},
        {"nombre": "Falsificación de moneda", "articulo": "Art. 447 CP", "conducta": "Falsificar moneda nacional o extranjera", "clasificacion": "Delitos contra la fe pública", "pena_minima_meses": 120, "pena_maxima_meses": 180, "penas_accesorias": []},
        {"nombre": "Falso testimonio", "articulo": "Art. 519 CP", "conducta": "Declarar falsamente como testigo en proceso judicial", "clasificacion": "Administración de justicia", "pena_minima_meses": 36, "pena_maxima_meses": 72, "penas_accesorias": []},
        {"nombre": "Femicidio", "articulo": "Art. 208 CP", "conducta": "Dar muerte a una mujer por razones de género", "clasificacion": "Violencia contra la mujer", "pena_minima_meses": 360, "pena_maxima_meses": 480, "penas_accesorias": []},
        {"nombre": "Fraude informático", "articulo": "Art. 368 CP", "conducta": "Obtener beneficio mediante manipulación informática", "clasificacion": "Delitos contra el patrimonio", "pena_minima_meses": 48, "pena_maxima_meses": 96, "penas_accesorias": []},
        {"nombre": "Genocidio", "articulo": "Art. 143 CP", "conducta": "Destruir total o parcialmente grupo protegido", "clasificacion": "Comunidad internacional", "pena_minima_meses": 360, "pena_maxima_meses": 480, "penas_accesorias": []},
        {"nombre": "Homicidio", "articulo": "Art. 192 CP", "conducta": "Dar muerte a otra persona", "clasificacion": "Delitos contra la vida", "pena_minima_meses": 180, "pena_maxima_meses": 240, "penas_accesorias": []},
        {"nombre": "Homicidio imprudente", "articulo": "Art. 198 CP", "conducta": "Causar muerte por imprudencia grave", "clasificacion": "Delitos contra la vida", "pena_minima_meses": 48, "pena_maxima_meses": 84, "penas_accesorias": []},
        {"nombre": "Hostigamiento sexual", "articulo": "Art. 256 CP", "conducta": "Solicitar favores sexuales generando situación intimidatoria", "clasificacion": "Libertad e indemnidad sexual", "pena_minima_meses": 24, "pena_maxima_meses": 48, "penas_accesorias": []},
        {"nombre": "Hurto", "articulo": "Art. 357 CP", "conducta": "Apoderarse de cosa mueble ajena sin violencia ni fuerza", "clasificacion": "Delitos contra el patrimonio", "pena_minima_meses": 12, "pena_maxima_meses": 36, "penas_accesorias": []},
        {"nombre": "Hurto agravado", "articulo": "Art. 363 CP", "conducta": "Apoderarse de cosa ajena con agravantes", "clasificacion": "Delitos contra el patrimonio", "pena_minima_meses": 36, "pena_maxima_meses": 72, "penas_accesorias": []},
        {"nombre": "Incendio", "articulo": "Art. 183 CP", "conducta": "Provocar incendio sin circunstancias cualificadas", "clasificacion": "Seguridad colectiva", "pena_minima_meses": 96, "pena_maxima_meses": 144, "penas_accesorias": []},
        {"nombre": "Incendio forestal", "articulo": "Art. 327 CP", "conducta": "Provocar incendio en zonas forestales", "clasificacion": "Delitos contra el medio ambiente", "pena_minima_meses": 72, "pena_maxima_meses": 120, "penas_accesorias": ["Multa"]},
        {"nombre": "Injuria", "articulo": "Art. 229 CP", "conducta": "Proferir expresiones que lesionen la dignidad de otro", "clasificacion": "Delitos contra el honor", "pena_minima_meses": 0, "pena_maxima_meses": 0, "tiene_pena_alternativa": True, "pena_alternativa_min": 3, "pena_alternativa_max": 6, "penas_accesorias": []},
        {"nombre": "Lavado de activos", "articulo": "Art. 439 CP", "conducta": "Ocultar o encubrir bienes de origen ilícito", "clasificacion": "Receptación y lavado de activos", "pena_minima_meses": 96, "pena_maxima_meses": 144, "penas_accesorias": ["Multa"]},
        {"nombre": "Lesiones", "articulo": "Art. 199 CP", "conducta": "Causar lesiones sin gravedad extrema", "clasificacion": "Delitos contra la vida", "pena_minima_meses": 24, "pena_maxima_meses": 60, "penas_accesorias": []},
        {"nombre": "Lesiones graves", "articulo": "Art. 201 CP", "conducta": "Causar lesiones graves a otra persona", "clasificacion": "Delitos contra la vida", "pena_minima_meses": 72, "pena_maxima_meses": 120, "penas_accesorias": []},
        {"nombre": "Maltrato habitual", "articulo": "Art. 209 CP", "conducta": "Maltratar de forma habitual a integrante del núcleo familiar", "clasificacion": "Violencia doméstica", "pena_minima_meses": 36, "pena_maxima_meses": 72, "penas_accesorias": ["Prohibición de aproximación"]},
        {"nombre": "Malversación de caudales públicos", "articulo": "Art. 481 CP", "conducta": "Sustraer o dar uso indebido a fondos públicos", "clasificacion": "Delitos contra la administración pública", "pena_minima_meses": 96, "pena_maxima_meses": 144, "penas_accesorias": ["Inhabilitación absoluta"]},
        {"nombre": "Omisión del deber de socorro", "articulo": "Art. 216 CP", "conducta": "No auxiliar a persona en peligro grave", "clasificacion": "Derechos fundamentales", "pena_minima_meses": 6, "pena_maxima_meses": 36, "penas_accesorias": []},
        {"nombre": "Organización criminal", "articulo": "Art. 554 CP", "conducta": "Dirigir u organizar estructura criminal estable", "clasificacion": "Criminalidad organizada", "pena_minima_meses": 72, "pena_maxima_meses": 120, "penas_accesorias": []},
        {"nombre": "Parricidio", "articulo": "Art. 204 CP", "conducta": "Dar muerte a ascendiente o descendiente", "clasificacion": "Delitos contra la vida", "pena_minima_meses": 300, "pena_maxima_meses": 360, "penas_accesorias": []},
        {"nombre": "Peculado", "articulo": "Art. 480 CP", "conducta": "Apropiarse de bienes públicos", "clasificacion": "Delitos contra la administración pública", "pena_minima_meses": 96, "pena_maxima_meses": 144, "penas_accesorias": ["Inhabilitación absoluta"]},
        {"nombre": "Pedofilia", "articulo": "Art. 250 CP", "conducta": "Actos sexuales con menores impúberes", "clasificacion": "Libertad e indemnidad sexual", "pena_minima_meses": 180, "pena_maxima_meses": 240, "penas_accesorias": []},
        {"nombre": "Piratería", "articulo": "Art. 165 CP", "conducta": "Actos de violencia o saqueo en alta mar", "clasificacion": "Derecho de gentes", "pena_minima_meses": 240, "pena_maxima_meses": 360, "penas_accesorias": []},
        {"nombre": "Pornografía infantil", "articulo": "Art. 261 CP", "conducta": "Producir, difundir o poseer material pornográfico infantil", "clasificacion": "Libertad e indemnidad sexual", "pena_minima_meses": 96, "pena_maxima_meses": 144, "penas_accesorias": []},
        {"nombre": "Portación ilegal de armas", "articulo": "Art. 584 CP", "conducta": "Portar armas de fuego sin autorización legal", "clasificacion": "Orden público", "pena_minima_meses": 36, "pena_maxima_meses": 72, "penas_accesorias": []},
        {"nombre": "Prevaricato judicial", "articulo": "Art. 516 CP", "conducta": "Dictar resolución injusta a sabiendas", "clasificacion": "Administración de justicia", "pena_minima_meses": 72, "pena_maxima_meses": 120, "penas_accesorias": ["Inhabilitación absoluta"]},
        {"nombre": "Producción ilícita de drogas", "articulo": "Art. 317 CP", "conducta": "Producir sustancias estupefacientes ilícitas", "clasificacion": "Delitos contra la salud pública", "pena_minima_meses": 96, "pena_maxima_meses": 144, "penas_accesorias": []},
        {"nombre": "Proxenetismo", "articulo": "Art. 262 CP", "conducta": "Facilitar o promover la prostitución ajena", "clasificacion": "Libertad e indemnidad sexual", "pena_minima_meses": 60, "pena_maxima_meses": 96, "penas_accesorias": []},
        {"nombre": "Rebelión", "articulo": "Art. 532 CP", "conducta": "Alzarse violentamente contra el orden constitucional", "clasificacion": "Delitos contra la Constitución", "pena_minima_meses": 180, "pena_maxima_meses": 240, "penas_accesorias": []},
        {"nombre": "Receptación", "articulo": "Art. 406 CP", "conducta": "Recibir bienes provenientes de delito", "clasificacion": "Delitos contra el patrimonio", "pena_minima_meses": 24, "pena_maxima_meses": 60, "penas_accesorias": []},
        {"nombre": "Robo", "articulo": "Art. 360 CP", "conducta": "Apoderarse de cosa ajena con violencia o intimidación", "clasificacion": "Delitos contra el patrimonio", "pena_minima_meses": 72, "pena_maxima_meses": 120, "penas_accesorias": []},
        {"nombre": "Robo agravado", "articulo": "Art. 361 CP", "conducta": "Robo con armas, en banda o con lesiones", "clasificacion": "Delitos contra el patrimonio", "pena_minima_meses": 120, "pena_maxima_meses": 180, "penas_accesorias": []},
        {"nombre": "Secuestro", "articulo": "Art. 240 CP", "conducta": "Privar de libertad con fines ilícitos", "clasificacion": "Delitos contra la libertad", "pena_minima_meses": 180, "pena_maxima_meses": 300, "penas_accesorias": []},
        {"nombre": "Secuestro agravado", "articulo": "Art. 241 CP", "conducta": "Secuestro con muerte, tortura o víctimas vulnerables", "clasificacion": "Delitos contra la libertad", "pena_minima_meses": 300, "pena_maxima_meses": 360, "penas_accesorias": []},
        {"nombre": "Sedición", "articulo": "Art. 535 CP", "conducta": "Alzamiento colectivo contra la autoridad", "clasificacion": "Delitos contra la Constitución", "pena_minima_meses": 60, "pena_maxima_meses": 120, "penas_accesorias": []},
        {"nombre": "Sustracción de menor", "articulo": "Art. 283 CP", "conducta": "Sustraer menor del cuidado legítimo", "clasificacion": "Delitos contra la familia", "pena_minima_meses": 48, "pena_maxima_meses": 96, "penas_accesorias": []},
        {"nombre": "Terrorismo", "articulo": "Art. 589 CP", "conducta": "Ejecutar actos terroristas", "clasificacion": "Terrorismo", "pena_minima_meses": 240, "pena_maxima_meses": 360, "penas_accesorias": []},
        {"nombre": "Tortura", "articulo": "Art. 209 CP", "conducta": "Infligir dolor grave físico o psicológico", "clasificacion": "Derechos humanos", "pena_minima_meses": 120, "pena_maxima_meses": 180, "penas_accesorias": []},
        {"nombre": "Tráfico de influencias", "articulo": "Art. 485 CP", "conducta": "Influir sobre funcionario para obtener beneficio", "clasificacion": "Delitos contra la administración pública", "pena_minima_meses": 36, "pena_maxima_meses": 72, "penas_accesorias": ["Inhabilitación"]},
        {"nombre": "Tráfico ilícito de drogas", "articulo": "Art. 316 CP", "conducta": "Comercializar sustancias estupefacientes ilícitas", "clasificacion": "Delitos contra la salud pública", "pena_minima_meses": 96, "pena_maxima_meses": 144, "penas_accesorias": []},
        {"nombre": "Tráfico ilícito de armas", "articulo": "Art. 582 CP", "conducta": "Comercializar armas sin autorización", "clasificacion": "Orden público", "pena_minima_meses": 96, "pena_maxima_meses": 144, "penas_accesorias": []},
        {"nombre": "Trata de personas", "articulo": "Art. 218 CP", "conducta": "Captar, trasladar o recibir personas con fines de explotación", "clasificacion": "Trata de personas", "pena_minima_meses": 120, "pena_maxima_meses": 180, "penas_accesorias": []},
        {"nombre": "Trata de personas agravada", "articulo": "Art. 219 CP", "conducta": "Trata de personas con menores o violencia", "clasificacion": "Trata de personas", "pena_minima_meses": 180, "pena_maxima_meses": 240, "penas_accesorias": []},
        {"nombre": "Usurpación", "articulo": "Art. 378 CP", "conducta": "Ocupar inmueble o derecho real ajeno", "clasificacion": "Delitos contra el patrimonio", "pena_minima_meses": 24, "pena_maxima_meses": 48, "penas_accesorias": []},
        {"nombre": "Violación", "articulo": "Art. 249 CP", "conducta": "Acceso carnal sin consentimiento mediante violencia o intimidación", "clasificacion": "Libertad e indemnidad sexual", "pena_minima_meses": 108, "pena_maxima_meses": 156, "penas_accesorias": []},
        {"nombre": "Violación agravada", "articulo": "Art. 250 CP", "conducta": "Violación con agravantes legales", "clasificacion": "Libertad e indemnidad sexual", "pena_minima_meses": 156, "pena_maxima_meses": 216, "penas_accesorias": []},
        {"nombre": "Violencia doméstica", "articulo": "Art. 209 CP", "conducta": "Ejercer violencia habitual en el ámbito doméstico", "clasificacion": "Violencia intrafamiliar", "pena_minima_meses": 36, "pena_maxima_meses": 72, "penas_accesorias": ["Medidas de protección"]},
    ]
    
    # Insertar usando SQLAlchemy
    db_objs = []
    for d in delitos_seed:
        db_objs.append(DelitoDB(
            nombre=d["nombre"],
            articulo=d["articulo"],
            conducta=d.get("conducta"),
            clasificacion=d.get("clasificacion"),
            pena_minima_meses=d["pena_minima_meses"],
            pena_maxima_meses=d["pena_maxima_meses"],
            tiene_pena_alternativa=d.get("tiene_pena_alternativa", False),
            pena_alternativa_min=d.get("pena_alternativa_min", 0),
            pena_alternativa_max=d.get("pena_alternativa_max", 0),
            penas_accesorias=d.get("penas_accesorias", []),
            observaciones=d.get("observaciones"),
            es_grave=d["pena_maxima_meses"] >= 60,
        ))
    
    session.add_all(db_objs)
    await session.commit()
    
    return {"message": f"Base de datos poblada con {len(delitos_seed)} delitos", "seeded": True}

# Include router and middleware
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

@app.on_event("startup")
async def startup_seed():
    """Crear tablas y sembrar BD si está vacía"""
    try:
        async with engine.begin() as conn:
            await conn.execute(text("CREATE EXTENSION IF NOT EXISTS vector"))
            await conn.run_sync(Base.metadata.create_all)
            logger.info("Tablas verificadas/creadas correctamente")

        async with async_session() as session:
            result = await session.execute(select(func.count(DelitoDB.id)))
            count = result.scalar()
            if not count or count == 0:
                logger.info("Base de datos vacía, ejecutando seed automático...")
                await seed_database(session)
            else:
                logger.info(f"Base de datos tiene {count} delitos")
    except Exception as e:
        logger.error(f"Error en startup: {e}")

@app.on_event("shutdown")
async def shutdown_db_client():
    await engine.dispose()
