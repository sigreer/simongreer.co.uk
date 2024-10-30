// 1. Import utilities from `astro:content`
import { defineCollection, z } from 'astro:content';
import directus from "@lib/directus";
import { readItems } from "@directus/sdk";
import { glob, file } from 'astro/loaders';

const pages = defineCollection({
  loader: glob({ pattern: ["**\/*.md", "**\/.mdx"], base: "./src/content/pages/"}),
  schema: z.object({
    id: z.string(),
    title: z.string(),
    content: z.string(),
  })
});

const tech = defineCollection({
  loader: glob({ pattern: ["**\/*.md", "**\/.mdx"], base: "./src/content/tech/"}),
  schema: z.object({
    id: z.string(),
    title: z.string(),
    content: z.string(),
    excerpt: z.string().nullable(),
    tags: z.array(z.string()).optional(),
    vendorlogo_icon: z.string().optional(),
    slug: z.string(),
  })
});

const tags = defineCollection({
  loader: async () => {
    const response = await directus.request(readItems('tags', { 
      fields: ['id', 'name'],
      filter: { status: { _eq: 'published' } }
    }));
    
    const tagsArray = response.map(tag => ({
      id: String(tag.id),
      name: tag.name,
    }));
    return tagsArray;
  },
  schema: z.object({
    id: z.string(),
    name: z.string(),
  })
});


const projects = defineCollection({

  loader: glob({ pattern: ["**\/*.md", "**\/.mdx"], base: "./src/content/projects/"}),
  schema: z.object({
    title: z.string(),
    type: z.enum(['blog', 'techguide', 'project', 'page']),
    created_date: z.date(),
    status: z.enum(['draft', 'published', 'archived']),
    image: z.string(),
    slug: z.string(),
  }),
});


const blog = defineCollection({
  loader: glob({ pattern: ["**\/*.md", "**\/.mdx"], base: "./src/content/blog/"}),
  schema: z.object({
    title: z.string(),
    type: z.enum(['blog', 'techguide', 'project', 'page']),
    created_date: z.date(),
    status: z.enum(['draft', 'published', 'archived']),
    image: z.string(),
    slug: z.string(),
  }),
});

export const collections = { blog, projects, pages, tech };
