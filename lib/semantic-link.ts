/**
 * Atributos para enlaces internos que el auditor de crawl (`audit-site-links-crawl`)
 * clasifica como zona `contextual`, aunque el destino también aparezca en nav/footer.
 */
export function semanticLinkProps(href: string) {
  return { 'data-internal-link': href } as const;
}
