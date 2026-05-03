from fastapi import FastAPI, APIRouter, Query, HTTPException
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
import uuid
from datetime import datetime
from enum import Enum
import math


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

class TipoPena(str, Enum):
    PRISION = "prision"
    MULTA = "multa"

class DelitoConfig(BaseModel):
    delito_id: str
    pena_seleccionada: TipoPena = TipoPena.PRISION
    variables_activas: List[str] = []
    grado_autoria: GradoAutoria = GradoAutoria.AUTOR_DIRECTO
    grado_ejecucion: GradoEjecucion = GradoEjecucion.CONSUMADO
    reduccion_tentativa: int = 1  # 1 o 2 grados
    agravantes: List[str] = []
    atenuantes: List[str] = []
    eximentes: List[str] = []
    eximente_completa: bool = False

class CalculoRequest(BaseModel):
    delitos: List[DelitoConfig]
    tipo_concurso: TipoConcurso = TipoConcurso.NINGUNO

class PenaRango(BaseModel):
    minimo_meses: int
    maximo_meses: int
    tipo: str

class DelitoResultado(BaseModel):
    delito_id: str
    nombre: str
    articulo: str
    pena_base: PenaRango
    pena_individual: PenaRango
    pena_individual_texto: str
    grado_autoria: str
    grado_ejecucion: str
    agravantes_aplicadas: List[str]
    atenuantes_aplicadas: List[str]
    penas_accesorias: List[str]

class ResultadoCalculo(BaseModel):
    delitos_analizados: List[DelitoResultado]
    tipo_concurso: str
    concurso_descripcion: str
    pena_principal: str
    pena_principal_minimo_meses: int
    pena_principal_maximo_meses: int
    penas_accesorias: List[str]
    analisis_juridico: str
    analisis_tecnico: str
    fecha: str

# =============================================
# DATOS DE DELITOS - CÓDIGO PENAL HONDURAS
# =============================================

