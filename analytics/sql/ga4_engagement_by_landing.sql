# GA4 (export a BigQuery) — engagement por landing page (sesiones, duración,
# engagement, rebote aprox. sin PII). Ajusta PROPERTY_ID.

DECLARE start_date DATE DEFAULT DATE_SUB(CURRENT_DATE(), INTERVAL 90 DAY);

WITH sessions AS (
  SELECT
    (SELECT value.string_value FROM UNNEST(event_params) WHERE key = 'page_location') AS page_location,
    (SELECT value.int_value FROM UNNEST(event_params) WHERE key = 'ga_session_id') AS session_id,
    (SELECT value.int_value FROM UNNEST(event_params) WHERE key = 'engagement_time_msec') AS engagement_ms
  FROM `analytics_<PROPERTY_ID>.events_*`
  WHERE _TABLE_SUFFIX BETWEEN FORMAT_DATE('%Y%m%d', start_date) AND FORMAT_DATE('%Y%m%d', DATE_SUB(CURRENT_DATE(), INTERVAL 1 DAY))
)
SELECT
  page_location,
  COUNT(DISTINCT session_id) AS sessions,
  ROUND(SAFE_DIVIDE(SUM(engagement_ms), 1000), 1) AS total_engagement_sec,
  ROUND(SAFE_DIVIDE(SUM(engagement_ms), 1000) / NULLIF(COUNT(DISTINCT session_id), 0), 1) AS avg_engagement_sec,
  COUNTIF(engagement_ms > 0) / COUNT(DISTINCT session_id) AS engaged_session_ratio
FROM sessions
WHERE page_location IS NOT NULL
GROUP BY page_location
ORDER BY sessions DESC
LIMIT 1000;
