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
			colors: {
				primary: {
					50: '#f0fdf4',
					100: '#dcfce7',
					200: '#bbf7d0',
					300: '#86efac',
					400: '#4ade80',
					500: '#22c55e',
					600: '#16a34a',
					700: '#15803d',
					800: '#166534',
					900: '#14532d',
					950: '#052e16',
				},
				'navbar-blue': 'rgba(32, 85, 149, 1)',
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