DELITOS_HONDURAS = [
    # DELITOS CONTRA LA VIDA
    {
        "id": "1",
        "nombre": "Homicidio",
        "articulo": "Art. 192",
        "categoria": "Delitos contra la vida",
        "descripcion": "Quien dé muerte a otra persona será castigado con la pena de prisión.",
        "pena_prision_min": 180,  # 15 años
        "pena_prision_max": 240,  # 20 años
        "pena_multa_min": 0,
        "pena_multa_max": 0,
        "tiene_pena_alternativa": False,
        "es_grave": True,
        "variables": []
    },
    {
        "id": "2",
        "nombre": "Asesinato",
        "articulo": "Art. 193",
        "categoria": "Delitos contra la vida",
        "descripcion": "Homicidio con alevosía, ensañamiento, por precio o recompensa.",
        "pena_prision_min": 240,  # 20 años
        "pena_prision_max": 360,  # 30 años
        "pena_multa_min": 0,
        "pena_multa_max": 0,
        "tiene_pena_alternativa": False,
        "es_grave": True,
        "variables": []
    },
    {
        "id": "3",
        "nombre": "Femicidio",
        "articulo": "Art. 208",
        "categoria": "Delitos contra la vida",
        "descripcion": "Dar muerte a una mujer por razón de su género.",
        "pena_prision_min": 240,
        "pena_prision_max": 360,
        "pena_multa_min": 0,
        "pena_multa_max": 0,
        "tiene_pena_alternativa": False,
        "es_grave": True,
        "variables": [],
        "penas_accesorias": ["Inhabilitación especial para el ejercicio de la patria potestad"]
    },
    {
        "id": "4",
        "nombre": "Homicidio Imprudente",
        "articulo": "Art. 198",
        "categoria": "Delitos contra la vida",
        "descripcion": "Causar la muerte de otro por imprudencia grave.",
        "pena_prision_min": 24,  # 2 años
        "pena_prision_max": 60,  # 5 años
        "pena_multa_min": 0,
        "pena_multa_max": 0,
        "tiene_pena_alternativa": False,
        "es_grave": False,
        "variables": []
    },
    {
        "id": "5",
        "nombre": "Lesiones Gravísimas",
        "articulo": "Art. 201.1",
        "categoria": "Delitos contra la vida",
        "descripcion": "Lesiones que causen pérdida de miembro, órgano o sentido.",
        "pena_prision_min": 72,  # 6 años
        "pena_prision_max": 108,  # 9 años
        "pena_multa_min": 0,
        "pena_multa_max": 0,
        "tiene_pena_alternativa": False,
        "es_grave": True,
        "variables": []
    },
    {
        "id": "6",
        "nombre": "Lesiones Graves",
        "articulo": "Art. 201.2",
        "categoria": "Delitos contra la vida",
        "descripcion": "Lesiones que causen deformidad o incapacidad.",
        "pena_prision_min": 36,  # 3 años
        "pena_prision_max": 72,  # 6 años
        "pena_multa_min": 0,
        "pena_multa_max": 0,
        "tiene_pena_alternativa": False,
        "es_grave": False,
        "variables": []
    },
    {
        "id": "7",
        "nombre": "Lesiones Leves",
        "articulo": "Art. 200",
        "categoria": "Delitos contra la vida",
        "descripcion": "Lesiones que no sean graves o gravísimas.",
        "pena_prision_min": 3,  # 3 meses
        "pena_prision_max": 36,  # 3 años
        "pena_multa_min": 6,  # 6 meses multa
        "pena_multa_max": 12,  # 12 meses multa
        "tiene_pena_alternativa": True,
        "es_grave": False,
        "variables": [
            {"id": "victima_menor", "nombre": "Víctima menor de edad", "descripcion": "Activa inhabilitación especial", "pena_accesoria": "Inhabilitación especial (Art. 156 quinquies)"}
        ]
    },
    {
        "id": "8",
        "nombre": "Auxilio al Suicidio",
        "articulo": "Art. 197",
        "categoria": "Delitos contra la vida",
        "descripcion": "Inducir o auxiliar a otro al suicidio.",
        "pena_prision_min": 36,
        "pena_prision_max": 72,
        "pena_multa_min": 0,
        "pena_multa_max": 0,
        "tiene_pena_alternativa": False,
        "es_grave": False,
        "variables": []
    },
    # DELITOS CONTRA LA LIBERTAD
    {
        "id": "9",
        "nombre": "Secuestro",
        "articulo": "Art. 233",
        "categoria": "Delitos contra la libertad",
        "descripcion": "Privar a otro de su libertad exigiendo rescate.",
        "pena_prision_min": 96,  # 8 años
        "pena_prision_max": 144,  # 12 años
        "pena_multa_min": 0,
        "pena_multa_max": 0,
        "tiene_pena_alternativa": False,
        "es_grave": True,
        "variables": [
            {"id": "victima_menor", "nombre": "Víctima menor de edad", "descripcion": "Agrava la pena", "pena_accesoria": "Inhabilitación especial"}
        ]
    },
    {
        "id": "10",
        "nombre": "Secuestro Agravado",
        "articulo": "Art. 234",
        "categoria": "Delitos contra la libertad",
        "descripcion": "Secuestro con agravantes (menor, tortura, muerte).",
        "pena_prision_min": 144,  # 12 años
        "pena_prision_max": 180,  # 15 años
        "pena_multa_min": 0,
        "pena_multa_max": 0,
        "tiene_pena_alternativa": False,
        "es_grave": True,
        "variables": []
    },
    {
        "id": "11",
        "nombre": "Privación de Libertad",
        "articulo": "Art. 232",
        "categoria": "Delitos contra la libertad",
        "descripcion": "Privar a otro de su libertad sin derecho.",
        "pena_prision_min": 24,
        "pena_prision_max": 60,
        "pena_multa_min": 0,
        "pena_multa_max": 0,
        "tiene_pena_alternativa": False,
        "es_grave": False,
        "variables": []
    },
    {
        "id": "12",
        "nombre": "Amenazas",
        "articulo": "Art. 246",
        "categoria": "Delitos contra la libertad",
        "descripcion": "Amenazar a otro con causar un mal.",
        "pena_prision_min": 6,
        "pena_prision_max": 24,
        "pena_multa_min": 6,
        "pena_multa_max": 12,
        "tiene_pena_alternativa": True,
        "es_grave": False,
        "variables": []
    },
    {
        "id": "13",
        "nombre": "Coacciones",
        "articulo": "Art. 245",
        "categoria": "Delitos contra la libertad",
        "descripcion": "Compeler a otro a hacer lo que no quiere.",
        "pena_prision_min": 6,
        "pena_prision_max": 24,
        "pena_multa_min": 6,
        "pena_multa_max": 12,
        "tiene_pena_alternativa": True,
        "es_grave": False,
        "variables": []
    },
    {
        "id": "14",
        "nombre": "Trata de Personas",
        "articulo": "Art. 219",
        "categoria": "Delitos contra la libertad",
        "descripcion": "Captar, transportar o acoger personas con fines de explotación.",
        "pena_prision_min": 120,
        "pena_prision_max": 180,
        "pena_multa_min": 0,
        "pena_multa_max": 0,
        "tiene_pena_alternativa": False,
        "es_grave": True,
        "variables": [
            {"id": "victima_menor", "nombre": "Víctima menor de edad", "descripcion": "Agrava la pena en grado superior", "pena_accesoria": "Inhabilitación especial"}
        ]
    },
    # DELITOS SEXUALES
    {
        "id": "15",
        "nombre": "Violación",
        "articulo": "Art. 249",
        "categoria": "Delitos sexuales",
        "descripcion": "Acceso carnal mediante violencia o intimidación.",
        "pena_prision_min": 108,
        "pena_prision_max": 156,
        "pena_multa_min": 0,
        "pena_multa_max": 0,
        "tiene_pena_alternativa": False,
        "es_grave": True,
        "variables": [
            {"id": "victima_menor", "nombre": "Víctima menor de edad", "descripcion": "Activa inhabilitación especial", "pena_accesoria": "Inhabilitación especial para profesiones con menores"}
        ]
    },
    {
        "id": "16",
        "nombre": "Agresión Sexual",
        "articulo": "Art. 250",
        "categoria": "Delitos sexuales",
        "descripcion": "Actos sexuales mediante violencia sin acceso carnal.",
        "pena_prision_min": 48,
        "pena_prision_max": 96,
        "pena_multa_min": 0,
        "pena_multa_max": 0,
        "tiene_pena_alternativa": False,
        "es_grave": True,
        "variables": [
            {"id": "victima_menor", "nombre": "Víctima menor de edad", "descripcion": "Activa inhabilitación especial", "pena_accesoria": "Inhabilitación especial para profesiones con menores"}
        ]
    },
    {
        "id": "17",
        "nombre": "Abuso Sexual",
        "articulo": "Art. 251",
        "categoria": "Delitos sexuales",
        "descripcion": "Actos sexuales sin consentimiento pero sin violencia.",
        "pena_prision_min": 36,
        "pena_prision_max": 72,
        "pena_multa_min": 0,
        "pena_multa_max": 0,
        "tiene_pena_alternativa": False,
        "es_grave": False,
        "variables": [
            {"id": "victima_menor", "nombre": "Víctima menor de edad", "descripcion": "Activa inhabilitación especial", "pena_accesoria": "Inhabilitación especial para profesiones con menores"}
        ]
    },
    {
        "id": "18",
        "nombre": "Acoso Sexual",
        "articulo": "Art. 256",
        "categoria": "Delitos sexuales",
        "descripcion": "Solicitar favores sexuales con prevalimiento.",
        "pena_prision_min": 12,
        "pena_prision_max": 36,
        "pena_multa_min": 6,
        "pena_multa_max": 18,
        "tiene_pena_alternativa": True,
        "es_grave": False,
        "variables": []
    },
    # DELITOS CONTRA EL PATRIMONIO
    {
        "id": "19",
        "nombre": "Hurto",
        "articulo": "Art. 357",
        "categoria": "Delitos contra el patrimonio",
        "descripcion": "Apoderarse de cosa mueble ajena.",
        "pena_prision_min": 12,
        "pena_prision_max": 36,
        "pena_multa_min": 6,
        "pena_multa_max": 18,
        "tiene_pena_alternativa": True,
        "es_grave": False,
        "variables": []
    },
    {
        "id": "20",
        "nombre": "Hurto Agravado",
        "articulo": "Art. 358",
        "categoria": "Delitos contra el patrimonio",
        "descripcion": "Hurto con circunstancias agravantes.",
        "pena_prision_min": 24,
        "pena_prision_max": 48,
        "pena_multa_min": 0,
        "pena_multa_max": 0,
        "tiene_pena_alternativa": False,
        "es_grave": False,
        "variables": []
    },
    {
        "id": "21",
        "nombre": "Robo",
        "articulo": "Art. 359",
        "categoria": "Delitos contra el patrimonio",
        "descripcion": "Apoderarse de cosa mueble usando violencia o intimidación.",
        "pena_prision_min": 48,
        "pena_prision_max": 96,
        "pena_multa_min": 0,
        "pena_multa_max": 0,
        "tiene_pena_alternativa": False,
        "es_grave": True,
        "variables": []
    },
    {
        "id": "22",
        "nombre": "Robo Agravado",
        "articulo": "Art. 360",
        "categoria": "Delitos contra el patrimonio",
        "descripcion": "Robo con agravantes (armas, bandas, etc.).",
        "pena_prision_min": 84,
        "pena_prision_max": 120,
        "pena_multa_min": 0,
        "pena_multa_max": 0,
        "tiene_pena_alternativa": False,
        "es_grave": True,
        "variables": []
    },
    {
        "id": "23",
        "nombre": "Estafa",
        "articulo": "Art. 365",
        "categoria": "Delitos contra el patrimonio",
        "descripcion": "Defraudar a otro mediante engaño.",
        "pena_prision_min": 6,
        "pena_prision_max": 36,
        "pena_multa_min": 6,
        "pena_multa_max": 12,
        "tiene_pena_alternativa": True,
        "es_grave": False,
        "variables": []
    },
    {
        "id": "24",
        "nombre": "Extorsión",
        "articulo": "Art. 373",
        "categoria": "Delitos contra el patrimonio",
        "descripcion": "Obligar a otro a entregar dinero mediante intimidación.",
        "pena_prision_min": 60,
        "pena_prision_max": 108,
        "pena_multa_min": 0,
        "pena_multa_max": 0,
        "tiene_pena_alternativa": False,
        "es_grave": True,
        "variables": []
    },
    {
        "id": "25",
        "nombre": "Daños",
        "articulo": "Art. 381",
        "categoria": "Delitos contra el patrimonio",
        "descripcion": "Destruir o deteriorar cosa ajena.",
        "pena_prision_min": 6,
        "pena_prision_max": 24,
        "pena_multa_min": 6,
        "pena_multa_max": 12,
        "tiene_pena_alternativa": True,
        "es_grave": False,
        "variables": []
    },
    # DELITOS INFORMÁTICOS
    {
        "id": "26",
        "nombre": "Acceso No Autorizado a Sistemas",
        "articulo": "Art. 398",
        "categoria": "Delitos informáticos",
        "descripcion": "Acceder sin autorización a sistemas informáticos.",
        "pena_prision_min": 36,
        "pena_prision_max": 72,
        "pena_multa_min": 12,
        "pena_multa_max": 24,
        "tiene_pena_alternativa": True,
        "es_grave": False,
        "variables": []
    },
    {
        "id": "27",
        "nombre": "Fraude Informático",
        "articulo": "Art. 400",
        "categoria": "Delitos informáticos",
        "descripcion": "Obtener beneficio económico mediante manipulación informática.",
        "pena_prision_min": 48,
        "pena_prision_max": 96,
        "pena_multa_min": 0,
        "pena_multa_max": 0,
        "tiene_pena_alternativa": False,
        "es_grave": True,
        "variables": []
    },
    # DELITOS CONTRA LA ADMINISTRACIÓN PÚBLICA
    {
        "id": "28",
        "nombre": "Cohecho",
        "articulo": "Art. 425",
        "categoria": "Delitos contra la administración pública",
        "descripcion": "Funcionario que solicite o reciba dádiva.",
        "pena_prision_min": 48,
        "pena_prision_max": 84,
        "pena_multa_min": 0,
        "pena_multa_max": 0,
        "tiene_pena_alternativa": False,
        "es_grave": True,
        "variables": [],
        "penas_accesorias": ["Inhabilitación especial para empleo o cargo público"]
    },
    {
        "id": "29",
        "nombre": "Malversación",
        "articulo": "Art. 422",
        "categoria": "Delitos contra la administración pública",
        "descripcion": "Funcionario que sustraiga caudales públicos.",
        "pena_prision_min": 48,
        "pena_prision_max": 72,
        "pena_multa_min": 0,
        "pena_multa_max": 0,
        "tiene_pena_alternativa": False,
        "es_grave": True,
        "variables": [],
        "penas_accesorias": ["Inhabilitación absoluta para cargo público"]
    },
    {
        "id": "30",
        "nombre": "Peculado",
        "articulo": "Art. 421",
        "categoria": "Delitos contra la administración pública",
        "descripcion": "Funcionario que se apropie de bienes públicos.",
        "pena_prision_min": 60,
        "pena_prision_max": 108,
        "pena_multa_min": 0,
        "pena_multa_max": 0,
        "tiene_pena_alternativa": False,
        "es_grave": True,
        "variables": [],
        "penas_accesorias": ["Inhabilitación absoluta para cargo público"]
    },
    # DELITOS CONTRA LA FE PÚBLICA
    {
        "id": "31",
        "nombre": "Falsificación de Documento Público",
        "articulo": "Art. 448",
        "categoria": "Delitos contra la fe pública",
        "descripcion": "Falsificar documento público.",
        "pena_prision_min": 36,
        "pena_prision_max": 72,
        "pena_multa_min": 0,
        "pena_multa_max": 0,
        "tiene_pena_alternativa": False,
        "es_grave": False,
        "variables": []
    },
    {
        "id": "32",
        "nombre": "Falsificación de Documento Privado",
        "articulo": "Art. 449",
        "categoria": "Delitos contra la fe pública",
        "descripcion": "Falsificar documento privado.",
        "pena_prision_min": 6,
        "pena_prision_max": 24,
        "pena_multa_min": 6,
        "pena_multa_max": 12,
        "tiene_pena_alternativa": True,
        "es_grave": False,
        "variables": []
    },
    # DELITOS DE DROGAS
    {
        "id": "33",
        "nombre": "Tráfico de Drogas",
        "articulo": "Art. 5 Ley Antidrogas",
        "categoria": "Delitos de drogas",
        "descripcion": "Tráfico ilícito de estupefacientes.",
        "pena_prision_min": 108,
        "pena_prision_max": 180,
        "pena_multa_min": 0,
        "pena_multa_max": 0,
        "tiene_pena_alternativa": False,
        "es_grave": True,
        "variables": []
    },
    {
        "id": "34",
        "nombre": "Posesión de Drogas para Consumo",
        "articulo": "Art. 8 Ley Antidrogas",
        "categoria": "Delitos de drogas",
        "descripcion": "Posesión de drogas para uso personal.",
        "pena_prision_min": 6,
        "pena_prision_max": 24,
        "pena_multa_min": 6,
        "pena_multa_max": 12,
        "tiene_pena_alternativa": True,
        "es_grave": False,
        "variables": []
    },
    # VIOLENCIA DOMÉSTICA
    {
        "id": "35",
        "nombre": "Violencia Doméstica",
        "articulo": "Art. 7 Ley VD",
        "categoria": "Violencia doméstica",
        "descripcion": "Violencia física o psicológica contra familiar.",
        "pena_prision_min": 12,
        "pena_prision_max": 36,
        "pena_multa_min": 0,
        "pena_multa_max": 0,
        "tiene_pena_alternativa": False,
        "es_grave": False,
        "variables": [
            {"id": "victima_menor", "nombre": "Víctima menor de edad", "descripcion": "Activa medidas de protección adicionales", "pena_accesoria": "Prohibición de aproximación"}
        ],
        "penas_accesorias": ["Prohibición de aproximación a la víctima", "Prohibición de comunicación"]
    },
    # DELITOS DE ARMAS
    {
        "id": "36",
        "nombre": "Portación Ilegal de Armas",
        "articulo": "Art. 37 Ley Armas",
        "categoria": "Delitos de armas",
        "descripcion": "Portar arma de fuego sin permiso.",
        "pena_prision_min": 48,
        "pena_prision_max": 84,
        "pena_multa_min": 0,
        "pena_multa_max": 0,
        "tiene_pena_alternativa": False,
        "es_grave": True,
        "variables": [],
        "penas_accesorias": ["Decomiso del arma"]
    },
    {
        "id": "37",
        "nombre": "Tenencia Ilegal de Armas",
        "articulo": "Art. 36 Ley Armas",
        "categoria": "Delitos de armas",
        "descripcion": "Tener arma de fuego sin registro.",
        "pena_prision_min": 36,
        "pena_prision_max": 72,
        "pena_multa_min": 12,
        "pena_multa_max": 24,
        "tiene_pena_alternativa": True,
        "es_grave": False,
        "variables": [],
        "penas_accesorias": ["Decomiso del arma"]
    },
    # LAVADO DE ACTIVOS
    {
        "id": "38",
        "nombre": "Lavado de Activos",
        "articulo": "Art. 3 Ley Lavado",
        "categoria": "Lavado de activos",
        "descripcion": "Ocultar o encubrir bienes de origen ilícito.",
        "pena_prision_min": 72,
        "pena_prision_max": 144,
        "pena_multa_min": 0,
        "pena_multa_max": 0,
        "tiene_pena_alternativa": False,
        "es_grave": True,
        "variables": [],
        "penas_accesorias": ["Decomiso de bienes"]
    },
    # ASOCIACIÓN ILÍCITA
    {
        "id": "39",
        "nombre": "Asociación Ilícita",
        "articulo": "Art. 332",
        "categoria": "Delitos contra el orden público",
        "descripcion": "Formar parte de organización criminal.",
        "pena_prision_min": 60,
        "pena_prision_max": 108,
        "pena_multa_min": 0,
        "pena_multa_max": 0,
        "tiene_pena_alternativa": False,
        "es_grave": True,
        "variables": []
    },
    {
        "id": "40",
        "nombre": "Pertenencia a Maras",
        "articulo": "Art. 333",
        "categoria": "Delitos contra el orden público",
        "descripcion": "Pertenecer a maras o pandillas.",
        "pena_prision_min": 60,
        "pena_prision_max": 108,
        "pena_multa_min": 0,
        "pena_multa_max": 0,
        "tiene_pena_alternativa": False,
        "es_grave": True,
        "variables": []
    },
]

