// Archivo mínimo requerido por posts legacy en papelera
export type Post = {
  slug: string;
  title: string;
  description: string;
  body: string;
  publishedAt: string;
  category: string;
  tags: string[];
  author: string;
  readingTime: string;
  coverImage?: string;
  featured?: boolean;
  updatedAt?: string;
};
