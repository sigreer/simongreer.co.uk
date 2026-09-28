import { defineCollection } from 'astro:content';
import { file } from 'astro/loaders';
import { z } from 'astro/zod';

const services = defineCollection({
  loader: file('./src/content/services.json'),
  schema: z.object({
    title: z.string(),
    navLabel: z.string(),
    inNav: z.boolean(),
    icon: z.string().regex(/^material-symbols:[a-z0-9-]+$/),
    filters: z.array(z.string()).min(1),
    // Filled in Phase 4:
    intro: z.string().optional(),
    skills: z.array(z.object({ label: z.string(), icon: z.string() })).optional(),
    sections: z
      .array(
        z.object({
          heading: z.string(),
          icon: z.string(),
          body: z.string(),
          pros: z.array(z.string()).optional(),
          cons: z.array(z.string()).optional(),
          screenshots: z
            .array(z.object({ src: z.string(), alt: z.string(), caption: z.string().optional() }))
            .optional(),
        }),
      )
      .optional(),
  }),
});

export const collections = { services };