# Circunstancias Agravantes (Art. 22 CP)
AGRAVANTES = [
    {"id": "alevosia", "articulo": "Art. 22.1 CP", "nombre": "Alevosía", "efecto": "mitad_superior"},
    {"id": "disfraz", "articulo": "Art. 22.2 CP", "nombre": "Disfraz, abuso de superioridad", "efecto": "mitad_superior"},
    {"id": "precio", "articulo": "Art. 22.3 CP", "nombre": "Precio, recompensa o promesa", "efecto": "mitad_superior"},
    {"id": "discriminacion", "articulo": "Art. 22.4 CP", "nombre": "Motivos discriminatorios", "efecto": "mitad_superior"},
    {"id": "ensanamiento", "articulo": "Art. 22.5 CP", "nombre": "Ensañamiento", "efecto": "mitad_superior"},
    {"id": "abuso_confianza", "articulo": "Art. 22.6 CP", "nombre": "Abuso de confianza", "efecto": "mitad_superior"},
    {"id": "caracter_publico", "articulo": "Art. 22.7 CP", "nombre": "Prevalerse del carácter público", "efecto": "mitad_superior"},
    {"id": "reincidencia", "articulo": "Art. 22.8 CP", "nombre": "Reincidencia", "efecto": "mitad_superior"},
    {"id": "genero", "articulo": "Art. 22.4 (mod)", "nombre": "Comisión por razones de género", "efecto": "mitad_superior"},
]

