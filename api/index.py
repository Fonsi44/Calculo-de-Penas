import os
import sys

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from backend.server import app
from mangum import Mangum

handler = Mangum(app, lifespan="off")
