// 1. Import utilities from `astro:content`
import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

const tech = defineCollection({
  loader: glob({ pattern: ["**/*.{md,mdx}"], base: "./src/content/tech/"}),
  schema: z.object({
    title: z.string(),
    slug: z.string(),
    excerpt: z.string().nullable(),
    created_date: z.date(),
    status: z.enum(['draft', 'published', 'archived']),
    coverimage: z.string().optional(),
    vendoricon: z.string().optional(),
    horizontal_logo: z.string().optional(),
    vendor_name: z.string().optional(),
    vendor_primary_color: z.string().optional(),
    vendor_secondary_color: z.string().optional(),
    tags: z.array(z.string()).optional(),
  })
});

const projects = defineCollection({
  loader: glob({ pattern: ["**/*.{md,mdx}"], base: "./src/content/projects/"}),
  schema: z.object({
    title: z.string(),
    slug: z.string(),
    excerpt: z.string().nullable(),
    created_date: z.date(),
    status: z.enum(['draft', 'published', 'archived']),
    coverimage: z.string().optional(),
    tags: z.array(z.string()).optional(),
    client: z.string().optional(),
    vendor: z.string().optional(),
  }),
});


const blog = defineCollection({
  loader: glob({ pattern: ["**/*.{md,mdx}"], base: "./src/content/blog/"}),
  schema: z.object({
    title: z.string(),
    slug: z.string(),
    excerpt: z.string().nullable(),
    created_date: z.date(),
    status: z.enum(['draft', 'published', 'archived']),
    coverimage: z.string().optional(),
    vendor_name: z.string().optional().describe('Vendor name for the logo'),
    horizontal_logo: z.string().optional().describe('Path to the horizontal logo image'),
    vendoricon: z.string().optional(),
    tags: z.array(z.string()).optional(),
    type: z.literal('blog'),
    category: z.string().optional()
  }),
});

export const collections = { blog, projects, tech };