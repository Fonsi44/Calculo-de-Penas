export type PostFrontmatter = {
  slug: string;
  title: string;
  description: string;
  publishedAt: string;
  updatedAt?: string;
  category: string;
  tags: string[];
  author: string;
  readingTime: string;
  featured?: boolean;
};

export type Post = PostFrontmatter & {
  body: string;
  coverImage?: string;
};
