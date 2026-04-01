#!/usr/bin/env python3
"""
Backend API Testing for Honduras Penal Calculator
Tests all endpoints according to the review request
"""

import requests
import json
import sys
from typing import Dict, Any, List

# Backend URL from frontend environment
BASE_URL = "https://pena-delito-ley.preview.emergentagent.com/api"

class TestResults:
    def __init__(self):
        self.passed = 0
        self.failed = 0
        self.errors = []
        
    def add_pass(self, test_name: str):
        self.passed += 1
        print(f"✅ PASS: {test_name}")
        
    def add_fail(self, test_name: str, error: str):
        self.failed += 1
        self.errors.append(f"{test_name}: {error}")
        print(f"❌ FAIL: {test_name} - {error}")
        
    def summary(self):
        total = self.passed + self.failed
        print(f"\n{'='*60}")
        print(f"TEST SUMMARY: {self.passed}/{total} tests passed")
        if self.errors:
            print(f"\nFAILED TESTS:")
            for error in self.errors:
                print(f"  - {error}")
        print(f"{'='*60}")
        return self.failed == 0

def test_get_categorias(results: TestResults):
    """Test GET /api/categorias endpoint"""
    try:
        response = requests.get(f"{BASE_URL}/categorias", timeout=10)
        
        if response.status_code != 200:
            results.add_fail("GET /categorias", f"Status code {response.status_code}")
            return
            
        data = response.json()
        
        if not isinstance(data, list):
            results.add_fail("GET /categorias", "Response is not a list")
            return
            
        if len(data) == 0:
            results.add_fail("GET /categorias", "No categories returned")
            return
            
        # Check structure of first category
        first_cat = data[0]
        required_fields = ["nombre", "cantidad_delitos"]
        for field in required_fields:
            if field not in first_cat:
                results.add_fail("GET /categorias", f"Missing field: {field}")
                return
                
        results.add_pass("GET /categorias - Returns array of categories with nombre and cantidad_delitos")
        print(f"  Found {len(data)} categories")
        
    except Exception as e:
        results.add_fail("GET /categorias", f"Exception: {str(e)}")

def test_get_delitos(results: TestResults):
    """Test GET /api/delitos endpoint"""
    try:
        response = requests.get(f"{BASE_URL}/delitos", timeout=10)
        
        if response.status_code != 200:
            results.add_fail("GET /delitos", f"Status code {response.status_code}")
            return
            
        data = response.json()
        
        if not isinstance(data, list):
            results.add_fail("GET /delitos", "Response is not a list")
            return
            
        if len(data) == 0:
            results.add_fail("GET /delitos", "No crimes returned")
            return
            
        # Check structure of first crime
        first_crime = data[0]
        required_fields = [
            "nombre", "articulo", "categoria", "ley",
            "pena_minima_meses", "pena_maxima_meses",
            "pena_minima_texto", "pena_maxima_texto",
            "es_grave", "permite_abreviado"
        ]
        
        for field in required_fields:
            if field not in first_crime:
                results.add_fail("GET /delitos", f"Missing field: {field}")
                return
                
        results.add_pass("GET /delitos - Returns array of crimes with all required fields")
        print(f"  Found {len(data)} crimes")
        
    except Exception as e:
        results.add_fail("GET /delitos", f"Exception: {str(e)}")

def test_get_delitos_filtered(results: TestResults):
    """Test GET /api/delitos with category filter"""
    try:
        category = "Delitos contra la vida"
        response = requests.get(f"{BASE_URL}/delitos", 
                              params={"categoria": category}, 
                              timeout=10)
        
        if response.status_code != 200:
            results.add_fail("GET /delitos?categoria", f"Status code {response.status_code}")
            return
            
        data = response.json()
        
        if not isinstance(data, list):
            results.add_fail("GET /delitos?categoria", "Response is not a list")
            return
            
        # Check that all returned crimes belong to the requested category
        for crime in data:
            if category.lower() not in crime.get("categoria", "").lower():
                results.add_fail("GET /delitos?categoria", f"Crime '{crime.get('nombre')}' not in requested category")
                return
                
        results.add_pass("GET /delitos?categoria - Filters by category correctly")
        print(f"  Found {len(data)} crimes in category '{category}'")
        
    except Exception as e:
        results.add_fail("GET /delitos?categoria", f"Exception: {str(e)}")

def test_get_delito_by_id(results: TestResults):
    """Test GET /api/delitos/{id} endpoint"""
    try:
        delito_id = "0"  # Test with first crime
        response = requests.get(f"{BASE_URL}/delitos/{delito_id}", timeout=10)
        
        if response.status_code != 200:
            results.add_fail("GET /delitos/{id}", f"Status code {response.status_code}")
            return
            
        data = response.json()
        
        if not isinstance(data, dict):
            results.add_fail("GET /delitos/{id}", "Response is not a dict")
            return
            
        # Check required fields
        required_fields = [
            "id", "nombre", "articulo", "categoria", "ley",
            "pena_minima_meses", "pena_maxima_meses",
            "pena_minima_texto", "pena_maxima_texto"
        ]
        
        for field in required_fields:
            if field not in data:
                results.add_fail("GET /delitos/{id}", f"Missing field: {field}")
                return
                
        if data["id"] != delito_id:
            results.add_fail("GET /delitos/{id}", f"ID mismatch: expected {delito_id}, got {data['id']}")
            return
            
        results.add_pass("GET /delitos/{id} - Returns specific crime by ID")
        print(f"  Retrieved crime: {data.get('nombre')}")
        
    except Exception as e:
        results.add_fail("GET /delitos/{id}", f"Exception: {str(e)}")

