import { defineAction } from 'astro:actions';
import { z } from 'astro/zod';
import { env } from 'cloudflare:workers';

export const server = {
  // Phase 0 spike. Replaced by `contact` in Phase 5.
  ping: defineAction({
    input: z.object({ who: z.string().min(1) }),
    handler: async ({ who }) => {
      return { reply: `pong from ${env.SITE_URL}`, who };
    },
  }),
};
