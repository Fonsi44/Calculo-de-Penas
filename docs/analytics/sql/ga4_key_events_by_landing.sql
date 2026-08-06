# GA4 (export a BigQuery) — eventos clave por landing page.
# Eventos clave esperados: form_start, form_submit, whatsapp_click, tel_click,
# email_click, scroll_90 (ver measurement-plan.md). Ajusta PROPERTY_ID.

DECLARE start_date DATE DEFAULT DATE_SUB(CURRENT_DATE(), INTERVAL 90 DAY);

SELECT
  (SELECT value.string_value FROM UNNEST(event_params) WHERE key = 'page_location') AS page_location,
  event_name,
  COUNT(*) AS event_count,
  COUNT(DISTINCT user_pseudo_id) AS users
FROM `analytics_<PROPERTY_ID>.events_*`
WHERE _TABLE_SUFFIX BETWEEN FORMAT_DATE('%Y%m%d', start_date) AND FORMAT_DATE('%Y%m%d', DATE_SUB(CURRENT_DATE(), INTERVAL 1 DAY))
  AND event_name IN ('form_start', 'form_submit', 'whatsapp_click', 'tel_click', 'email_click', 'scroll_90')
GROUP BY page_location, event_name
ORDER BY page_location, event_count DESC;
