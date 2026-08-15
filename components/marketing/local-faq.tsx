import { HubFaq } from '@/components/marketing/hub-faq';
import type { HubFaqItem } from '@/data/faqs-hubs';

const LOCAL_FAQ_MAX = 3;

/**
 * FAQ de ciudad o cargo: máximo 3 preguntas locales.
 * Misma fuente visible y schema (HubFaq). No sustituye la FAQ corporativa
 * de los hubs de área.
 */
export function LocalFaq({
  faqs,
  url,
  title,
  eyebrow = 'Logística local',
  id = 'preguntas-frecuentes',
}: {
  faqs: HubFaqItem[];
  url: string;
  title: string;
  eyebrow?: string;
  id?: string;
}) {
  return (
    <HubFaq
      faqs={faqs.slice(0, LOCAL_FAQ_MAX)}
      url={url}
      title={title}
      eyebrow={eyebrow}
      id={id}
    />
  );
}
