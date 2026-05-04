"""
Backend tests for the Honduran Penalty Calculator.
Per system rules, the test target is http://localhost:8001 (review request explicitly says so).
"""
import sys
import requests

BASE = "http://localhost:8001/api"

results = []
def log(name, ok, detail=""):
    status = "PASS" if ok else "FAIL"
    results.append((name, ok, detail))
    print(f"[{status}] {name}" + (f" -> {detail}" if detail else ""))

def section(t):
    print(f"\n=== {t} ===")

# ----------------------------------------------------------
section("1. GET /api/clasificaciones")
try:
    r = requests.get(f"{BASE}/clasificaciones", timeout=15)
    ok = r.status_code == 200
    data = r.json() if ok else []
    ok = ok and isinstance(data, list) and len(data) > 0 and all(
        "nombre" in c and "cantidad" in c for c in data
    )
    log("clasificaciones returns array of {nombre, cantidad}", ok,
        f"count={len(data) if isinstance(data, list) else '-'}")
except Exception as e:
    log("clasificaciones", False, str(e))

# ----------------------------------------------------------
section("2. GET /api/delitos?limit=1000")
required_fields = [
    "id", "nombre", "articulo", "conducta", "clasificacion",
    "pena_minima_meses", "pena_maxima_meses",
    "pena_alternativa_min", "pena_alternativa_max",
    "tiene_pena_alternativa", "penas_accesorias", "es_grave", "pena_texto"
]
delitos_all = []
try:
    r = requests.get(f"{BASE}/delitos", params={"limit": 1000}, timeout=20)
    ok = r.status_code == 200
    delitos_all = r.json() if ok else []
    n = len(delitos_all)
    ok_count = ok and n >= 80
    log("/delitos returns >= 80 entries", ok_count, f"count={n}")
    if delitos_all:
        sample = delitos_all[0]
        missing = [f for f in required_fields if f not in sample]
        log("/delitos entry has all required fields", not missing,
            f"missing={missing}" if missing else f"sample={sample.get('nombre')}")
except Exception as e:
    log("/delitos", False, str(e))

# ----------------------------------------------------------
section("3. /delitos filters")
try:
    r = requests.get(f"{BASE}/delitos", params={"busqueda": "hurto"}, timeout=15)
    ok = r.status_code == 200
    arr = r.json() if ok else []
    matched = all("hurto" in (d.get("nombre", "").lower() + d.get("conducta", "").lower() + d.get("articulo", "").lower()) for d in arr) if arr else False
    log("busqueda=hurto filters", ok and len(arr) > 0 and matched,
        f"count={len(arr)}")
except Exception as e:
    log("busqueda filter", False, str(e))

try:
    r = requests.get(f"{BASE}/delitos",
                     params={"clasificacion": "Delitos contra el patrimonio"}, timeout=15)
    ok = r.status_code == 200
    arr = r.json() if ok else []
    all_match = all("patrimonio" in d.get("clasificacion", "").lower() for d in arr) if arr else False
    log("clasificacion filter works", ok and len(arr) > 0 and all_match,
        f"count={len(arr)}")
except Exception as e:
    log("clasificacion filter", False, str(e))

# ----------------------------------------------------------
section("4. GET /api/delitos/count")
try:
    r = requests.get(f"{BASE}/delitos/count", timeout=10)
    ok = r.status_code == 200 and isinstance(r.json().get("total"), int)
    log("/delitos/count returns {total:int}", ok, f"body={r.json()}")
except Exception as e:
    log("/delitos/count", False, str(e))

# ----------------------------------------------------------
section("5. GET /api/delitos/{id}")
sample_id = delitos_all[0]["id"] if delitos_all else None
if sample_id:
    try:
        r = requests.get(f"{BASE}/delitos/{sample_id}", timeout=10)
        ok = r.status_code == 200 and r.json().get("id") == sample_id
        log("/delitos/{valid_id} returns delito", ok,
            f"name={r.json().get('nombre')}")
    except Exception as e:
        log("/delitos/{valid_id}", False, str(e))

try:
    r = requests.get(f"{BASE}/delitos/000000000000000000000000", timeout=10)
    log("/delitos/{invalid_id} returns 404", r.status_code == 404,
        f"status={r.status_code}")
except Exception as e:
    log("/delitos/{invalid_id}", False, str(e))

# ----------------------------------------------------------
section("6-8. POST/PUT/DELETE /api/delitos")
created_id = None
try:
    body = {
        "nombre": "Delito de prueba QA",
        "articulo": "Art. 999",
        "conducta": "Conducta de prueba para test automatizado",
        "clasificacion": "Pruebas",
        "pena_minima_meses": 12,
        "pena_maxima_meses": 36,
        "pena_alternativa_min": 0,
        "pena_alternativa_max": 0,
        "tiene_pena_alternativa": False,
        "penas_accesorias": ["Multa"],
        "es_grave": False
    }
    r = requests.post(f"{BASE}/delitos", json=body, timeout=10)
    ok = r.status_code == 200 and r.json().get("id")
    created_id = r.json().get("id") if ok else None
    log("POST /delitos creates delito", ok, f"id={created_id}")
