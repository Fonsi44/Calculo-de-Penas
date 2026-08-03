import type { BlogMetadataOverride } from './blog-metadata-overrides';

export type BlogMetadataChange = {
  before: Required<Pick<
    BlogMetadataOverride,
    'title' | 'metaTitle' | 'description' | 'metaDescription'
  >>;
  after: Required<Pick<
    BlogMetadataOverride,
    'title' | 'metaTitle' | 'description' | 'metaDescription'
  >>;
  reason: 'FIX_DUPLICATE';
};

export const BLOG_METADATA_CHANGE_PLAN: Readonly<Record<string, BlogMetadataChange>> = {
  'testamentos-sucesiones-herencia-honduras': {
    before: {
      title: 'Herencias en Honduras: Testamento y Sucesión',
      metaTitle: 'Herencias en Honduras: Testamento y Sucesión',
      description: 'Cómo se tramita una herencia en Honduras, qué cambia si existe testamento y qué documentos conviene reunir antes de iniciar la sucesión.',
      metaDescription: 'Cómo se tramita una herencia en Honduras, qué cambia si existe testamento y qué documentos conviene reunir antes de iniciar la sucesión.',
    },
    after: {
      title: 'Testamentos y sucesiones en Honduras: trámites hereditarios',
      metaTitle: 'Testamentos y sucesiones en Honduras',
      description: 'Cómo se tramita una sucesión en Honduras, qué cambia si existe testamento y qué documentos conviene reunir para el trámite hereditario.',
      metaDescription: 'Conozca cómo se tramita una sucesión en Honduras, qué cambia si existe testamento y qué documentos reunir para el trámite hereditario.',
    },
    reason: 'FIX_DUPLICATE',
  },
};
