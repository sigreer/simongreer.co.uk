import { getCollection } from 'astro:content';
// import type { CollectionEntry } from 'astro:content';

type SupportedCollections = 'blog' | 'tech' | 'projects';
// type CollectionWithTags = CollectionEntry<SupportedCollections>;

export async function getMergedCollections(collections: SupportedCollections[]) {
  const results = await Promise.all(
    collections.map(collection => getCollection(collection))
  );
  return results.flat();

} 