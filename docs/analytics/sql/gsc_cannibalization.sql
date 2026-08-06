# Search Console — canibalización: la misma consulta aparece en 2+ URLs
# con impresiones no triviales (candidatas a consolidar/redirigir).

WITH q_agg AS (
  SELECT
    query,
    url,
    SUM(impressions) AS impressions,
    SUM(clicks) AS clicks,
    AVG(position) AS position
  FROM `searchconsole.searchdata_site_impression`
  WHERE data_date BETWEEN DATE_SUB(CURRENT_DATE(), INTERVAL 90 DAY) AND DATE_SUB(CURRENT_DATE(), INTERVAL 1 DAY)
  GROUP BY query, url
),
multi AS (
  SELECT query, COUNT(DISTINCT url) AS url_count
  FROM q_agg
  WHERE impressions >= 50
  GROUP BY query
  HAVING COUNT(DISTINCT url) >= 2
)
SELECT
  m.query,
  m.url_count,
  q.url,
  q.impressions,
  q.clicks,
  ROUND(q.position, 1) AS position
FROM multi m
JOIN q_agg q USING (query)
ORDER BY m.query, q.impressions DESC;
