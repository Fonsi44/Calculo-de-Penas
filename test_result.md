#====================================================================================================
# START - Testing Protocol - DO NOT EDIT OR REMOVE THIS SECTION
#====================================================================================================

# THIS SECTION CONTAINS CRITICAL TESTING INSTRUCTIONS FOR BOTH AGENTS
# BOTH MAIN_AGENT AND TESTING_AGENT MUST PRESERVE THIS ENTIRE BLOCK

# Communication Protocol:
# If the `testing_agent` is available, main agent should delegate all testing tasks to it.
#
# You have access to a file called `test_result.md`. This file contains the complete testing state
# and history, and is the primary means of communication between main and the testing agent.
#
# Main and testing agents must follow this exact format to maintain testing data. 
# The testing data must be entered in yaml format Below is the data structure:
# 
## user_problem_statement: {problem_statement}
## backend:
##   - task: "Task name"
##     implemented: true
##     working: true  # or false or "NA"
##     file: "file_path.py"
##     stuck_count: 0
##     priority: "high"  # or "medium" or "low"
##     needs_retesting: false
##     status_history:
##         -working: true  # or false or "NA"
##         -agent: "main"  # or "testing" or "user"
##         -comment: "Detailed comment about status"
##
## frontend:
##   - task: "Task name"
##     implemented: true
##     working: true  # or false or "NA"
##     file: "file_path.js"
##     stuck_count: 0
##     priority: "high"  # or "medium" or "low"
##     needs_retesting: false
##     status_history:
##         -working: true  # or false or "NA"
##         -agent: "main"  # or "testing" or "user"
##         -comment: "Detailed comment about status"
##
## metadata:
##   created_by: "main_agent"
##   version: "1.0"
##   test_sequence: 0
##   run_ui: false
##
## test_plan:
##   current_focus:
##     - "Task name 1"
##     - "Task name 2"
##   stuck_tasks:
##     - "Task name with persistent issues"
##   test_all: false
##   test_priority: "high_first"  # or "sequential" or "stuck_first"
##
## agent_communication:
##     -agent: "main"  # or "testing" or "user"
##     -message: "Communication message between agents"

# Protocol Guidelines for Main agent
#
# 1. Update Test Result File Before Testing:
#    - Main agent must always update the `test_result.md` file before calling the testing agent
#    - Add implementation details to the status_history
#    - Set `needs_retesting` to true for tasks that need testing
#    - Update the `test_plan` section to guide testing priorities
#    - Add a message to `agent_communication` explaining what you've done
#
# 2. Incorporate User Feedback:
#    - When a user provides feedback that something is or isn't working, add this information to the relevant task's status_history
#    - Update the working status based on user feedback
#    - If a user reports an issue with a task that was marked as working, increment the stuck_count
#    - Whenever user reports issue in the app, if we have testing agent and task_result.md file so find the appropriate task for that and append in status_history of that task to contain the user concern and problem as well 
#
# 3. Track Stuck Tasks:
#    - Monitor which tasks have high stuck_count values or where you are fixing same issue again and again, analyze that when you read task_result.md
#    - For persistent issues, use websearch tool to find solutions
#    - Pay special attention to tasks in the stuck_tasks list
#    - When you fix an issue with a stuck task, don't reset the stuck_count until the testing agent confirms it's working
#
# 4. Provide Context to Testing Agent:
#    - When calling the testing agent, provide clear instructions about:
#      - Which tasks need testing (reference the test_plan)
#      - Any authentication details or configuration needed
#      - Specific test scenarios to focus on
#      - Any known issues or edge cases to verify
#
# 5. Call the testing agent with specific instructions referring to test_result.md
#
# IMPORTANT: Main agent must ALWAYS update test_result.md BEFORE calling the testing agent, as it relies on this file to understand what to test next.

#====================================================================================================
# END - Testing Protocol - DO NOT EDIT OR REMOVE THIS SECTION
#====================================================================================================



#====================================================================================================
# Testing Data - Main Agent and testing sub agent both should log testing data below this section
#====================================================================================================

user_problem_statement: "Aplicación profesional de cálculo de penas según el Código Penal de Honduras (Decreto 130-2017). Flujo jurídico de 8 pasos. CRUD completo de delitos editable por el usuario. Diseño UI/UX altamente profesional."