# Circunstancias Atenuantes (Art. 21 CP)
ATENUANTES = [
    {"id": "arrebato", "articulo": "Art. 21.3 CP", "nombre": "Arrebato u obcecación", "efecto": "mitad_inferior"},
    {"id": "confesion", "articulo": "Art. 21.4 CP", "nombre": "Confesión del delito", "efecto": "mitad_inferior"},
    {"id": "reparacion", "articulo": "Art. 21.5 CP", "nombre": "Reparación del daño", "efecto": "mitad_inferior"},
    {"id": "dilaciones", "articulo": "Art. 21.6 CP", "nombre": "Dilaciones indebidas", "efecto": "mitad_inferior"},
    {"id": "menor_edad", "articulo": "Art. 21.7 CP", "nombre": "Menor de 21 años", "efecto": "mitad_inferior"},
    {"id": "grave_adiccion", "articulo": "Art. 21.2 CP", "nombre": "Grave adicción", "efecto": "mitad_inferior"},
]

# Eximentes (Art. 20 CP)
EXIMENTES = [
    {"id": "anomalia", "articulo": "Art. 20.1 CP", "nombre": "Anomalía o alteración psíquica", "completa": True, "efecto": "exencion"},
    {"id": "intoxicacion", "articulo": "Art. 20.2 CP", "nombre": "Intoxicación plena", "completa": True, "efecto": "exencion"},
    {"id": "alteracion_percepcion", "articulo": "Art. 20.3 CP", "nombre": "Alteración de la percepción", "completa": True, "efecto": "exencion"},
    {"id": "legitima_defensa", "articulo": "Art. 20.4 CP", "nombre": "Legítima defensa", "completa": True, "efecto": "exencion"},
    {"id": "estado_necesidad", "articulo": "Art. 20.5 CP", "nombre": "Estado de necesidad", "completa": True, "efecto": "exencion"},
    {"id": "miedo_insuperable", "articulo": "Art. 20.6 CP", "nombre": "Miedo insuperable", "completa": True, "efecto": "exencion"},
    {"id": "eximente_incompleta", "articulo": "Art. 21.1 CP", "nombre": "Eximente incompleta", "completa": False, "efecto": "reduccion_1_2_grados"},
]

