# Search Console — páginas con oportunidades (impresiones altas, CTR bajo,
# posición 4-20) para priorizar mejora de título/meta/contenido.

WITH agg AS (
  SELECT
    url,
    SUM(impressions) AS impressions,
    SUM(clicks) AS clicks,
    AVG(position) AS position,
    IF(SUM(impressions) > 0, SAFE_DIVIDE(SUM(clicks), SUM(impressions)), 0) AS ctr
  FROM `searchconsole.searchdata_site_impression`
  WHERE data_date BETWEEN DATE_SUB(CURRENT_DATE(), INTERVAL 90 DAY) AND DATE_SUB(CURRENT_DATE(), INTERVAL 1 DAY)
  GROUP BY url
)
SELECT
  url,
  impressions,
  clicks,
  ROUND(position, 1) AS position,
  ROUND(ctr * 100, 2) AS ctr_pct,
  CASE
    WHEN position BETWEEN 4 AND 10 THEN 'HIGH'
    WHEN position BETWEEN 11 AND 20 THEN 'MEDIUM'
    ELSE 'LOW'
  END AS opportunity_band
FROM agg
WHERE impressions >= 100 AND position BETWEEN 4 AND 20
ORDER BY impressions * (position <= 10) DESC, impressions DESC
LIMIT 500;
