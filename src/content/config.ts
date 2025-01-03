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
    status: z.enum(['draft', 'published', 'archived', 'hidden']),
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
    status: z.enum(['draft', 'published', 'archived', 'hidden']),
    contentType: z.enum(['article', 'snippet']),
    coverimage: z.string().optional(),
    tags: z.array(reference('tags')).optional(),
    client: reference('clients').optional(),
    vendor: z.string().optional(),
  }),
});

const clients = defineCollection({
  loader: glob({
    pattern: "**/*.{md,mdx}",
    base: "./src/content/clients/"
  }),
  schema: z.object({
    name: z.string(),
    description: z.string().nullable(),
    industry: z.string().nullable(),
    tags: z.array(reference('tags')).optional(),
    horizontal_logo: z.string().optional().describe('Path to the horizontal logo image'),
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
    status: z.enum(['draft', 'published', 'archived', 'hidden']),
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
    color: z.string().optional(),
    synonyms: z.array(z.string()).optional()
  })
});

export const collections = { blog, projects, tech, tags, clients };