except Exception as e:
    log("POST /delitos", False, str(e))

if created_id:
    try:
        r = requests.put(f"{BASE}/delitos/{created_id}",
                         json={"nombre": "Delito de prueba QA - Editado"}, timeout=10)
        ok = r.status_code == 200
        rg = requests.get(f"{BASE}/delitos/{created_id}", timeout=10)
        verified = rg.status_code == 200 and rg.json().get("nombre") == "Delito de prueba QA - Editado"
        log("PUT /delitos/{id} updates delito", ok and verified, f"new_name={rg.json().get('nombre')}")
    except Exception as e:
        log("PUT /delitos/{id}", False, str(e))

    try:
        r = requests.delete(f"{BASE}/delitos/{created_id}", timeout=10)
        ok = r.status_code == 200
        rg = requests.get(f"{BASE}/delitos/{created_id}", timeout=10)
        gone = rg.status_code == 404
        log("DELETE /delitos/{id} removes delito", ok and gone,
            f"status={r.status_code}, get_after={rg.status_code}")
    except Exception as e:
        log("DELETE /delitos/{id}", False, str(e))

# ----------------------------------------------------------
section("9-11. agravantes / atenuantes / eximentes")
for name, min_count, fields in [
    ("agravantes", 8, ["id", "nombre", "articulo", "descripcion"]),
    ("atenuantes", 7, ["id", "nombre", "articulo", "descripcion"]),
    ("eximentes",  5, ["id", "nombre", "articulo"]),
]:
    try:
        r = requests.get(f"{BASE}/{name}", timeout=10)
        ok = r.status_code == 200
        data = r.json() if ok else []
        size_ok = len(data) >= min_count
        if data:
            field_ok = all(all(f in item for f in fields) for item in data)
        else:
            field_ok = False
        log(f"/{name} returns >={min_count} items with required fields",
            ok and size_ok and field_ok, f"count={len(data)}")
    except Exception as e:
        log(f"/{name}", False, str(e))

# ----------------------------------------------------------
section("12-14. grados-autoria / grados-ejecucion / tipos-concurso")
try:
    r = requests.get(f"{BASE}/grados-autoria", timeout=10)
    ids = [g["id"] for g in r.json()]
    ok = r.status_code == 200 and "autor_directo" in ids and "complice" in ids
    log("/grados-autoria has autor_directo & complice", ok, f"ids={ids}")
except Exception as e:
    log("/grados-autoria", False, str(e))

try:
    r = requests.get(f"{BASE}/grados-ejecucion", timeout=10)
    ids = [g["id"] for g in r.json()]
    ok = r.status_code == 200 and "consumado" in ids and "tentativa_acabada" in ids
    log("/grados-ejecucion has consumado & tentativa_acabada", ok, f"ids={ids}")
except Exception as e:
    log("/grados-ejecucion", False, str(e))

try:
    r = requests.get(f"{BASE}/tipos-concurso", timeout=10)
    ids = [g["id"] for g in r.json()]
    ok = r.status_code == 200 and all(x in ids for x in ["real", "ideal", "medial"])
    log("/tipos-concurso has real, ideal, medial", ok, f"ids={ids}")
except Exception as e:
    log("/tipos-concurso", False, str(e))

# ----------------------------------------------------------
section("15. POST /api/calcular - scenarios")

hurto = next((d for d in delitos_all if d["nombre"] == "Hurto"), None)
robo = next((d for d in delitos_all if d["nombre"] == "Robo"), None)

def base_cfg(delito_id, **overrides):
    cfg = {
        "delito_id": delito_id,
        "pena_seleccionada": "prision",
        "variables_activas": [],
        "grado_autoria": "autor_directo",
        "grado_ejecucion": "consumado",
        "reduccion_tentativa": 1,
        "agravantes": [],
        "atenuantes": [],
        "eximentes": [],
        "eximente_completa": False,
    }
    cfg.update(overrides)
    return cfg

required_resp_fields = [
    "pena_principal", "pena_principal_minimo_meses", "pena_principal_maximo_meses",
    "delitos_analizados", "tipo_concurso", "concurso_descripcion",
    "penas_accesorias", "analisis_juridico", "fecha", "disclaimer"
]

def call_calc(payload):
    return requests.post(f"{BASE}/calcular", json=payload, timeout=20)

# (a) base case
if hurto:
    payload = {"delitos": [base_cfg(hurto["id"])], "tipo_concurso": "ninguno"}
    r = call_calc(payload)
    ok = r.status_code == 200
    data = r.json() if ok else {}
    fields_ok = all(f in data for f in required_resp_fields)
    minmax_ok = (data.get("pena_principal_minimo_meses") == hurto["pena_minima_meses"] and
                 data.get("pena_principal_maximo_meses") == hurto["pena_maxima_meses"])
    log("(a) base case Hurto: response has all fields & equals base pena",
        ok and fields_ok and minmax_ok,
        f"min={data.get('pena_principal_minimo_meses')} max={data.get('pena_principal_maximo_meses')} (expected {hurto['pena_minima_meses']}-{hurto['pena_maxima_meses']})")