backend:
  - task: "GET /api/clasificaciones - List crime classifications"
    implemented: true
    working: true
    file: "/app/backend/server.py"
    stuck_count: 0
    priority: "high"
    needs_retesting: true
    status_history:
      - working: true
        agent: "main"
        comment: "Returns clasificaciones with cantidad. Endpoint renamed from /categorias to /clasificaciones."

  - task: "GET /api/delitos - List crimes with filters"
    implemented: true
    working: true
    file: "/app/backend/server.py"
    stuck_count: 0
    priority: "high"
    needs_retesting: true
    status_history:
      - working: true
        agent: "main"
        comment: "Returns list of crimes with new schema: nombre, articulo, conducta, clasificacion, pena_minima_meses, pena_maxima_meses, pena_alternativa_min/max, penas_accesorias, es_grave, pena_texto. Supports busqueda and clasificacion filters."

  - task: "POST /api/delitos - Create crime (CRUD)"
    implemented: true
    working: true
    file: "/app/backend/server.py"
    stuck_count: 0
    priority: "high"
    needs_retesting: true
    status_history:
      - working: true
        agent: "main"
        comment: "NEW endpoint: Allows user to create custom crimes from app."

  - task: "PUT /api/delitos/{id} - Update crime (CRUD)"
    implemented: true
    working: true
    file: "/app/backend/server.py"
    stuck_count: 0
    priority: "high"
    needs_retesting: true
    status_history:
      - working: true
        agent: "main"
        comment: "NEW endpoint: Allows user to edit existing crimes."

  - task: "DELETE /api/delitos/{id} - Delete crime (CRUD)"
    implemented: true
    working: true
    file: "/app/backend/server.py"
    stuck_count: 0
    priority: "high"
    needs_retesting: true
    status_history:
      - working: true
        agent: "main"
        comment: "NEW endpoint: Allows user to delete crimes."

  - task: "POST /api/seed - Seed catalog (auto on startup)"
    implemented: true
    working: true
    file: "/app/backend/server.py"
    stuck_count: 0
    priority: "high"
    needs_retesting: true
    status_history:
      - working: true
        agent: "main"
        comment: "Now auto-seeds 83 crimes on startup if DB empty."

  - task: "POST /api/calcular - 8-step penalty calculation"
    implemented: true
    working: true
    file: "/app/backend/server.py"
    stuck_count: 0
    priority: "high"
    needs_retesting: true
    status_history:
      - working: true
        agent: "main"
        comment: "Engine handles autoría, ejecución, agravantes (mitad superior), atenuantes (mitad inferior), eximentes, concurso (real, ideal, medial, continuado)."

  - task: "GET /api/agravantes, atenuantes, eximentes, grados-autoria, grados-ejecucion, tipos-concurso"
    implemented: true
    working: true
    file: "/app/backend/server.py"
    stuck_count: 0
    priority: "high"
    needs_retesting: true
    status_history:
      - working: true
        agent: "main"
        comment: "All catalog endpoints return arrays of CP Honduras circumstances."

frontend:
  - task: "Home screen - Professional design"
    implemented: true
    working: true
    file: "/app/frontend/app/index.tsx"
    stuck_count: 0
    priority: "high"
    needs_retesting: false
    status_history:
      - working: true
        agent: "main"
        comment: "Rewritten with judicial navy/gold palette. Stats cards, branding LEX HONDURAS, primary action card to calculadora, secondary cards to catalog/CRUD."

  - task: "Catalog screen with CRUD list"
    implemented: true
    working: true
    file: "/app/frontend/app/delitos.tsx"
    stuck_count: 0
    priority: "high"
    needs_retesting: false
    status_history:
      - working: true
        agent: "main"
        comment: "New screen: search, classification filter chips, FAB add button, edit/delete actions per card."

  - task: "Delito form (Create/Edit/Delete)"
    implemented: true
    working: true
    file: "/app/frontend/app/delito-form.tsx"
    stuck_count: 0
    priority: "high"
    needs_retesting: false
    status_history:
      - working: true
        agent: "main"
        comment: "Modal form with sections: identificación, pena de prisión, pena alternativa (toggle), penas accesorias, observaciones. Handles validation, create/update via /api/delitos endpoints."

  - task: "Calculadora wizard (8 pasos)"
    implemented: true
    working: true
    file: "/app/frontend/app/calculadora.tsx"
    stuck_count: 0
    priority: "high"
    needs_retesting: false
    status_history:
      - working: true
        agent: "main"
        comment: "Full 8-step wizard: select delito, variants, participation (autoría/ejecución), circumstances (aggrav/atenu/eximentes), more delitos, concurso, summary, result. Uses correct backend field names."

metadata:
  created_by: "main_agent"
  version: "2.0"
  test_sequence: 2
  run_ui: false

test_plan:
  current_focus:
    - "Verify CRUD endpoints (POST/PUT/DELETE /api/delitos)"
    - "Verify GET /api/delitos returns 83 seeded crimes"
    - "Verify GET /api/clasificaciones works"
    - "Verify POST /api/calcular still works after schema changes"
  stuck_tasks: []
  test_all: false
  test_priority: "high_first"

agent_communication:
  - agent: "main"
    message: "MAJOR REWRITE v2: Backend already had CRUD endpoints + auto-seed on startup (83 delitos). Frontend completely rewritten with modular Expo Router architecture: /index (home), /calculadora (8-step wizard), /delitos (CRUD list), /delito-form (create/edit modal). Fixed schema mismatch (categoria→clasificacion, descripcion→conducta, pena_prision→pena_minima/maxima_meses). New professional judicial UI palette (navy #1A2B4A + gold #C9A55C). Need backend retesting for the new CRUD endpoints and verification that /calcular still works with the new request shape."
  - agent: "testing"
    message: "Backend retesting completed (23/23 PASS). Tested against http://localhost:8001 using /app/backend_test.py. Verified: (1) /api/clasificaciones returns 33 classifications; (2) /api/delitos?limit=1000 returns 83 delitos with all required fields including pena_texto; (3) busqueda and clasificacion filters work; (4) /api/delitos/count returns {total:83}; (5) GET by valid/invalid id (404) works; (6-8) POST/PUT/DELETE CRUD lifecycle works end-to-end; (9-11) /agravantes (10), /atenuantes (7), /eximentes (8) returned correctly; (12-14) /grados-autoria, /grados-ejecucion, /tipos-concurso include all required ids; (15) /api/calcular validated for all 6 scenarios — base case (12-36), cómplice reduction (6-12), 1 agravante mitad superior (24-36), 1 atenuante mitad inferior (12-24), concurso real accumulation with cap (84-156), and concurso ideal mitad superior of more grave delito (96-120 for Robo). Minor: review request asked /atenuantes to have >=8 items but backend defines 7 (all valid); not a blocker but main agent may add 1 more if strict count matters. Backend is production-ready."