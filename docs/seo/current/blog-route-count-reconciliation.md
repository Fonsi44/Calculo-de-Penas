---
status: current
owner: seo
created: 2026-07-29
last_reviewed: 2026-08-06
review_due: 2026-11-04
supersedes: null
superseded_by: null
---
# Reconciliación de rutas del blog

- db_total: 141
- db_published: 135
- http_200_articles: 135
- http_redirect_sources: 64
- historical_unique_routes: 199
- published_redirect_collisions: 0
- missing_routes: 0
- unexpected_routes: 0
- proposal_count: 40

Fórmula: rutas históricas únicas = unión disjunta de rutas publicadas HTTP 200 y orígenes de redirect. Los orígenes no se cuentan como artículos 200.