# (b) complice -> reduced
if hurto:
    payload = {"delitos": [base_cfg(hurto["id"], grado_autoria="complice")], "tipo_concurso": "ninguno"}
    r = call_calc(payload)
    data = r.json() if r.status_code == 200 else {}
    new_min = data.get("pena_principal_minimo_meses")
    new_max = data.get("pena_principal_maximo_meses")
    reduced = (new_max is not None and new_max < hurto["pena_maxima_meses"]
               and new_min is not None and new_min <= hurto["pena_minima_meses"])
    log("(b) complice reduces pena", reduced,
        f"min={new_min} max={new_max} (base {hurto['pena_minima_meses']}-{hurto['pena_maxima_meses']})")

# (c) one agravante -> mitad superior
if hurto:
    payload = {"delitos": [base_cfg(hurto["id"], agravantes=["alevosia"])], "tipo_concurso": "ninguno"}
    r = call_calc(payload)
    data = r.json() if r.status_code == 200 else {}
    new_min = data.get("pena_principal_minimo_meses")
    new_max = data.get("pena_principal_maximo_meses")
    expected_min = (hurto["pena_minima_meses"] + hurto["pena_maxima_meses"]) // 2
    ok = new_min == expected_min and new_max == hurto["pena_maxima_meses"]
    log("(c) 1 agravante -> mitad superior", ok,
        f"min={new_min} (expected {expected_min}) max={new_max} (expected {hurto['pena_maxima_meses']})")

# (d) one atenuante -> mitad inferior
if hurto:
    payload = {"delitos": [base_cfg(hurto["id"], atenuantes=["confesion"])], "tipo_concurso": "ninguno"}
    r = call_calc(payload)
    data = r.json() if r.status_code == 200 else {}
    new_min = data.get("pena_principal_minimo_meses")
    new_max = data.get("pena_principal_maximo_meses")
    expected_max = (hurto["pena_minima_meses"] + hurto["pena_maxima_meses"]) // 2
    ok = new_min == hurto["pena_minima_meses"] and new_max == expected_max
    log("(d) 1 atenuante -> mitad inferior", ok,
        f"min={new_min} (expected {hurto['pena_minima_meses']}) max={new_max} (expected {expected_max})")

# (e) two delitos, real -> sum (with cap)
if hurto and robo:
    payload = {"delitos": [base_cfg(hurto["id"]), base_cfg(robo["id"])], "tipo_concurso": "real"}
    r = call_calc(payload)
    data = r.json() if r.status_code == 200 else {}
    expected_min_naive = hurto["pena_minima_meses"] + robo["pena_minima_meses"]
    expected_max_naive = hurto["pena_maxima_meses"] + robo["pena_maxima_meses"]
    pena_mayor = max(hurto["pena_maxima_meses"], robo["pena_maxima_meses"])
    limite = min(pena_mayor * 3, 480)
    expected_max = min(expected_max_naive, limite)
    expected_min = min(expected_min_naive, expected_max)
    new_min = data.get("pena_principal_minimo_meses")
    new_max = data.get("pena_principal_maximo_meses")
    # Penas accumulate: must exceed individual maxes
    accumulated = (new_min is not None and new_max is not None
                   and new_min > hurto["pena_minima_meses"]
                   and new_max > robo["pena_maxima_meses"] - 1)  # at least equal
    ok = new_min == expected_min and new_max == expected_max
    log("(e) concurso real: penas accumulate (with cap)", ok,
        f"min={new_min} (expected {expected_min}) max={new_max} (expected {expected_max}) accumulated={accumulated}")

# (f) two delitos, ideal -> mitad superior of more grave
if hurto and robo:
    payload = {"delitos": [base_cfg(hurto["id"]), base_cfg(robo["id"])], "tipo_concurso": "ideal"}
    r = call_calc(payload)
    data = r.json() if r.status_code == 200 else {}
    grave = robo if robo["pena_maxima_meses"] >= hurto["pena_maxima_meses"] else hurto
    expected_min = (grave["pena_minima_meses"] + grave["pena_maxima_meses"]) // 2
    expected_max = grave["pena_maxima_meses"]
    new_min = data.get("pena_principal_minimo_meses")
    new_max = data.get("pena_principal_maximo_meses")
    ok = new_min == expected_min and new_max == expected_max
    log("(f) concurso ideal: pena del más grave en mitad superior", ok,
        f"min={new_min} (expected {expected_min}) max={new_max} (expected {expected_max})")

# ----------------------------------------------------------
section("Summary")
total = len(results)
passed = sum(1 for _, ok, _ in results if ok)
print(f"\nResults: {passed}/{total} passed")
for name, ok, detail in results:
    if not ok:
        print(f"  FAIL: {name}: {detail}")

sys.exit(0 if passed == total else 1)
