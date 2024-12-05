// 1. Import utilities from `astro:content`
import { defineCollection, z, reference } from 'astro:content';
import { file, glob } from 'astro/loaders';

const tech = defineCollection({
  loader: glob({
    pattern: "**/*.{md,mdx}",
    base: "./src/content/tech/"
  }),
  schema: z.object({
    title: z.string(),
    slug: z.string(),
    description: z.string().nullable(),
    pubDate: z.date(),
    status: z.enum(['draft', 'published', 'archived']),
    coverimage: z.string().optional(),
    vendoricon: z.string().optional(),
    horizontal_logo: z.string().optional(),
    vendor_name: z.string().optional(),
    vendor_primary_color: z.string().optional(),
    vendor_secondary_color: z.string().optional(),
    tags: z.array(reference('tags')).optional(),
    category: z.enum(['development', 'cloud', 'systems', 'business', 'ai-automation', 'data', 'media'])
  })
});

const projects = defineCollection({
  loader: glob({
    pattern: "**/*.{md,mdx}",
    base: "./src/content/projects/"
  }),
  schema: z.object({
    title: z.string(),
    slug: z.string(),
    description: z.string().nullable(),
    pubDate: z.date(),
    status: z.enum(['draft', 'published', 'archived']),
    coverimage: z.string().optional(),
    tags: z.array(reference('tags')).optional(),
    client: z.string().optional(),
    vendor: z.string().optional(),
  }),
});

const blog = defineCollection({
  loader: glob({
    pattern: "**/*.{md,mdx}",
    base: "./src/content/blog/"
  }),
  schema: z.object({
    title: z.string(),
    slug: z.string(),
    description: z.string().nullable(),
    pubDate: z.date(),
    status: z.enum(['draft', 'published', 'archived']),
    coverimage: z.string().optional(),
    vendor_name: z.string().optional().describe('Vendor name for the logo'),
    horizontal_logo: z.string().optional().describe('Path to the horizontal logo image'),
    vendoricon: z.string().optional(),
    tags: z.array(reference('tags')).optional(),
    category: z.string().optional()
  }),
});

const tags = defineCollection({
  loader: file("src/content/tags.json"),
  schema: z.object({
    name: z.string(),
    description: z.string().optional(),
    color: z.string().optional()
  })
});

export const collections = { blog, projects, tech, tags };