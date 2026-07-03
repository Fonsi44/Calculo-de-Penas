import { stripHtml } from './strip-html';

export function extractFAQSchema(body: string): { question: string; answer: string }[] {
  const faqs: { question: string; answer: string }[] = [];
  const h3Regex = /<h3[^>]*>([\s\S]*?)<\/h3>\s*<p[^>]*>([\s\S]*?)<\/p>/gi;
  let match;
  while ((match = h3Regex.exec(body)) !== null) {
    // stripHtml (vía sanitize-html) reemplaza al regex /<[^>]+>/g, que trunca
    // contenido con tags anidados o entidades y puede generar snippets rotos.
    const q = stripHtml(match[1]);
    const a = stripHtml(match[2]);
    if (q && a && q.length > 5 && a.length > 10) {
      faqs.push({ question: q, answer: a });
    }
  }
  return faqs.slice(0, 10);
}

export function faqPageSchema(faqs: { question: string; answer: string }[]) {
  if (!faqs.length) return null;
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map((f) => ({
      '@type': 'Question',
      name: f.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: f.answer,
      },
    })),
  };
}
