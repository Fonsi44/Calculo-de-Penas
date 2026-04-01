from fastapi import FastAPI, APIRouter, Query, HTTPException
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field
from typing import List, Optional
import uuid
from datetime import datetime
from enum import Enum


ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Create the main app without a prefix
app = FastAPI(title="Calculadora de Penas - Honduras")

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")

# =============================================
# MODELOS
# =============================================

class TipoProcedimiento(str, Enum):
    ORDINARIO = "ordinario"
    ABREVIADO = "abreviado"
    ESPECIAL = "especial"

class Delito(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    nombre: str
    articulo: str
    categoria: str
    ley: str
    pena_minima_meses: int  # Pena mínima en meses
    pena_maxima_meses: int  # Pena máxima en meses
    descripcion: Optional[str] = None
    es_grave: bool = False
    permite_abreviado: bool = True
    requiere_procedimiento_especial: bool = False
    tipo_procedimiento_especial: Optional[str] = None

class CalculoPenaRequest(BaseModel):
    delito_id: str
    tiene_agravantes: bool = False
    tiene_atenuantes: bool = False
    es_reincidente: bool = False
    repara_dano: bool = False
    confiesa: bool = False
    agravantes_seleccionadas: List[str] = []
    atenuantes_seleccionadas: List[str] = []

class ResultadoCalculo(BaseModel):
    delito: dict
    pena_base_minima_meses: int
    pena_base_maxima_meses: int
    pena_ajustada_minima_meses: int
    pena_ajustada_maxima_meses: int
    pena_minima_texto: str
    pena_maxima_texto: str
    tipo_procedimiento: str
    procedimiento_descripcion: str
    puede_procedimiento_abreviado: bool
    rebaja_por_abreviado: Optional[str] = None
    agravantes_aplicadas: List[str]
    atenuantes_aplicadas: List[str]
    observaciones: List[str]

class Categoria(BaseModel):
    nombre: str
    cantidad_delitos: int

# =============================================
# DATOS DE DELITOS (CÓDIGO PENAL HONDURAS D. 130-2017)
# =============================================

DELITOS_HONDURAS = [
    # DELITOS CONTRA LA VIDA
    {
        "nombre": "Homicidio Simple",
        "articulo": "Art. 192",
        "categoria": "Delitos contra la vida",
        "ley": "Código Penal, Decreto 130-2017",
        "pena_minima_meses": 180,  # 15 años
        "pena_maxima_meses": 240,  # 20 años
        "descripcion": "Quien dé muerte a otra persona",
        "es_grave": True,
        "permite_abreviado": False
    },
    {
        "nombre": "Asesinato",
        "articulo": "Art. 193",
        "categoria": "Delitos contra la vida",
        "ley": "Código Penal, Decreto 130-2017",
        "pena_minima_meses": 240,  # 20 años
        "pena_maxima_meses": 360,  # 30 años o perpetua
        "descripcion": "Homicidio con alevosía, ensañamiento, por precio o recompensa, entre otros",
        "es_grave": True,
        "permite_abreviado": False
    },
    {
        "nombre": "Femicidio",
        "articulo": "Art. 208",
        "categoria": "Delitos contra la vida",
        "ley": "Código Penal, Decreto 130-2017",
        "pena_minima_meses": 240,  # 20 años
        "pena_maxima_meses": 360,  # 30 años
        "descripcion": "Dar muerte a una mujer por razón de su género",
        "es_grave": True,
        "permite_abreviado": False,
        "requiere_procedimiento_especial": True,
        "tipo_procedimiento_especial": "Juzgados de Violencia Doméstica"
    },
    {
        "nombre": "Homicidio Imprudente",
        "articulo": "Art. 198",
        "categoria": "Delitos contra la vida",
        "ley": "Código Penal, Decreto 130-2017",
        "pena_minima_meses": 24,  # 2 años
        "pena_maxima_meses": 60,  # 5 años
        "descripcion": "Causar la muerte de otro por imprudencia",
        "es_grave": False,
        "permite_abreviado": True
    },
    {
        "nombre": "Auxilio o Inducción al Suicidio",
        "articulo": "Art. 197",
        "categoria": "Delitos contra la vida",
        "ley": "Código Penal, Decreto 130-2017",
        "pena_minima_meses": 36,  # 3 años
        "pena_maxima_meses": 72,  # 6 años
        "descripcion": "Inducir o auxiliar a otro al suicidio",
        "es_grave": False,
        "permite_abreviado": True
    },
    {
        "nombre": "Aborto Consentido",
        "articulo": "Art. 196.1",
        "categoria": "Delitos contra la vida",
        "ley": "Código Penal, Decreto 130-2017",
        "pena_minima_meses": 36,  # 3 años
        "pena_maxima_meses": 72,  # 6 años
        "descripcion": "Practicar aborto con consentimiento de la mujer",
        "es_grave": False,
        "permite_abreviado": True
    },
    {
        "nombre": "Aborto sin Consentimiento",
        "articulo": "Art. 196.2",
        "categoria": "Delitos contra la vida",
        "ley": "Código Penal, Decreto 130-2017",
        "pena_minima_meses": 48,  # 4 años
        "pena_maxima_meses": 96,  # 8 años
        "descripcion": "Practicar aborto sin consentimiento de la mujer",
        "es_grave": True,
        "permite_abreviado": True
    },
    {
        "nombre": "Aborto Forzado",
        "articulo": "Art. 196.3",
        "categoria": "Delitos contra la vida",
        "ley": "Código Penal, Decreto 130-2017",
        "pena_minima_meses": 72,  # 6 años
        "pena_maxima_meses": 108,  # 9 años
        "descripcion": "Causar aborto mediante violencia",
        "es_grave": True,
        "permite_abreviado": True
    },
    {
        "nombre": "Lesiones Gravísimas",
        "articulo": "Art. 201.1",
        "categoria": "Delitos contra la vida",
        "ley": "Código Penal, Decreto 130-2017",
        "pena_minima_meses": 72,  # 6 años
        "pena_maxima_meses": 108,  # 9 años
        "descripcion": "Lesiones que causen pérdida de miembro, órgano o sentido",
        "es_grave": True,
        "permite_abreviado": True
    },
    {
        "nombre": "Lesiones Graves",
        "articulo": "Art. 201.2",
        "categoria": "Delitos contra la vida",
        "ley": "Código Penal, Decreto 130-2017",
        "pena_minima_meses": 36,  # 3 años
        "pena_maxima_meses": 72,  # 6 años
        "descripcion": "Lesiones que causen deformidad o incapacidad",
        "es_grave": False,
        "permite_abreviado": True
    },
    {
        "nombre": "Lesiones Leves",
        "articulo": "Art. 200",
        "categoria": "Delitos contra la vida",
        "ley": "Código Penal, Decreto 130-2017",
        "pena_minima_meses": 6,  # 6 meses
        "pena_maxima_meses": 24,  # 2 años
        "descripcion": "Lesiones que no sean graves o gravísimas",
        "es_grave": False,
        "permite_abreviado": True
    },
    {
        "nombre": "Lesiones Imprudentes",
        "articulo": "Art. 202",
        "categoria": "Delitos contra la vida",
        "ley": "Código Penal, Decreto 130-2017",
        "pena_minima_meses": 6,  # 6 meses
        "pena_maxima_meses": 36,  # 3 años
        "descripcion": "Causar lesiones por imprudencia",
        "es_grave": False,
        "permite_abreviado": True
    },
    
    # DELITOS CONTRA LA LIBERTAD
    {
        "nombre": "Secuestro",
        "articulo": "Art. 233",
        "categoria": "Delitos contra la libertad",
        "ley": "Código Penal, Decreto 130-2017",
        "pena_minima_meses": 96,  # 8 años
        "pena_maxima_meses": 144,  # 12 años
        "descripcion": "Privar a otro de su libertad exigiendo rescate",
        "es_grave": True,
        "permite_abreviado": False
    },
    {
        "nombre": "Secuestro Agravado",
        "articulo": "Art. 234",
        "categoria": "Delitos contra la libertad",
        "ley": "Código Penal, Decreto 130-2017",
        "pena_minima_meses": 144,  # 12 años
        "pena_maxima_meses": 180,  # 15 años
        "descripcion": "Secuestro con agravantes (menor, tortura, muerte)",
        "es_grave": True,
        "permite_abreviado": False
    },
    {
        "nombre": "Privación de Libertad",
        "articulo": "Art. 232",
        "categoria": "Delitos contra la libertad",
        "ley": "Código Penal, Decreto 130-2017",
        "pena_minima_meses": 24,  # 2 años
        "pena_maxima_meses": 60,  # 5 años
        "descripcion": "Privar a otro de su libertad sin derecho",
        "es_grave": False,
        "permite_abreviado": True
    },
    {
        "nombre": "Amenazas",
        "articulo": "Art. 246",
        "categoria": "Delitos contra la libertad",
        "ley": "Código Penal, Decreto 130-2017",
        "pena_minima_meses": 6,  # 6 meses
        "pena_maxima_meses": 24,  # 2 años
        "descripcion": "Amenazar a otro con causar un mal",
        "es_grave": False,
        "permite_abreviado": True
    },
    {
        "nombre": "Chantaje",
        "articulo": "Art. 247",
        "categoria": "Delitos contra la libertad",
        "ley": "Código Penal, Decreto 130-2017",
        "pena_minima_meses": 24,  # 2 años
        "pena_maxima_meses": 60,  # 5 años
        "descripcion": "Exigir dinero bajo amenaza de revelar secretos",
        "es_grave": False,
        "permite_abreviado": True
    },
    {
        "nombre": "Coacciones",
        "articulo": "Art. 245",
        "categoria": "Delitos contra la libertad",
        "ley": "Código Penal, Decreto 130-2017",
        "pena_minima_meses": 6,  # 6 meses
        "pena_maxima_meses": 24,  # 2 años
        "descripcion": "Compeler a otro a hacer lo que no quiere",
        "es_grave": False,
        "permite_abreviado": True
    },
    {
        "nombre": "Trata de Personas",
        "articulo": "Art. 219",
        "categoria": "Delitos contra la libertad",
        "ley": "Código Penal, Decreto 130-2017",
        "pena_minima_meses": 120,  # 10 años
        "pena_maxima_meses": 180,  # 15 años
        "descripcion": "Captar, transportar o acoger personas con fines de explotación",
        "es_grave": True,
        "permite_abreviado": False
    },
    
    # DELITOS SEXUALES
    {
        "nombre": "Violación",
        "articulo": "Art. 249",
        "categoria": "Delitos sexuales",
        "ley": "Código Penal, Decreto 130-2017",
        "pena_minima_meses": 108,  # 9 años
        "pena_maxima_meses": 156,  # 13 años
        "descripcion": "Acceso carnal mediante violencia o intimidación",
        "es_grave": True,
        "permite_abreviado": False
    },
    {
        "nombre": "Agresión Sexual",
        "articulo": "Art. 250",
        "categoria": "Delitos sexuales",
        "ley": "Código Penal, Decreto 130-2017",
        "pena_minima_meses": 48,  # 4 años
        "pena_maxima_meses": 96,  # 8 años
        "descripcion": "Actos sexuales mediante violencia sin acceso carnal",
        "es_grave": True,
        "permite_abreviado": True
    },
    {
        "nombre": "Abuso Sexual",
        "articulo": "Art. 251",
        "categoria": "Delitos sexuales",
        "ley": "Código Penal, Decreto 130-2017",
        "pena_minima_meses": 36,  # 3 años
        "pena_maxima_meses": 72,  # 6 años
        "descripcion": "Actos sexuales sin consentimiento pero sin violencia",
        "es_grave": False,
        "permite_abreviado": True
    },
    {
        "nombre": "Acoso Sexual",
        "articulo": "Art. 256",
        "categoria": "Delitos sexuales",
        "ley": "Código Penal, Decreto 130-2017",
        "pena_minima_meses": 12,  # 1 año
        "pena_maxima_meses": 36,  # 3 años
        "descripcion": "Solicitar favores sexuales con prevalimiento",
        "es_grave": False,
        "permite_abreviado": True
    },
    {
        "nombre": "Estupro",
        "articulo": "Art. 254",
        "categoria": "Delitos sexuales",
        "ley": "Código Penal, Decreto 130-2017",
        "pena_minima_meses": 48,  # 4 años
        "pena_maxima_meses": 84,  # 7 años
        "descripcion": "Acceso carnal con menor de 18 años mediante engaño",
        "es_grave": True,
        "permite_abreviado": True
    },
    
    # DELITOS CONTRA EL PATRIMONIO
    {
        "nombre": "Hurto",
        "articulo": "Art. 357",
        "categoria": "Delitos contra el patrimonio",
        "ley": "Código Penal, Decreto 130-2017",
        "pena_minima_meses": 12,  # 1 año
        "pena_maxima_meses": 36,  # 3 años
        "descripcion": "Apoderarse de cosa mueble ajena",
        "es_grave": False,
        "permite_abreviado": True
    },
    {
        "nombre": "Hurto Agravado",
        "articulo": "Art. 358",
        "categoria": "Delitos contra el patrimonio",
        "ley": "Código Penal, Decreto 130-2017",
        "pena_minima_meses": 24,  # 2 años
        "pena_maxima_meses": 48,  # 4 años
        "descripcion": "Hurto con circunstancias agravantes",
        "es_grave": False,
        "permite_abreviado": True
    },
    {
        "nombre": "Robo",
        "articulo": "Art. 359",
        "categoria": "Delitos contra el patrimonio",
        "ley": "Código Penal, Decreto 130-2017",
        "pena_minima_meses": 48,  # 4 años
        "pena_maxima_meses": 96,  # 8 años
        "descripcion": "Apoderarse de cosa mueble usando violencia o intimidación",
        "es_grave": True,
        "permite_abreviado": True
    },
    {
        "nombre": "Robo Agravado",
        "articulo": "Art. 360",
        "categoria": "Delitos contra el patrimonio",
        "ley": "Código Penal, Decreto 130-2017",
        "pena_minima_meses": 84,  # 7 años
        "pena_maxima_meses": 120,  # 10 años
        "descripcion": "Robo con agravantes (armas, bandas, etc.)",
        "es_grave": True,
        "permite_abreviado": False
    },
    {
        "nombre": "Robo de Vehículo",
        "articulo": "Art. 361",
        "categoria": "Delitos contra el patrimonio",
        "ley": "Código Penal, Decreto 130-2017",
        "pena_minima_meses": 48,  # 4 años
        "pena_maxima_meses": 96,  # 8 años
        "descripcion": "Robo de vehículo automotor",
        "es_grave": True,
        "permite_abreviado": True
    },
    {
        "nombre": "Robo de Ganado Mayor",
        "articulo": "Art. 362",
        "categoria": "Delitos contra el patrimonio",
        "ley": "Código Penal, Decreto 130-2017",
        "pena_minima_meses": 84,  # 7 años
        "pena_maxima_meses": 120,  # 10 años
        "descripcion": "Robo de ganado bovino, equino, etc.",
        "es_grave": True,
        "permite_abreviado": False
    },
    {
        "nombre": "Estafa",
        "articulo": "Art. 365",
        "categoria": "Delitos contra el patrimonio",
        "ley": "Código Penal, Decreto 130-2017",
        "pena_minima_meses": 24,  # 2 años
        "pena_maxima_meses": 60,  # 5 años
        "descripcion": "Defraudar a otro mediante engaño",
        "es_grave": False,
        "permite_abreviado": True
    },
    {
        "nombre": "Estafa Agravada",
        "articulo": "Art. 366",
        "categoria": "Delitos contra el patrimonio",
        "ley": "Código Penal, Decreto 130-2017",
        "pena_minima_meses": 48,  # 4 años
        "pena_maxima_meses": 96,  # 8 años
        "descripcion": "Estafa con agravantes",
        "es_grave": True,
        "permite_abreviado": True
    },
    {
        "nombre": "Extorsión",
        "articulo": "Art. 373",
        "categoria": "Delitos contra el patrimonio",
        "ley": "Código Penal, Decreto 130-2017",
        "pena_minima_meses": 60,  # 5 años
        "pena_maxima_meses": 108,  # 9 años
        "descripcion": "Obligar a otro a entregar dinero mediante intimidación",
        "es_grave": True,
        "permite_abreviado": True
    },
    {
        "nombre": "Extorsión Agravada",
        "articulo": "Art. 374",
        "categoria": "Delitos contra el patrimonio",
        "ley": "Código Penal, Decreto 130-2017",
        "pena_minima_meses": 96,  # 8 años
        "pena_maxima_meses": 144,  # 12 años
        "descripcion": "Extorsión con agravantes",
        "es_grave": True,
        "permite_abreviado": False
    },
    {
        "nombre": "Usurpación",
        "articulo": "Art. 377",
        "categoria": "Delitos contra el patrimonio",
        "ley": "Código Penal, Decreto 130-2017",
        "pena_minima_meses": 12,  # 1 año
        "pena_maxima_meses": 36,  # 3 años
        "descripcion": "Ocupar inmueble ajeno",
        "es_grave": False,
        "permite_abreviado": True
    },
    {
        "nombre": "Daños",
        "articulo": "Art. 381",
        "categoria": "Delitos contra el patrimonio",
        "ley": "Código Penal, Decreto 130-2017",
        "pena_minima_meses": 6,  # 6 meses
        "pena_maxima_meses": 24,  # 2 años
        "descripcion": "Destruir o deteriorar cosa ajena",
        "es_grave": False,
        "permite_abreviado": True
    },
    {
        "nombre": "Daños Agravados",
        "articulo": "Art. 383",
        "categoria": "Delitos contra el patrimonio",
        "ley": "Código Penal, Decreto 130-2017",
        "pena_minima_meses": 24,  # 2 años
        "pena_maxima_meses": 48,  # 4 años
        "descripcion": "Daños con agravantes",
        "es_grave": False,
        "permite_abreviado": True
    },
    {
        "nombre": "Apropiación Indebida",
        "articulo": "Art. 369",
        "categoria": "Delitos contra el patrimonio",
        "ley": "Código Penal, Decreto 130-2017",
        "pena_minima_meses": 12,  # 1 año
        "pena_maxima_meses": 48,  # 4 años
        "descripcion": "Apropiarse de dinero o cosas entregadas en confianza",
        "es_grave": False,
        "permite_abreviado": True
    },
    
    # DELITOS INFORMÁTICOS
    {
        "nombre": "Acceso No Autorizado a Sistemas",
        "articulo": "Art. 398",
        "categoria": "Delitos informáticos",
        "ley": "Código Penal, Decreto 130-2017",
        "pena_minima_meses": 36,  # 3 años
        "pena_maxima_meses": 72,  # 6 años
        "descripcion": "Acceder sin autorización a sistemas informáticos",
        "es_grave": False,
        "permite_abreviado": True
    },
    {
        "nombre": "Daño Informático",
        "articulo": "Art. 399",
        "categoria": "Delitos informáticos",
        "ley": "Código Penal, Decreto 130-2017",
        "pena_minima_meses": 36,  # 3 años
        "pena_maxima_meses": 72,  # 6 años
        "descripcion": "Destruir o alterar datos o sistemas informáticos",
        "es_grave": False,
        "permite_abreviado": True
    },
    {
        "nombre": "Fraude Informático",
        "articulo": "Art. 400",
        "categoria": "Delitos informáticos",
        "ley": "Código Penal, Decreto 130-2017",
        "pena_minima_meses": 48,  # 4 años
        "pena_maxima_meses": 96,  # 8 años
        "descripcion": "Obtener beneficio económico mediante manipulación informática",
        "es_grave": True,
        "permite_abreviado": True
    },
    
    # DELITOS CONTRA LA ADMINISTRACIÓN PÚBLICA
    {
        "nombre": "Cohecho (Soborno)",
        "articulo": "Art. 425",
        "categoria": "Delitos contra la administración pública",
        "ley": "Código Penal, Decreto 130-2017",
        "pena_minima_meses": 48,  # 4 años
        "pena_maxima_meses": 84,  # 7 años
        "descripcion": "Funcionario que solicite o reciba dádiva",
        "es_grave": True,
        "permite_abreviado": True
    },
    {
        "nombre": "Malversación de Caudales Públicos",
        "articulo": "Art. 422",
        "categoria": "Delitos contra la administración pública",
        "ley": "Código Penal, Decreto 130-2017",
        "pena_minima_meses": 48,  # 4 años
        "pena_maxima_meses": 72,  # 6 años
        "descripcion": "Funcionario que sustraiga caudales públicos",
        "es_grave": True,
        "permite_abreviado": True
    },
    {
        "nombre": "Peculado",
        "articulo": "Art. 421",
        "categoria": "Delitos contra la administración pública",
        "ley": "Código Penal, Decreto 130-2017",
        "pena_minima_meses": 60,  # 5 años
        "pena_maxima_meses": 108,  # 9 años
        "descripcion": "Funcionario que se apropie de bienes públicos",
        "es_grave": True,
        "permite_abreviado": True
    },
    {
        "nombre": "Abuso de Autoridad",
        "articulo": "Art. 430",
        "categoria": "Delitos contra la administración pública",
        "ley": "Código Penal, Decreto 130-2017",
        "pena_minima_meses": 24,  # 2 años
        "pena_maxima_meses": 48,  # 4 años
        "descripcion": "Funcionario que abuse de su cargo",
        "es_grave": False,
        "permite_abreviado": True
    },
    {
        "nombre": "Prevaricato",
        "articulo": "Art. 432",
        "categoria": "Delitos contra la administración pública",
        "ley": "Código Penal, Decreto 130-2017",
        "pena_minima_meses": 48,  # 4 años
        "pena_maxima_meses": 84,  # 7 años
        "descripcion": "Juez que dicte resolución injusta",
        "es_grave": True,
        "permite_abreviado": True
    },
    
    # DELITOS CONTRA LA FE PÚBLICA
    {
        "nombre": "Falsificación de Documento Público",
        "articulo": "Art. 448",
        "categoria": "Delitos contra la fe pública",
        "ley": "Código Penal, Decreto 130-2017",
        "pena_minima_meses": 36,  # 3 años
        "pena_maxima_meses": 72,  # 6 años
        "descripcion": "Falsificar documento público",
        "es_grave": False,
        "permite_abreviado": True
    },
    {
        "nombre": "Falsificación de Documento Privado",
        "articulo": "Art. 449",
        "categoria": "Delitos contra la fe pública",
        "ley": "Código Penal, Decreto 130-2017",
        "pena_minima_meses": 24,  # 2 años
        "pena_maxima_meses": 48,  # 4 años
        "descripcion": "Falsificar documento privado",
        "es_grave": False,
        "permite_abreviado": True
    },
    {
        "nombre": "Uso de Documento Falso",
        "articulo": "Art. 451",
        "categoria": "Delitos contra la fe pública",
        "ley": "Código Penal, Decreto 130-2017",
        "pena_minima_meses": 24,  # 2 años
        "pena_maxima_meses": 48,  # 4 años
        "descripcion": "Usar documento que se sabe es falso",
        "es_grave": False,
        "permite_abreviado": True
    },
    {
        "nombre": "Falsificación de Moneda",
        "articulo": "Art. 443",
        "categoria": "Delitos contra la fe pública",
        "ley": "Código Penal, Decreto 130-2017",
        "pena_minima_meses": 60,  # 5 años
        "pena_maxima_meses": 108,  # 9 años
        "descripcion": "Falsificar moneda de curso legal",
        "es_grave": True,
        "permite_abreviado": True
    },
    
    # DELITOS DE DROGAS
    {
        "nombre": "Tráfico de Drogas",
        "articulo": "Art. 5 Ley Antidrogas",
        "categoria": "Delitos de drogas",
        "ley": "Ley de Uso Indebido y Tráfico Ilícito de Drogas",
        "pena_minima_meses": 108,  # 9 años
        "pena_maxima_meses": 180,  # 15 años
        "descripcion": "Tráfico ilícito de estupefacientes",
        "es_grave": True,
        "permite_abreviado": False
    },
    {
        "nombre": "Posesión de Drogas para Consumo",
        "articulo": "Art. 8 Ley Antidrogas",
        "categoria": "Delitos de drogas",
        "ley": "Ley de Uso Indebido y Tráfico Ilícito de Drogas",
        "pena_minima_meses": 6,  # 6 meses
        "pena_maxima_meses": 24,  # 2 años
        "descripcion": "Posesión de drogas para uso personal",
        "es_grave": False,
        "permite_abreviado": True
    },
    {
        "nombre": "Microtráfico",
        "articulo": "Art. 6 Ley Antidrogas",
        "categoria": "Delitos de drogas",
        "ley": "Ley de Uso Indebido y Tráfico Ilícito de Drogas",
        "pena_minima_meses": 60,  # 5 años
        "pena_maxima_meses": 108,  # 9 años
        "descripcion": "Venta al menudeo de sustancias ilícitas",
        "es_grave": True,
        "permite_abreviado": True
    },
    
    # DELITOS DE LAVADO DE ACTIVOS
    {
        "nombre": "Lavado de Activos",
        "articulo": "Art. 3 Ley de Lavado",
        "categoria": "Lavado de activos",
        "ley": "Ley contra el Lavado de Activos",
        "pena_minima_meses": 72,  # 6 años
        "pena_maxima_meses": 144,  # 12 años
        "descripcion": "Ocultar o encubrir bienes de origen ilícito",
        "es_grave": True,
        "permite_abreviado": False
    },
    
    # DELITOS CONTRA LA FAMILIA
    {
        "nombre": "Violencia Doméstica",
        "articulo": "Art. 7 Ley VD",
        "categoria": "Violencia doméstica",
        "ley": "Ley contra la Violencia Doméstica",
        "pena_minima_meses": 12,  # 1 año
        "pena_maxima_meses": 36,  # 3 años
        "descripcion": "Violencia física o psicológica contra familiar",
        "es_grave": False,
        "permite_abreviado": True,
        "requiere_procedimiento_especial": True,
        "tipo_procedimiento_especial": "Juzgados de Violencia Doméstica"
    },
    {
        "nombre": "Incumplimiento de Deberes Alimentarios",
        "articulo": "Art. 222",
        "categoria": "Delitos contra la familia",
        "ley": "Código Penal, Decreto 130-2017",
        "pena_minima_meses": 12,  # 1 año
        "pena_maxima_meses": 36,  # 3 años
        "descripcion": "Incumplir obligación alimentaria",
        "es_grave": False,
        "permite_abreviado": True
    },
    {
        "nombre": "Abandono de Familia",
        "articulo": "Art. 223",
        "categoria": "Delitos contra la familia",
        "ley": "Código Penal, Decreto 130-2017",
        "pena_minima_meses": 6,  # 6 meses
        "pena_maxima_meses": 24,  # 2 años
        "descripcion": "Abandonar sin justa causa la familia",
        "es_grave": False,
        "permite_abreviado": True
    },
    
    # DELITOS CONTRA EL HONOR
    {
        "nombre": "Calumnia",
        "articulo": "Art. 275",
        "categoria": "Delitos contra el honor",
        "ley": "Código Penal, Decreto 130-2017",
        "pena_minima_meses": 12,  # 1 año
        "pena_maxima_meses": 36,  # 3 años
        "descripcion": "Imputar falsamente un delito",
        "es_grave": False,
        "permite_abreviado": True
    },
    {
        "nombre": "Injuria",
        "articulo": "Art. 274",
        "categoria": "Delitos contra el honor",
        "ley": "Código Penal, Decreto 130-2017",
        "pena_minima_meses": 6,  # 6 meses
        "pena_maxima_meses": 18,  # 1.5 años
        "descripcion": "Lesionar la dignidad de otra persona",
        "es_grave": False,
        "permite_abreviado": True
    },
    
    # DELITOS DE ARMAS
    {
        "nombre": "Portación Ilegal de Armas",
        "articulo": "Art. 37 Ley Armas",
        "categoria": "Delitos de armas",
        "ley": "Ley de Control de Armas de Fuego",
        "pena_minima_meses": 48,  # 4 años
        "pena_maxima_meses": 84,  # 7 años
        "descripcion": "Portar arma de fuego sin permiso",
        "es_grave": True,
        "permite_abreviado": True
    },
    {
        "nombre": "Tenencia Ilegal de Armas",
        "articulo": "Art. 36 Ley Armas",
        "categoria": "Delitos de armas",
        "ley": "Ley de Control de Armas de Fuego",
        "pena_minima_meses": 36,  # 3 años
        "pena_maxima_meses": 72,  # 6 años
        "descripcion": "Tener arma de fuego sin registro",
        "es_grave": False,
        "permite_abreviado": True
    },
    {
        "nombre": "Tráfico de Armas",
        "articulo": "Art. 39 Ley Armas",
        "categoria": "Delitos de armas",
        "ley": "Ley de Control de Armas de Fuego",
        "pena_minima_meses": 108,  # 9 años
        "pena_maxima_meses": 180,  # 15 años
        "descripcion": "Tráfico ilícito de armas de fuego",
        "es_grave": True,
        "permite_abreviado": False
    },
    
    # ASOCIACIÓN ILÍCITA
    {
        "nombre": "Asociación Ilícita",
        "articulo": "Art. 332",
        "categoria": "Delitos contra el orden público",
        "ley": "Código Penal, Decreto 130-2017",
        "pena_minima_meses": 60,  # 5 años
        "pena_maxima_meses": 108,  # 9 años
        "descripcion": "Formar parte de organización criminal",
        "es_grave": True,
        "permite_abreviado": True
    },
    {
        "nombre": "Pertenencia a Maras o Pandillas",
        "articulo": "Art. 333",
        "categoria": "Delitos contra el orden público",
        "ley": "Código Penal, Decreto 130-2017",
        "pena_minima_meses": 60,  # 5 años
        "pena_maxima_meses": 108,  # 9 años
        "descripcion": "Pertenecer a maras o pandillas",
        "es_grave": True,
        "permite_abreviado": True
    },
]

# Circunstancias Agravantes
AGRAVANTES = [
    {"id": "reincidencia", "nombre": "Reincidencia", "incremento": 0.33},
    {"id": "premeditacion", "nombre": "Premeditación", "incremento": 0.25},
    {"id": "alevosia", "nombre": "Alevosía", "incremento": 0.33},
    {"id": "abuso_superioridad", "nombre": "Abuso de superioridad", "incremento": 0.25},
    {"id": "precio_recompensa", "nombre": "Por precio o recompensa", "incremento": 0.33},
    {"id": "victima_vulnerable", "nombre": "Víctima vulnerable (menor, anciano, discapacitado)", "incremento": 0.33},
    {"id": "funcionario_publico", "nombre": "Comisión como funcionario público", "incremento": 0.25},
    {"id": "uso_armas", "nombre": "Uso de armas", "incremento": 0.25},
    {"id": "banda_organizada", "nombre": "En banda organizada", "incremento": 0.33},
    {"id": "ensanamiento", "nombre": "Ensañamiento", "incremento": 0.33},
]

# Circunstancias Atenuantes
ATENUANTES = [
    {"id": "confesion", "nombre": "Confesión espontánea", "reduccion": 0.25},
    {"id": "reparacion", "nombre": "Reparación del daño", "reduccion": 0.33},
    {"id": "arrepentimiento", "nombre": "Arrepentimiento activo", "reduccion": 0.20},
    {"id": "menor_edad", "nombre": "Menor de 21 años", "reduccion": 0.25},
    {"id": "estado_necesidad", "nombre": "Estado de necesidad incompleto", "reduccion": 0.33},
    {"id": "obediencia_debida", "nombre": "Obediencia debida incompleta", "reduccion": 0.25},
    {"id": "colaboracion", "nombre": "Colaboración con la justicia", "reduccion": 0.33},
    {"id": "sin_antecedentes", "nombre": "Sin antecedentes penales", "reduccion": 0.10},
]

# =============================================
# FUNCIONES AUXILIARES
# =============================================

def meses_a_texto(meses: int) -> str:
    """Convierte meses a texto legible"""
    if meses >= 360:
        return "Prisión perpetua"
    años = meses // 12
    meses_restantes = meses % 12
    
    if años > 0 and meses_restantes > 0:
        return f"{años} año{'s' if años > 1 else ''} y {meses_restantes} mes{'es' if meses_restantes > 1 else ''}"
    elif años > 0:
        return f"{años} año{'s' if años > 1 else ''}"
    else:
        return f"{meses_restantes} mes{'es' if meses_restantes > 1 else ''}"

def determinar_procedimiento(pena_maxima_meses: int, delito: dict, es_reincidente: bool) -> tuple:
    """Determina el tipo de procedimiento aplicable"""
    
    # Si requiere procedimiento especial
    if delito.get("requiere_procedimiento_especial", False):
        return (
            TipoProcedimiento.ESPECIAL,
            f"Procedimiento Especial - {delito.get('tipo_procedimiento_especial', 'Juzgado Especializado')}"
        )
    
    # Procedimiento Abreviado: pena ≤ 9 años y no reincidente y permite abreviado
    if pena_maxima_meses <= 108 and not es_reincidente and delito.get("permite_abreviado", True):
        return (
            TipoProcedimiento.ABREVIADO,
            "Procedimiento Abreviado - Pena máxima ≤ 9 años, sin reincidencia"
        )
    
    # Procedimiento Ordinario para el resto
    return (
        TipoProcedimiento.ORDINARIO,
        "Procedimiento Ordinario - Juicio oral y público"
    )

# =============================================
# ENDPOINTS
# =============================================

@api_router.get("/")
async def root():
    return {"message": "Calculadora de Penas - Derecho Penal Hondureño"}

@api_router.get("/delitos", response_model=List[dict])
async def listar_delitos(
    categoria: Optional[str] = Query(None, description="Filtrar por categoría"),
    busqueda: Optional[str] = Query(None, description="Buscar por nombre")
):
    """Lista todos los delitos con filtros opcionales"""
    delitos = []
    
    for i, d in enumerate(DELITOS_HONDURAS):
        delito = {**d, "id": str(i)}
        
        # Filtrar por categoría
        if categoria and categoria.lower() not in delito["categoria"].lower():
            continue
            
        # Filtrar por búsqueda
        if busqueda and busqueda.lower() not in delito["nombre"].lower():
            continue
            
        # Añadir texto de penas
        delito["pena_minima_texto"] = meses_a_texto(delito["pena_minima_meses"])
        delito["pena_maxima_texto"] = meses_a_texto(delito["pena_maxima_meses"])
        
        delitos.append(delito)
    
    return delitos

@api_router.get("/delitos/{delito_id}")
async def obtener_delito(delito_id: str):
    """Obtiene un delito específico por ID"""
    try:
        idx = int(delito_id)
        if idx < 0 or idx >= len(DELITOS_HONDURAS):
            raise HTTPException(status_code=404, detail="Delito no encontrado")
        
        delito = {**DELITOS_HONDURAS[idx], "id": str(idx)}
        delito["pena_minima_texto"] = meses_a_texto(delito["pena_minima_meses"])
        delito["pena_maxima_texto"] = meses_a_texto(delito["pena_maxima_meses"])
        return delito
    except ValueError:
        raise HTTPException(status_code=400, detail="ID de delito inválido")

@api_router.get("/categorias")
async def listar_categorias():
    """Lista todas las categorías de delitos"""
    categorias = {}
    for d in DELITOS_HONDURAS:
        cat = d["categoria"]
        if cat in categorias:
            categorias[cat] += 1
        else:
            categorias[cat] = 1
    
    return [
        {"nombre": nombre, "cantidad_delitos": cantidad}
        for nombre, cantidad in sorted(categorias.items())
    ]

@api_router.get("/agravantes")
async def listar_agravantes():
    """Lista todas las circunstancias agravantes"""
    return AGRAVANTES

@api_router.get("/atenuantes")
async def listar_atenuantes():
    """Lista todas las circunstancias atenuantes"""
    return ATENUANTES

@api_router.post("/calcular", response_model=ResultadoCalculo)
async def calcular_pena(request: CalculoPenaRequest):
    """Calcula la pena para un delito con circunstancias modificativas"""
    try:
        idx = int(request.delito_id)
        if idx < 0 or idx >= len(DELITOS_HONDURAS):
            raise HTTPException(status_code=404, detail="Delito no encontrado")
        
        delito = {**DELITOS_HONDURAS[idx], "id": str(idx)}
    except ValueError:
        raise HTTPException(status_code=400, detail="ID de delito inválido")
    
    pena_min = delito["pena_minima_meses"]
    pena_max = delito["pena_maxima_meses"]
    
    observaciones = []
    agravantes_aplicadas = []
    atenuantes_aplicadas = []
    
    # Aplicar agravantes
    if request.tiene_agravantes:
        incremento_total = 0
        for agr_id in request.agravantes_seleccionadas:
            agravante = next((a for a in AGRAVANTES if a["id"] == agr_id), None)
            if agravante:
                incremento_total += agravante["incremento"]
                agravantes_aplicadas.append(agravante["nombre"])
        
        if incremento_total > 0:
            # Máximo incremento permitido: 1/3
            incremento_total = min(incremento_total, 0.33)
            pena_min = int(pena_min * (1 + incremento_total))
            pena_max = int(pena_max * (1 + incremento_total))
            observaciones.append(f"Pena incrementada en {int(incremento_total * 100)}% por agravantes")
    
    # Aplicar atenuantes
    if request.tiene_atenuantes:
        reduccion_total = 0
        for aten_id in request.atenuantes_seleccionadas:
            atenuante = next((a for a in ATENUANTES if a["id"] == aten_id), None)
            if atenuante:
                reduccion_total += atenuante["reduccion"]
                atenuantes_aplicadas.append(atenuante["nombre"])
        
        if reduccion_total > 0:
            # Máxima reducción permitida: 1/3
            reduccion_total = min(reduccion_total, 0.33)
            pena_min = int(pena_min * (1 - reduccion_total))
            pena_max = int(pena_max * (1 - reduccion_total))
            observaciones.append(f"Pena reducida en {int(reduccion_total * 100)}% por atenuantes")
    
    # Determinar tipo de procedimiento
    tipo_proc, desc_proc = determinar_procedimiento(pena_max, delito, request.es_reincidente)
    
    # Calcular rebaja por procedimiento abreviado
    rebaja_abreviado = None
    puede_abreviado = (
        tipo_proc == TipoProcedimiento.ABREVIADO or 
        (pena_max <= 108 and not request.es_reincidente and delito.get("permite_abreviado", True))
    )
    
    if puede_abreviado:
        if request.confiesa:
            rebaja = 0.25  # 1/4 base
            if request.repara_dano:
                rebaja = 0.33  # 1/3 si repara daño
            
            pena_abreviado_min = int(pena_min * (1 - rebaja))
            pena_abreviado_max = int(pena_max * (1 - rebaja))
            rebaja_abreviado = f"Con procedimiento abreviado: {meses_a_texto(pena_abreviado_min)} a {meses_a_texto(pena_abreviado_max)} (rebaja {int(rebaja * 100)}%)"
            observaciones.append(f"Elegible para procedimiento abreviado con rebaja de {int(rebaja * 100)}%")
    
    # Observaciones adicionales
    if request.es_reincidente:
        observaciones.append("La reincidencia impide el procedimiento abreviado (Art. 403 CPP)")
    
    if delito.get("es_grave", False):
        observaciones.append("Este es un delito grave según el Código Penal")
    
    if delito.get("requiere_procedimiento_especial", False):
        observaciones.append(f"Competencia: {delito.get('tipo_procedimiento_especial', 'Juzgado Especializado')}")
    
    # Construir respuesta
    delito["pena_minima_texto"] = meses_a_texto(delito["pena_minima_meses"])
    delito["pena_maxima_texto"] = meses_a_texto(delito["pena_maxima_meses"])
    
    return ResultadoCalculo(
        delito=delito,
        pena_base_minima_meses=delito["pena_minima_meses"],
        pena_base_maxima_meses=delito["pena_maxima_meses"],
        pena_ajustada_minima_meses=pena_min,
        pena_ajustada_maxima_meses=pena_max,
        pena_minima_texto=meses_a_texto(pena_min),
        pena_maxima_texto=meses_a_texto(pena_max),
        tipo_procedimiento=tipo_proc.value,
        procedimiento_descripcion=desc_proc,
        puede_procedimiento_abreviado=puede_abreviado,
        rebaja_por_abreviado=rebaja_abreviado,
        agravantes_aplicadas=agravantes_aplicadas,
        atenuantes_aplicadas=atenuantes_aplicadas,
        observaciones=observaciones
    )

# Guardar historial de consultas
class ConsultaHistorial(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    delito_id: str
    delito_nombre: str
    resultado: dict
    timestamp: datetime = Field(default_factory=datetime.utcnow)

@api_router.post("/historial")
async def guardar_consulta(consulta: ConsultaHistorial):
    """Guarda una consulta en el historial"""
    consulta_dict = consulta.dict()
    consulta_dict["timestamp"] = consulta_dict["timestamp"].isoformat()
    await db.historial_consultas.insert_one(consulta_dict)
    return {"message": "Consulta guardada", "id": consulta.id}

@api_router.get("/historial")
async def obtener_historial(limit: int = 20):
    """Obtiene el historial de consultas"""
    consultas = await db.historial_consultas.find().sort("timestamp", -1).limit(limit).to_list(limit)
    for c in consultas:
        c["_id"] = str(c["_id"])
    return consultas

# Include the router in the main app
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
