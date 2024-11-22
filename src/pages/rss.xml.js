import rss from '@astrojs/rss';
import { getCollection } from 'astro:content';

export async function GET(context) {
  const blog = await getCollection('blog', ({ data }) => {
    return data.status === 'published';
  });

  return rss({
    title: 'SimonGreer.co.uk | Blog',
    description: 'The latest from my blog',
    site: context.site,
    items: blog.map((post) => ({
      title: post.data.title,
      pubDate: post.data.created_date,
      description: post.data.excerpt,
      link: `/blog/${post.id}/`,
      categories: post.data.tags,
    })),
    customData: `<language>en-gb</language>`,
  });
}