# =============================================
# FUNCIONES DE CÁLCULO
# =============================================

def meses_a_texto(meses: int) -> str:
    """Convierte meses a texto legible"""
    if meses >= 360:
        return "Prisión perpetua"
    if meses <= 0:
        return "0 meses"
    
    años = meses // 12
    meses_restantes = meses % 12
    
    if años > 0 and meses_restantes > 0:
        return f"{años} año{'s' if años > 1 else ''} y {meses_restantes} mes{'es' if meses_restantes > 1 else ''}"
    elif años > 0:
        return f"{años} año{'s' if años > 1 else ''}"
    else:
        return f"{meses_restantes} mes{'es' if meses_restantes > 1 else ''}"

def reducir_grado(minimo: int, maximo: int, grados: int = 1) -> tuple:
    """Reduce la pena en grados según Arts. 70-71 CP"""
    for _ in range(grados):
        # La pena inferior en grado es la mitad de la pena
        nuevo_max = minimo
        nuevo_min = max(1, minimo // 2)
        minimo, maximo = nuevo_min, nuevo_max
    return minimo, maximo

def aumentar_grado(minimo: int, maximo: int, grados: int = 1) -> tuple:
    """Aumenta la pena en grados"""
    for _ in range(grados):
        nuevo_min = maximo
        nuevo_max = min(360, int(maximo * 1.5))
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

def calcular_pena_individual(config: DelitoConfig, delito: dict) -> dict:
    """Calcula la pena individual para un delito con todas sus circunstancias"""
    
    # Determinar pena base según tipo seleccionado
    if config.pena_seleccionada == TipoPena.PRISION:
        pena_min = delito["pena_prision_min"]
        pena_max = delito["pena_prision_max"]
        tipo_pena = "prisión"
    else:
        pena_min = delito["pena_multa_min"]
        pena_max = delito["pena_multa_max"]
        tipo_pena = "multa (meses-cuota)"
    
    pena_base_min = pena_min
    pena_base_max = pena_max
    
    # Verificar eximente completa
    if config.eximente_completa and len(config.eximentes) > 0:
        return {
            "pena_min": 0,
            "pena_max": 0,
            "tipo_pena": tipo_pena,
            "exento": True,
            "pena_base_min": pena_base_min,
            "pena_base_max": pena_base_max
        }
    
    # 1. Aplicar grado de autoría
    if config.grado_autoria == GradoAutoria.COMPLICE:
        pena_min, pena_max = reducir_grado(pena_min, pena_max, 1)
    
    # 2. Aplicar grado de ejecución
    if config.grado_ejecucion in [GradoEjecucion.TENTATIVA_ACABADA, GradoEjecucion.TENTATIVA_INACABADA]:
        grados_reduccion = config.reduccion_tentativa
        pena_min, pena_max = reducir_grado(pena_min, pena_max, grados_reduccion)
    
    # 3. Aplicar eximentes incompletas (reducción 1-2 grados)
    for eximente_id in config.eximentes:
        eximente = next((e for e in EXIMENTES if e["id"] == eximente_id), None)
        if eximente and not eximente.get("completa", True):
            pena_min, pena_max = reducir_grado(pena_min, pena_max, 1)
    
    # 4. Aplicar atenuantes (mitad inferior)
    if len(config.atenuantes) > 0:
        pena_min, pena_max = aplicar_mitad_inferior(pena_min, pena_max)
        # Si hay más de 2 atenuantes, reducir un grado más
        if len(config.atenuantes) >= 2:
            pena_min, pena_max = reducir_grado(pena_min, pena_max, 1)
    
    # 5. Aplicar agravantes (mitad superior o grado superior)
    if len(config.agravantes) > 0:
        pena_min, pena_max = aplicar_mitad_superior(pena_min, pena_max)
        # Si hay más de 2 agravantes, aumentar un grado
        if len(config.agravantes) >= 2:
            pena_min, pena_max = aumentar_grado(pena_min, pena_max, 1)
    
    return {
        "pena_min": max(1, pena_min),
        "pena_max": max(1, pena_max),
        "tipo_pena": tipo_pena,
        "exento": False,
        "pena_base_min": pena_base_min,
        "pena_base_max": pena_base_max
    }

def aplicar_concurso(penas: List[dict], tipo_concurso: TipoConcurso) -> dict:
    """Aplica las reglas de concurso de delitos"""
    
    if len(penas) == 0:
        return {"pena_min": 0, "pena_max": 0, "descripcion": "Sin delitos"}
    
    if len(penas) == 1 or tipo_concurso == TipoConcurso.NINGUNO:
        return {
            "pena_min": penas[0]["pena_min"],
            "pena_max": penas[0]["pena_max"],
            "descripcion": "Delito único"
        }
    
    # Filtrar penas exentas
    penas_activas = [p for p in penas if not p.get("exento", False)]
    
    if len(penas_activas) == 0:
        return {"pena_min": 0, "pena_max": 0, "descripcion": "Todos los delitos exentos"}
    
    if tipo_concurso == TipoConcurso.REAL:
        # Art. 73 CP: Se suman todas las penas
        total_min = sum(p["pena_min"] for p in penas_activas)
        total_max = sum(p["pena_max"] for p in penas_activas)
        # Límite máximo de cumplimiento efectivo
        total_max = min(total_max, 360)  # 30 años máximo
        return {
            "pena_min": total_min,
            "pena_max": total_max,
            "descripcion": "Concurso Real (Art. 73 CP): Se acumulan las penas para cumplimiento simultáneo o sucesivo."
        }
    
    elif tipo_concurso == TipoConcurso.IDEAL:
        # Art. 77.2 CP: Pena del delito más grave en mitad superior
        delito_mas_grave = max(penas_activas, key=lambda p: p["pena_max"])
        pena_min, pena_max = aplicar_mitad_superior(
            delito_mas_grave["pena_min"],
            delito_mas_grave["pena_max"]
        )
        return {
            "pena_min": pena_min,
            "pena_max": pena_max,
            "descripcion": "Concurso Ideal (Art. 77.2 CP): Se aplica la pena del delito más grave en su mitad superior."
        }
    
    elif tipo_concurso == TipoConcurso.MEDIAL:
        # Art. 77.3 CP: Pena del delito más grave en grado superior
        delito_mas_grave = max(penas_activas, key=lambda p: p["pena_max"])
        pena_min, pena_max = aumentar_grado(
            delito_mas_grave["pena_min"],
            delito_mas_grave["pena_max"]
        )
        return {
            "pena_min": pena_min,
            "pena_max": pena_max,
            "descripcion": "Concurso Medial (Art. 77.3 CP): Se aplica la pena superior en grado a la del delito más grave."
        }
    
    return {"pena_min": 0, "pena_max": 0, "descripcion": "Tipo de concurso no reconocido"}

# =============================================
# ENDPOINTS
# =============================================

@api_router.get("/")
async def root():
    return {"message": "Motor de Cálculo de Penas - Derecho Penal Hondureño"}

@api_router.get("/delitos")
async def listar_delitos(
    categoria: Optional[str] = Query(None),
    busqueda: Optional[str] = Query(None)
):
    """Lista todos los delitos"""
    resultado = []
    for delito in DELITOS_HONDURAS:
        if categoria and categoria.lower() not in delito["categoria"].lower():
            continue
        if busqueda and busqueda.lower() not in delito["nombre"].lower():
            continue
        
        item = {
            **delito,
            "pena_principal_texto": f"Prisión de {meses_a_texto(delito['pena_prision_min'])} a {meses_a_texto(delito['pena_prision_max'])}"
        }
        if delito.get("tiene_pena_alternativa") and delito.get("pena_multa_max", 0) > 0:
            item["pena_alternativa_texto"] = f"Multa de {delito['pena_multa_min']} a {delito['pena_multa_max']} meses-cuota"
        
        resultado.append(item)
    
    return resultado

@api_router.get("/delitos/{delito_id}")
async def obtener_delito(delito_id: str):
    """Obtiene un delito específico"""
    delito = next((d for d in DELITOS_HONDURAS if d["id"] == delito_id), None)
    if not delito:
        raise HTTPException(status_code=404, detail="Delito no encontrado")
    
    item = {
        **delito,
        "pena_principal_texto": f"Prisión de {meses_a_texto(delito['pena_prision_min'])} a {meses_a_texto(delito['pena_prision_max'])}"
    }
    if delito.get("tiene_pena_alternativa") and delito.get("pena_multa_max", 0) > 0:
        item["pena_alternativa_texto"] = f"Multa de {delito['pena_multa_min']} a {delito['pena_multa_max']} meses-cuota"
    
    return item

@api_router.get("/categorias")
async def listar_categorias():
    """Lista categorías de delitos"""
    categorias = {}
    for d in DELITOS_HONDURAS:
        cat = d["categoria"]
        if cat in categorias:
            categorias[cat] += 1
        else:
            categorias[cat] = 1
    
    return [{"nombre": n, "cantidad": c} for n, c in sorted(categorias.items())]

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
    return [
        {"id": "autor_directo", "nombre": "Autor Directo", "articulo": "Art. 28 p. 1°", "descripcion": "Realiza el hecho por sí solo.", "efecto": "pena_integra"},
        {"id": "coautor", "nombre": "Coautor", "articulo": "Art. 28 p. 1°", "descripcion": "Realizan el hecho conjuntamente.", "efecto": "pena_integra"},
        {"id": "inductor", "nombre": "Inductor", "articulo": "Art. 28 p. 2º a)", "descripcion": "Induce directamente a otro a ejecutarlo.", "efecto": "pena_integra"},
        {"id": "cooperador_necesario", "nombre": "Cooperador Necesario", "articulo": "Art. 28 p. 2º b)", "descripcion": "Coopera con un acto sin el cual no se habría efectuado.", "efecto": "pena_integra"},
        {"id": "complice", "nombre": "Cómplice", "articulo": "Art. 29", "descripcion": "Coopera con actos anteriores o simultáneos (no necesarios).", "efecto": "pena_inferior_1_grado"},
    ]

@api_router.get("/grados-ejecucion")
async def listar_grados_ejecucion():
    return [
        {"id": "consumado", "nombre": "Consumado", "articulo": "Art. 61", "descripcion": "Se han realizado todos los actos de ejecución y producido el resultado.", "efecto": "pena_integra"},
        {"id": "tentativa_acabada", "nombre": "Tentativa Acabada", "articulo": "Art. 16.1 y 62", "descripcion": "Se practican todos los actos de ejecución pero no se produce el resultado.", "efecto": "pena_inferior_1_2_grados"},
        {"id": "tentativa_inacabada", "nombre": "Tentativa Inacabada", "articulo": "Art. 16.1 y 62", "descripcion": "Se practica solo parte de los actos de ejecución.", "efecto": "pena_inferior_1_2_grados"},
    ]

@api_router.get("/tipos-concurso")
async def listar_tipos_concurso():
    return [
        {"id": "real", "nombre": "Concurso Real", "articulo": "Art. 73 CP", "descripcion": "Cuando una persona ha cometido varios delitos a través de varias acciones independientes. Se aplican todas las penas correspondientes para su cumplimiento simultáneo o sucesivo."},
        {"id": "ideal", "nombre": "Concurso Ideal", "articulo": "Art. 77.2 CP", "descripcion": "Cuando un solo hecho constituye dos o más delitos. Se aplica la pena prevista para el delito más grave en su mitad superior."},
        {"id": "medial", "nombre": "Concurso Medial", "articulo": "Art. 77.3 CP", "descripcion": "Cuando un delito es medio necesario para cometer otro. Se aplica la pena superior en grado a la prevista para el delito más grave."},
    ]

@api_router.post("/calcular")
async def calcular_pena(request: CalculoRequest):
    """Calcula la pena total según el flujo completo"""
    
    resultados_individuales = []
    penas_para_concurso = []
    todas_penas_accesorias = []
    
    for config in request.delitos:
        # Buscar delito
        delito = next((d for d in DELITOS_HONDURAS if d["id"] == config.delito_id), None)
        if not delito:
            raise HTTPException(status_code=404, detail=f"Delito {config.delito_id} no encontrado")
        
        # Calcular pena individual
        resultado_pena = calcular_pena_individual(config, delito)
        penas_para_concurso.append(resultado_pena)
        
        # Recopilar penas accesorias
        penas_accesorias_delito = delito.get("penas_accesorias", [])
        for var_id in config.variables_activas:
            variable = next((v for v in delito.get("variables", []) if v["id"] == var_id), None)
            if variable and variable.get("pena_accesoria"):
                penas_accesorias_delito.append(variable["pena_accesoria"])
        
        todas_penas_accesorias.extend(penas_accesorias_delito)
        
        # Obtener nombres de agravantes/atenuantes aplicadas
        agravantes_nombres = [
            next((a["nombre"] for a in AGRAVANTES if a["id"] == aid), aid)
            for aid in config.agravantes
        ]
        atenuantes_nombres = [
            next((a["nombre"] for a in ATENUANTES if a["id"] == aid), aid)
            for aid in config.atenuantes
        ]
        
        # Formatear resultado individual
        if resultado_pena["exento"]:
            pena_texto = "EXENTO (eximente completa)"
        else:
            pena_texto = f"{meses_a_texto(resultado_pena['pena_min'])} a {meses_a_texto(resultado_pena['pena_max'])} de {resultado_pena['tipo_pena']}"
        
        resultados_individuales.append(DelitoResultado(
            delito_id=delito["id"],
            nombre=delito["nombre"],
            articulo=delito["articulo"],
            pena_base=PenaRango(
                minimo_meses=resultado_pena["pena_base_min"],
                maximo_meses=resultado_pena["pena_base_max"],
                tipo=resultado_pena["tipo_pena"]
            ),
            pena_individual=PenaRango(
                minimo_meses=resultado_pena["pena_min"],
                maximo_meses=resultado_pena["pena_max"],
                tipo=resultado_pena["tipo_pena"]
            ),
            pena_individual_texto=pena_texto,
            grado_autoria=config.grado_autoria.value,
            grado_ejecucion=config.grado_ejecucion.value,
            agravantes_aplicadas=agravantes_nombres,
            atenuantes_aplicadas=atenuantes_nombres,
            penas_accesorias=penas_accesorias_delito
        ))
    
    # Aplicar concurso
    resultado_concurso = aplicar_concurso(penas_para_concurso, request.tipo_concurso)
    
    # Formatear pena principal
    if resultado_concurso["pena_max"] == 0:
        pena_principal_texto = "EXENTO"
    else:
        pena_principal_texto = f"{meses_a_texto(resultado_concurso['pena_min'])} a {meses_a_texto(resultado_concurso['pena_max'])} de prisión"
    
    # Generar análisis jurídico
    analisis_juridico = generar_analisis_juridico(resultados_individuales, request.tipo_concurso, resultado_concurso)
    analisis_tecnico = generar_analisis_tecnico(resultados_individuales, request.tipo_concurso, resultado_concurso)
    
    # Eliminar duplicados en penas accesorias
    penas_accesorias_unicas = list(set(todas_penas_accesorias))
    
    return ResultadoCalculo(
        delitos_analizados=resultados_individuales,
        tipo_concurso=request.tipo_concurso.value if request.tipo_concurso != TipoConcurso.NINGUNO else "ninguno",
        concurso_descripcion=resultado_concurso["descripcion"],
        pena_principal=pena_principal_texto,
        pena_principal_minimo_meses=resultado_concurso["pena_min"],
        pena_principal_maximo_meses=resultado_concurso["pena_max"],
        penas_accesorias=penas_accesorias_unicas,
        analisis_juridico=analisis_juridico,
        analisis_tecnico=analisis_tecnico,
        fecha=datetime.now().strftime("%d/%m/%Y")
    )

def generar_analisis_juridico(delitos: List[DelitoResultado], tipo_concurso: TipoConcurso, resultado_concurso: dict) -> str:
    """Genera el análisis jurídico del cálculo"""
    lineas = []
    lineas.append("ANÁLISIS JURÍDICO DEL CÁLCULO DE PENA")
    lineas.append("=" * 40)
    lineas.append(f"Fecha: {datetime.now().strftime('%d/%m/%Y')}")
    lineas.append("")
    lineas.append(f"DELITOS ANALIZADOS ({len(delitos)}):")
    
    for i, d in enumerate(delitos, 1):
        lineas.append(f"\n{i}. {d.nombre}")
        lineas.append(f"   Artículo: {d.articulo}")
        lineas.append(f"   Participación: {d.grado_autoria}")
        lineas.append(f"   Ejecución: {d.grado_ejecucion}")
        lineas.append(f"   Pena individual: {d.pena_individual_texto}")
        
        if d.agravantes_aplicadas:
            lineas.append(f"   Agravantes: {', '.join(d.agravantes_aplicadas)}")
        if d.atenuantes_aplicadas:
            lineas.append(f"   Atenuantes: {', '.join(d.atenuantes_aplicadas)}")
    
    if len(delitos) > 1:
        lineas.append(f"\nTIPO DE CONCURSO: {tipo_concurso.value.upper()}")
        lineas.append(f"Descripción: {resultado_concurso['descripcion']}")
    
    return "\n".join(lineas)

def generar_analisis_tecnico(delitos: List[DelitoResultado], tipo_concurso: TipoConcurso, resultado_concurso: dict) -> str:
    """Genera el análisis técnico detallado"""
    lineas = []
    lineas.append("ANÁLISIS TÉCNICO DEL CÁLCULO")
    lineas.append("=" * 40)
    
    lineas.append("\nREGLAS APLICADAS:")
    
    for i, d in enumerate(delitos, 1):
        lineas.append(f"\nDelito {i} - {d.nombre}:")
        lineas.append(f"  • Pena base: {meses_a_texto(d.pena_base.minimo_meses)} a {meses_a_texto(d.pena_base.maximo_meses)}")
        
        if d.grado_autoria == "complice":
            lineas.append("  • Participación (cómplice): pena inferior en 1 grado")
        else:
            lineas.append(f"  • Participación ({d.grado_autoria}): pena íntegra")
        
        if d.grado_ejecucion != "consumado":
            lineas.append(f"  • Ejecución ({d.grado_ejecucion}): pena inferior en 1-2 grados")
        
        if d.agravantes_aplicadas:
            lineas.append(f"  • Agravantes: pena en mitad superior")
        if d.atenuantes_aplicadas:
            lineas.append(f"  • Atenuantes: pena en mitad inferior")
        
        lineas.append(f"  • Resultado: {d.pena_individual_texto}")
    
    if len(delitos) > 1:
        lineas.append(f"\nCONCURSO DE DELITOS:")
        lineas.append(f"  Tipo: {tipo_concurso.value}")
        lineas.append(f"  Efecto: {resultado_concurso['descripcion']}")
    
    lineas.append("\n" + "=" * 40)
    lineas.append("DISCLAIMER: Este cálculo es orientativo y no sustituye")
    lineas.append("la función jurisdiccional. La determinación definitiva")
    lineas.append("de la pena corresponde exclusivamente a los tribunales.")
    
    return "\n".join(lineas)

# Include the router in the main app
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

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
