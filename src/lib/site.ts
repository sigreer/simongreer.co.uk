export const SITE = {
  name: 'SimonGreer.co.uk',
  url: 'https://simongreer.co.uk',
  defaultDescription:
    'Simon Greer: blog posts and notes on self-hosting, Linux, networking, web development and the tools behind them.',
  author: 'Simon Greer',
  socials: [
    { label: 'GitHub', href: 'https://github.com/sigreer', icon: 'simple-icons:github' },
    { label: 'Bluesky', href: 'https://bsky.app/profile/sigreer.bsky.social', icon: 'simple-icons:bluesky' },
  ],
  repo: 'https://github.com/sigreer/simongreer.co.uk',
} as const;

export type NavItem = {
  label: string;
  href: string;
  icon: string;
  /** Path prefix used for active-state matching. */
  root: string;
  /** When true, Nav renders the services dropdown under this item. */
  hasServicesMenu?: boolean;
};

export const NAV_ITEMS: readonly NavItem[] = [
  { label: 'Blog Posts', href: '/blog/', icon: 'material-symbols:newspaper-outline', root: '/blog' },
  {
    label: 'Hire Me',
    href: '/hire-me/',
    icon: 'material-symbols:work-outline',
    root: '/hire-me',
    hasServicesMenu: true,
  },
  {
    label: 'About Me',
    href: '/me/personally/',
    icon: 'material-symbols:account-circle-outline',
    root: '/me',
  },
] as const;
