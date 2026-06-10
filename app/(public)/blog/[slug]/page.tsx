import { redirect } from 'next/navigation';
import { getPostBySlug } from '@/lib/blog';

type Props = { params: Promise<{ slug: string }> };

export default async function BlogPostRedirect({ params }: Props) {
  const { slug } = await params;
  const post = getPostBySlug(slug);
  if (!post) {
    redirect('/blog');
  }
  redirect(`/blog/categoria/${post.category}/${post.slug}`);
}
