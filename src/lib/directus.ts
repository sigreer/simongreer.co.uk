import { createDirectus, rest } from '@directus/sdk';
import dotenv from 'dotenv';

dotenv.config();

type Global = {
  title: string;
  description: string;
  logo_style: string;
  logo_icon: {
    id: string;
    description: string;
  };
  logo_image: {
    id: string;
    description: string;
  };
  logo_text: string;
  introduction: string;
  site_url: string;
  about: string;
  about_pic: {
    id: string;
    description: string;
  };
  mastodon: string;
  twitter: string;
  github: string;
  dribbble: string;
  linkedin: string;
  instagram: string;
  facebook: string;
  dev: string;
  show_introduction: boolean;
}

type Keycard = {
  title: string;
  link: string;
  style: string[];
  excerpt: string;
  background_image: {
    id: string;
    description: string;
  };
}

type Page = {
  id: string;
  title: string;
  content: string;
  slug: string;
  description: string;
  menus: string;
}

type Project = {
  id: string;
  title: string;
  content: string;
  slug: string;
  description: string;
  menus: string;
}


type Post = {
  id: string;
  title: string;
  content: string;
  slug: string;
  description: string;
  tags: {
    name: string;
  }[];
  excerpt: string;
  image: {
    id: string;
    description: string;
  };
}

type Techguide = {
  id: string;
  title: string;
  content: string;
  slug: string;
  tags: {
    name: string;
  }[];
  excerpt: string;
  image: {
    id: string;
    description: string;
  };
  vendorlogo_horizontal: {
    id: string;
    description: string;
  };
  vendorlogo_icon: {
    id: string;
    description: string;
  };
  vendorname: string;
}

type Tag = {
  id: string;
  name: string;
}

type Schema = {
  global: Global;
  keycards: Keycard[];
  pages: Page[];
  posts: Post[];
  projects: Project[];
  techguides: Techguide[];
  tags: Tag[];
}

const directus = createDirectus<Schema>(process.env.DIRECTUS_URL!).with(rest());

export default directus;