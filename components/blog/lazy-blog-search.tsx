'use client';

import dynamic from 'next/dynamic';

const BlogSearch = dynamic(() => import('@/components/blog/blog-search').then(m => ({ default: m.BlogSearch })), {
  ssr: false,
  loading: () => (
    <div className="rounded-lg border border-accent/30 bg-gradient-to-br from-white to-accent/[0.04] p-4 shadow-md h-[70px] animate-pulse" />
  ),
});

type SearchablePost = {
  slug: string;
  title: string;
  description: string;
  category: string;
  tags: string[];
  publishedAt: string;
  readingTime: string;
  coverImage?: string;
};

export function LazyBlogSearch({ posts, scope }: { posts: SearchablePost[]; scope?: string }) {
  return <BlogSearch posts={posts} scope={scope} />;
}
