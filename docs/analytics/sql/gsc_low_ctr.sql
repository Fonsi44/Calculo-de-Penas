# Search Console — bajo CTR: impresiones altas con CTR bajo (oportunidad de
# título/meta/snippet). Clasificación por banda de posición.

SELECT
  query,
  url,
  SUM(impressions) AS impressions,
  SUM(clicks) AS clicks,
  ROUND(AVG(position), 1) AS position,
  ROUND(IF(SUM(impressions) > 0, SAFE_DIVIDE(SUM(clicks), SUM(impressions)), 0) * 100, 2) AS ctr_pct
FROM `searchconsole.searchdata_site_impression`
WHERE data_date BETWEEN DATE_SUB(CURRENT_DATE(), INTERVAL 90 DAY) AND DATE_SUB(CURRENT_DATE(), INTERVAL 1 DAY)
GROUP BY query, url
HAVING impressions >= 100 AND ctr_pct < 3
ORDER BY impressions DESC
LIMIT 500;
