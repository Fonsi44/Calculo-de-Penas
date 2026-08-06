# GA4 (export a BigQuery) — landing pages de tráfico orgánico.
# Tabla fuente: analytics_<PROPERTY_ID>.events_YYYYMMDD (o _* sharded).
# Ajusta PROPERTY_ID, dataset y fecha.

DECLARE start_date DATE DEFAULT DATE_SUB(CURRENT_DATE(), INTERVAL 90 DAY);

WITH events AS (
  SELECT
    event_date,
    event_name,
    (SELECT value.string_value FROM UNNEST(event_params) WHERE key = 'page_location') AS page_location,
    (SELECT value.string_value FROM UNNEST(event_params) WHERE key = 'session_source') AS source,
    (SELECT value.string_value FROM UNNEST(event_params) WHERE key = 'session_medium') AS medium
  FROM `analytics_<PROPERTY_ID>.events_*`
  WHERE _TABLE_SUFFIX BETWEEN FORMAT_DATE('%Y%m%d', start_date) AND FORMAT_DATE('%Y%m%d', DATE_SUB(CURRENT_DATE(), INTERVAL 1 DAY))
)
SELECT
  page_location,
  COUNT(DISTINCT (SELECT value.int_value FROM UNNEST(event_params) WHERE key = 'ga_session_id')) AS sessions_approx,
  COUNTIF(event_name = 'page_view') AS page_views,
  COUNTIF(event_name IN ('form_submit', 'whatsapp_click', 'tel_click', 'email_click')) AS key_events
FROM events
WHERE source IN ('google', 'bing', 'duckduckgo', 'organic')
GROUP BY page_location
ORDER BY sessions_approx DESC
LIMIT 1000;
