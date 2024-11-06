// 1. Import utilities from `astro:content`
import { defineCollection, z, reference } from 'astro:content';
import { glob, file } from 'astro/loaders';

const pages = defineCollection({
  loader: glob({ pattern: ["**/*.{md,mdx}"], base: "./src/content/pages/"}),
  schema: z.object({
    id: z.string(),
    title: z.string(),
    excerpt: z.string().nullable(),
  })
});

const tech = defineCollection({
  loader: glob({ pattern: ["**/*.{md,mdx}"], base: "./src/content/tech/"}),
  schema: z.object({
    title: z.string(),
    excerpt: z.string().nullable(),
    tags: z.array(z.string()).optional(),
    created_date: z.date(),
    status: z.enum(['draft', 'published', 'archived']),
    slug: z.string(),
    coverimage: z.string().optional(),
    vendoricon: z.string().optional(),
  })
});

const projects = defineCollection({
  loader: glob({ pattern: ["**/*.{md,mdx}"], base: "./src/content/projects/"}),
  schema: z.object({
    title: z.string(),
    excerpt: z.string().nullable(),
    type: z.enum(['blog', 'techguide', 'project', 'page']),
    created_date: z.date(),
    status: z.enum(['draft', 'published', 'archived']),
    coverimage: z.string().optional(),
    slug: z.string(),
  }),
});


const blog = defineCollection({
  loader: glob({ pattern: ["**/*.{md,mdx}"], base: "./src/content/blog/"}),
  schema: z.object({
    title: z.string(),
    excerpt: z.string().nullable(),
    type: z.enum(['blog', 'techguide', 'project', 'page']),
    created_date: z.date(),
    status: z.enum(['draft', 'published', 'archived']),
    coverimage: z.string().optional(),
    slug: z.string(),
  }),
});

export const collections = { blog, projects, pages, tech };
