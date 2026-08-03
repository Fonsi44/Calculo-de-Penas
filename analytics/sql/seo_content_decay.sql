# Decaimiento de contenido: comparar impresiones/clics de las últimas 4 semanas
# vs las 4 semanas anteriores por URL, para detectar contenido en caída.
# Tabla fuente: searchconsole.searchdata_site_impression

WITH weekly AS (
  SELECT
    url,
    CASE WHEN data_date >= DATE_SUB(CURRENT_DATE(), INTERVAL 28 DAY) THEN 'recent' ELSE 'prior' END AS bucket,
    SUM(impressions) AS impressions,
    SUM(clicks) AS clicks
  FROM `searchconsole.searchdata_site_impression`
  WHERE data_date BETWEEN DATE_SUB(CURRENT_DATE(), INTERVAL 56 DAY) AND DATE_SUB(CURRENT_DATE(), INTERVAL 1 DAY)
  GROUP BY url, bucket
)
SELECT
  url,
  MAX(IF(bucket = 'prior', impressions, NULL)) AS impressions_prior,
  MAX(IF(bucket = 'recent', impressions, NULL)) AS impressions_recent,
  MAX(IF(bucket = 'prior', clicks, NULL)) AS clicks_prior,
  MAX(IF(bucket = 'recent', clicks, NULL)) AS clicks_recent,
  ROUND(
    SAFE_DIVIDE(
      MAX(IF(bucket = 'recent', impressions, NULL)) - MAX(IF(bucket = 'prior', impressions, NULL)),
      MAX(IF(bucket = 'prior', impressions, NULL))
    ) * 100, 1
  ) AS impressions_change_pct
FROM weekly
GROUP BY url
HAVING impressions_prior >= 100 AND impressions_change_pct <= -30
ORDER BY impressions_change_pct ASC;
