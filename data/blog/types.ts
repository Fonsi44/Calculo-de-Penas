export type Post = {
  slug: string;
  title: string;
  description: string;
  body: string;
  publishedAt: string;
  updatedAt?: string;
  category: string;
  tags: string[];
  author: string;
  authorId?: string;
  readingTime: string;
  coverImage?: string;
  featured?: boolean;

  // SEO metadata
  metaTitle?: string;
  metaDescription?: string;
  ogImage?: string;

  // Indexation
  noindex?: boolean;

  // Canonical
  canonicalUrl?: string;

  // Review workflow
  reviewStatus?: string;
  reviewedBy?: string;
  reviewedAt?: string;
  legalReviewNotes?: string;

  // Content audit
  lastReviewedAt?: string;
  nextReviewDueAt?: string;
};
