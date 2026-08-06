# JOIN GSC (export BigQuery) + GA4 (export BigQuery): cruce de búsqueda y
# comportamiento/conversión por URL. Requiere ambas exportaciones activas.
# Ajusta PROPERTY_ID, datasets y tabla de GSC.

WITH gsc AS (
  SELECT
    url,
    SUM(impressions) AS impressions,
    SUM(clicks) AS clicks,
    ROUND(AVG(position), 1) AS position
  FROM `searchconsole.searchdata_site_impression`
  WHERE data_date BETWEEN DATE_SUB(CURRENT_DATE(), INTERVAL 90 DAY) AND DATE_SUB(CURRENT_DATE(), INTERVAL 1 DAY)
  GROUP BY url
),
ga4 AS (
  SELECT
    (SELECT value.string_value FROM UNNEST(event_params) WHERE key = 'page_location') AS page_location,
    COUNT(DISTINCT (SELECT value.int_value FROM UNNEST(event_params) WHERE key = 'ga_session_id')) AS sessions,
    COUNTIF(event_name IN ('form_submit', 'whatsapp_click', 'tel_click', 'email_click')) AS key_events
  FROM `analytics_<PROPERTY_ID>.events_*`
  WHERE _TABLE_SUFFIX BETWEEN FORMAT_DATE('%Y%m%d', DATE_SUB(CURRENT_DATE(), INTERVAL 90 DAY)) AND FORMAT_DATE('%Y%m%d', DATE_SUB(CURRENT_DATE(), INTERVAL 1 DAY))
  GROUP BY page_location
)
SELECT
  COALESCE(g.url, ga.page_location) AS url,
  g.impressions, g.clicks, g.position,
  ga.sessions, ga.key_events,
  ROUND(IF(ga.sessions > 0, SAFE_DIVIDE(ga.key_events, ga.sessions), 0) * 100, 2) AS conversion_rate_pct
FROM gsc g
FULL OUTER JOIN ga4 ga ON g.url = ga.page_location
ORDER BY g.impressions DESC NULLS LAST
LIMIT 2000;
