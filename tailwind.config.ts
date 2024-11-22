import type { Config } from 'tailwindcss';
import typography from '@tailwindcss/typography';

const config: Config = {
	content: [
		'./src/**/*.{astro,html,js,jsx,md,mdx,svelte,ts,tsx,vue,scss}',
	],
	theme: {
		extend: {
			maxWidth: {
				sm: '640px',
				md: '768px',
				lg: '1024px',
				xl: '1280px',
				'2xl': '1536px',
				'3xl': '1920px',
			},
			keyframes: {
				'arrow-fade': {
					'0%, 100%': { transform: 'translateX(0)', opacity: '1' },
					'50%': { transform: 'translateX(8px)', opacity: '0.5' },
				}
			},
			animation: {
				'arrow-fade': 'arrow-fade 1.5s ease-in-out infinite',
			}
		},
		screens: {
			sm: '640px',
			md: '768px',
			lg: '1024px',
			xl: '1280px',
			'2xl': '1536px',
			'3xl': '1920px',
		},
		fontFamily: {
			body: [
				'Inter', 
				'ui-sans-serif', 
				'system-ui', 
				'-apple-system', 
				'system-ui', 
				'Segoe UI', 
				'Roboto', 
				'Helvetica Neue', 
				'Arial', 
				'Noto Sans', 
				'sans-serif', 
				'Apple Color Emoji', 
				'Segoe UI Emoji', 
				'Segoe UI Symbol', 
				'Noto Color Emoji',
			],
			sans: [
				'Inter', 
				'ui-sans-serif', 
				'system-ui', 
				'-apple-system', 
				'system-ui', 
				'Segoe UI', 
				'Roboto', 
				'Helvetica Neue', 
				'Arial', 
				'Noto Sans', 
				'sans-serif', 
				'Apple Color Emoji', 
				'Segoe UI Emoji', 
				'Segoe UI Symbol', 
				'Noto Color Emoji',
			],
		},
	},
	plugins: [
		typography
	],
};

export default config;