def test_get_agravantes(results: TestResults):
    """Test GET /api/agravantes endpoint"""
    try:
        response = requests.get(f"{BASE_URL}/agravantes", timeout=10)
        
        if response.status_code != 200:
            results.add_fail("GET /agravantes", f"Status code {response.status_code}")
            return
            
        data = response.json()
        
        if not isinstance(data, list):
            results.add_fail("GET /agravantes", "Response is not a list")
            return
            
        if len(data) == 0:
            results.add_fail("GET /agravantes", "No aggravating circumstances returned")
            return
            
        # Check structure
        first_agr = data[0]
        required_fields = ["id", "nombre", "incremento"]
        for field in required_fields:
            if field not in first_agr:
                results.add_fail("GET /agravantes", f"Missing field: {field}")
                return
                
        results.add_pass("GET /agravantes - Returns aggravating circumstances with id, nombre, incremento")
        print(f"  Found {len(data)} aggravating circumstances")
        
    except Exception as e:
        results.add_fail("GET /agravantes", f"Exception: {str(e)}")

def test_get_atenuantes(results: TestResults):
    """Test GET /api/atenuantes endpoint"""
    try:
        response = requests.get(f"{BASE_URL}/atenuantes", timeout=10)
        
        if response.status_code != 200:
            results.add_fail("GET /atenuantes", f"Status code {response.status_code}")
            return
            
        data = response.json()
        
        if not isinstance(data, list):
            results.add_fail("GET /atenuantes", "Response is not a list")
            return
            
        if len(data) == 0:
            results.add_fail("GET /atenuantes", "No mitigating circumstances returned")
            return
            
        # Check structure
        first_aten = data[0]
        required_fields = ["id", "nombre", "reduccion"]
        for field in required_fields:
            if field not in first_aten:
                results.add_fail("GET /atenuantes", f"Missing field: {field}")
                return
                
        results.add_pass("GET /atenuantes - Returns mitigating circumstances with id, nombre, reduccion")
        print(f"  Found {len(data)} mitigating circumstances")
        
    except Exception as e:
        results.add_fail("GET /atenuantes", f"Exception: {str(e)}")

def test_post_calcular(results: TestResults):
    """Test POST /api/calcular endpoint"""
    try:
        # Test with Robo (should allow abreviado procedure)
        payload = {
            "delito_id": "24",  # Robo
            "tiene_agravantes": True,
            "tiene_atenuantes": False,
            "es_reincidente": False,
            "repara_dano": False,
            "confiesa": True,
            "agravantes_seleccionadas": ["uso_armas"],
            "atenuantes_seleccionadas": []
        }
        
        response = requests.post(f"{BASE_URL}/calcular", 
                               json=payload, 
                               timeout=10)
        
        if response.status_code != 200:
            results.add_fail("POST /calcular", f"Status code {response.status_code}")
            return
            
        data = response.json()
        
        # Check required fields in response
        required_fields = [
            "delito", "pena_base_minima_meses", "pena_base_maxima_meses",
            "pena_ajustada_minima_meses", "pena_ajustada_maxima_meses",
            "pena_minima_texto", "pena_maxima_texto",
            "tipo_procedimiento", "procedimiento_descripcion",
            "puede_procedimiento_abreviado", "agravantes_aplicadas",
            "observaciones"
        ]
        
        for field in required_fields:
            if field not in data:
                results.add_fail("POST /calcular", f"Missing field: {field}")
                return
                
        # Check that delito object is present
        if not isinstance(data["delito"], dict):
            results.add_fail("POST /calcular", "delito field is not an object")
            return
            
        results.add_pass("POST /calcular - Returns penalty calculation with all required fields")
        print(f"  Crime: {data['delito'].get('nombre')}")
        print(f"  Procedure type: {data['tipo_procedimiento']}")
        print(f"  Can use abreviado: {data['puede_procedimiento_abreviado']}")
        
    except Exception as e:
        results.add_fail("POST /calcular", f"Exception: {str(e)}")

