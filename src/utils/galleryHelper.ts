import { getImage } from "astro:assets";

export async function importImages(globPath: string) {
  const images = import.meta.glob('/src/images/**/*{.png,.jpg,.jpeg,.gif,.webp}', {
    eager: true,
    import: 'default',
  });

  const matchingImages = Object.entries(images)
    .filter(([path]) => path.includes(globPath))
    .map(([path, image]) => ({
      src: image,
      alt: path.split('/').pop()?.split('.')[0] || '',
    }));

  return matchingImages;
} 