export const GALLERY_CONFIG = {
  basePath: '/images',
  defaultAlt: 'Gallery image',
};

export type GalleryImage = {
  src: string;
  alt?: string;
  caption?: string;
}; 