def test_procedure_logic(results: TestResults):
    """Test procedure type determination logic"""
    try:
        # Test 1: Crime with pena_maxima > 108 months should be "ordinario"
        # Using Homicidio Simple (id=0) with pena_maxima = 240 months
        payload1 = {
            "delito_id": "0",  # Homicidio Simple
            "tiene_agravantes": False,
            "tiene_atenuantes": False,
            "es_reincidente": False,
            "repara_dano": False,
            "confiesa": False,
            "agravantes_seleccionadas": [],
            "atenuantes_seleccionadas": []
        }
        
        response1 = requests.post(f"{BASE_URL}/calcular", json=payload1, timeout=10)
        if response1.status_code == 200:
            data1 = response1.json()
            if data1["tipo_procedimiento"] != "ordinario":
                results.add_fail("Procedure Logic - Ordinario", 
                               f"Expected 'ordinario' for crime >9 years, got '{data1['tipo_procedimiento']}'")
                return
        
        # Test 2: Crime with pena_maxima ≤ 108 months should be "abreviado" if permite_abreviado=true
        # Using Robo (id=24) with pena_maxima = 96 months
        payload2 = {
            "delito_id": "24",  # Robo
            "tiene_agravantes": False,
            "tiene_atenuantes": False,
            "es_reincidente": False,
            "repara_dano": False,
            "confiesa": False,
            "agravantes_seleccionadas": [],
            "atenuantes_seleccionadas": []
        }
        
        response2 = requests.post(f"{BASE_URL}/calcular", json=payload2, timeout=10)
        if response2.status_code == 200:
            data2 = response2.json()
            if data2["tipo_procedimiento"] != "abreviado":
                results.add_fail("Procedure Logic - Abreviado", 
                               f"Expected 'abreviado' for Robo ≤9 years, got '{data2['tipo_procedimiento']}'")
                return
        
        # Test 3: Reincidente should NOT allow abreviado
        payload3 = {
            "delito_id": "24",  # Robo
            "tiene_agravantes": False,
            "tiene_atenuantes": False,
            "es_reincidente": True,  # This should prevent abreviado
            "repara_dano": False,
            "confiesa": False,
            "agravantes_seleccionadas": [],
            "atenuantes_seleccionadas": []
        }
        
        response3 = requests.post(f"{BASE_URL}/calcular", json=payload3, timeout=10)
        if response3.status_code == 200:
            data3 = response3.json()
            if data3["tipo_procedimiento"] == "abreviado":
                results.add_fail("Procedure Logic - Reincidente", 
                               "Reincidente should NOT allow abreviado procedure")
                return
        
        # Test 4: Special procedure for Femicidio
        payload4 = {
            "delito_id": "2",  # Femicidio
            "tiene_agravantes": False,
            "tiene_atenuantes": False,
            "es_reincidente": False,
            "repara_dano": False,
            "confiesa": False,
            "agravantes_seleccionadas": [],
            "atenuantes_seleccionadas": []
        }
        
        response4 = requests.post(f"{BASE_URL}/calcular", json=payload4, timeout=10)
        if response4.status_code == 200:
            data4 = response4.json()
            if data4["tipo_procedimiento"] != "especial":
                results.add_fail("Procedure Logic - Especial", 
                               f"Expected 'especial' for Femicidio, got '{data4['tipo_procedimiento']}'")
                return
        
        results.add_pass("Procedure Logic - All procedure type determinations work correctly")
        
    except Exception as e:
        results.add_fail("Procedure Logic", f"Exception: {str(e)}")

def test_rebaja_abreviado(results: TestResults):
    """Test rebaja por procedimiento abreviado"""
    try:
        # Test with confession (should get 25% reduction)
        payload = {
            "delito_id": "24",  # Robo
            "tiene_agravantes": False,
            "tiene_atenuantes": False,
            "es_reincidente": False,
            "repara_dano": False,
            "confiesa": True,  # Should trigger rebaja
            "agravantes_seleccionadas": [],
            "atenuantes_seleccionadas": []
        }
        
        response = requests.post(f"{BASE_URL}/calcular", json=payload, timeout=10)
        
        if response.status_code != 200:
            results.add_fail("Rebaja Abreviado", f"Status code {response.status_code}")
            return
            
        data = response.json()
        
        if "rebaja_por_abreviado" not in data:
            results.add_fail("Rebaja Abreviado", "Missing rebaja_por_abreviado field")
            return
            
        if data["rebaja_por_abreviado"] is None:
            results.add_fail("Rebaja Abreviado", "rebaja_por_abreviado should not be null when confiesa=true")
            return
            
        results.add_pass("Rebaja Abreviado - Confession triggers rebaja calculation")
        print(f"  Rebaja info: {data['rebaja_por_abreviado']}")
        
    except Exception as e:
        results.add_fail("Rebaja Abreviado", f"Exception: {str(e)}")

def main():
    """Run all backend tests"""
    print("🧪 TESTING HONDURAS PENAL CALCULATOR BACKEND API")
    print(f"Base URL: {BASE_URL}")
    print("="*60)
    
    results = TestResults()
    
    # Run all tests
    test_get_categorias(results)
    test_get_delitos(results)
    test_get_delitos_filtered(results)
    test_get_delito_by_id(results)
    test_get_agravantes(results)
    test_get_atenuantes(results)
    test_post_calcular(results)
    test_procedure_logic(results)
    test_rebaja_abreviado(results)
    
    # Print summary
    success = results.summary()
    
    if success:
        print("\n🎉 ALL TESTS PASSED! Backend API is working correctly.")
        sys.exit(0)
    else:
        print(f"\n💥 {results.failed} TESTS FAILED! See details above.")
        sys.exit(1)

if __name__ == "__main__":
    main()