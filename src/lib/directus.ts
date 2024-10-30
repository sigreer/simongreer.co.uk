import { createDirectus, rest } from '@directus/sdk';
import { DIRECTUS_URL } from 'astro:env/client';


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
  status: string;
  //html_content: string;
  slug: string;
  description: string;
  image: {
    id: string;
    description: string;
  };
}

type Project = {
  id: string;
  title: string;
  content: string;
  slug: string;
  tags: {
    id: string;
    name: string;
  }[];
  description: string;
  image: {
    id: string;
    description: string;
  };
  clientlogo_icon: {
    id: string;
    description: string;
  };
  clientlogo_horizontal: {
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
  image_gallery: {
    id: string;
    description: string;
  }[];
  banner_image: {
    id: string;
    description: string;
  };
  files: {
    id: string;
    description: string;
  }[];

}


type Post = {
  id: string;
  title: string;
  content: string;
  slug: string;
  description: string;
  tags: {
    id: string;
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
    id: string;
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
  status: string;
}

type Tag = {
  id: string;
  name: string;
  status: string;
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

const directus = createDirectus<Schema>(DIRECTUS_URL!).with(rest());

export default directus;