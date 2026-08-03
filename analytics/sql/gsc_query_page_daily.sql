# Search Console (export a BigQuery) — query + page + fecha, nivel diario
# Tabla fuente: searchconsole.searchdata_site_impression
# Ajusta el dataset/proyecto según el despliegue de la exportación.

DECLARE start_date DATE DEFAULT DATE_SUB(CURRENT_DATE(), INTERVAL 90 DAY);
DECLARE end_date DATE DEFAULT DATE_SUB(CURRENT_DATE(), INTERVAL 1 DAY);

SELECT
  data_date,
  query,
  url,
  SUM(impressions) AS impressions,
  SUM(clicks) AS clicks,
  IF(SUM(impressions) > 0, SAFE_DIVIDE(SUM(clicks), SUM(impressions)), 0) AS ctr,
  AVG(position) AS position
FROM `searchconsole.searchdata_site_impression`
WHERE data_date BETWEEN start_date AND end_date
  AND query <> ''
GROUP BY data_date, query, url
ORDER BY data_date, impressions DESC;
