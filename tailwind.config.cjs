/** @type {import('tailwindcss').Config} */
module.exports = {
	content: [
		'./src/**/*.{astro,html,js,jsx,md,mdx,svelte,ts,tsx,vue,scss}',
		'./node_modules/flowbite/**/*.js'
	],
	safelist: [
		'blue1', 'blue2', 'blue3',
		'purple1', 'purple2', 'purple3',
		'green1', 'green2', 'green3',
		'orange1', 'orange2', 'orange3',
		'red1', 'red2', 'red3',
		'yellow1', 'yellow2', 'yellow3',
		'cyan1', 'cyan2', 'cyan3',
		'lime1', 'lime2', 'lime3',
		'pink1', 'pink2', 'pink3',
		'black1', 'black2', 'black3',
		'teal1', 'teal2', 'teal3',
		'gray1', 'gray2', 'gray3',
	],
	theme: {
		extend: {
			maxWidth: {
				'2xl': '1536px',
				'3xl': '1920px',
			},
			colors: {
				primary: {"50":"#f0fdf4","100":"#dcfce7","200":"#bbf7d0","300":"#86efac","400":"#4ade80","500":"#22c55e","600":"#16a34a","700":"#15803d","800":"#166534","900":"#14532d","950":"#052e16"},
				'navbar-blue': 'rgba(32, 85, 149, 1)',
			}
		},
		screens: {
			'sm': '640px',
			'md': '768px',
			'lg': '1024px',
			'xl': '1280px',
			'2xl': '1536px',
			'3xl': '1920px',
		},
	},
	fontFamily: {
		'body': [
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
	  'Noto Color Emoji'
	],
		'sans': [
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
	  'Noto Color Emoji'
	]},
	plugins: [
		require('flowbite/plugin'),
		require('flowbite-typography'),
		require("@designbycode/tailwindcss-text-stroke"),
		require('@tailwindcss/typography'),
	],
}