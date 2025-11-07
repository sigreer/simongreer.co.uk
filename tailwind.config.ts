import type { Config } from 'tailwindcss';
import typography from '@tailwindcss/typography';

const config: Config = {
    darkMode: ['class'],
    content: [
		'./src/**/*.{astro,html,js,jsx,md,mdx,svelte,ts,tsx,vue,scss}',
	],
	theme: {


    	extend: {
					patterns: {
        opacities: {
            100: "1",
            80: ".80",
            60: ".60",
            40: ".40",
            20: ".20",
            10: ".10",
            5: ".05",
        },
        sizes: {
            1: "0.25rem",
            2: "0.5rem",
            4: "1rem",
            6: "1.5rem",
            8: "2rem",
            16: "4rem",
            20: "5rem",
            24: "6rem",
            32: "8rem",
        }
    },
    		maxWidth: {
    			sm: '640px',
    			md: '768px',
    			lg: '1024px',
    			xl: '1280px',
    			'2xl': '1536px',
    			'3xl': '1920px'
    		},
    		keyframes: {
				'arrow-fade': {
					'0%, 100%': { transform: 'translateX(0)', opacity: '1' },
					'50%': { transform: 'translateX(8px)', opacity: '0.5' },
				},
    			fadeIn: {
    				'0%': { opacity: '0' },
    				'100%': { opacity: '1' },
    			},
    			fadeOut: {
    				'0%': { opacity: '1' },
    				'100%': { opacity: '0' },
    			},
    		},
    		animation: {
    			fadeIn: 'fadeIn 500ms ease-in-out forwards',
    			fadeOut: 'fadeOut 500ms ease-in-out forwards',
				'arrow-fade': 'arrow-fade 1.5s ease-in-out infinite',
    		},
    		borderRadius: {
    			lg: 'var(--radius)',
    			md: 'calc(var(--radius) - 2px)',
    				sm: 'calc(var(--radius) - 4px)'
    		},
    		colors: {
    			background: 'hsl(var(--background))',
    			foreground: 'hsl(var(--foreground))',
    				card: {
    					DEFAULT: 'hsl(var(--card))',
    					foreground: 'hsl(var(--card-foreground))'
    				},
    				popover: {
    					DEFAULT: 'hsl(var(--popover))',
    					foreground: 'hsl(var(--popover-foreground))'
    				},
    				primary: {
    					DEFAULT: 'hsl(var(--primary))',
    					foreground: 'hsl(var(--primary-foreground))'
    				},
    				secondary: {
    					DEFAULT: 'hsl(var(--secondary))',
    					foreground: 'hsl(var(--secondary-foreground))'
    				},
    				muted: {
    					DEFAULT: 'hsl(var(--muted))',
    					foreground: 'hsl(var(--muted-foreground))'
    				},
    				accent: {
    					DEFAULT: 'hsl(var(--accent))',
    					foreground: 'hsl(var(--accent-foreground))'
    				},
    				destructive: {
    					DEFAULT: 'hsl(var(--destructive))',
    					foreground: 'hsl(var(--destructive-foreground))'
    				},
					themepink: {
						DEFAULT: 'hsl(var(--theme-pink))',
						foreground: 'hsl(var(--theme-pink-foreground))'
					},
					themepurple: {
						DEFAULT: 'hsl(var(--theme-purple))',
						foreground: 'hsl(var(--theme-purple-foreground))'
					},
					themeblue: {
						DEFAULT: 'hsl(var(--theme-blue))',
						foreground: 'hsl(var(--theme-blue-foreground))'
					},
    				border: 'hsl(var(--border))',
    				input: 'hsl(var(--input))',
    				ring: 'hsl(var(--ring))',
    				chart: {
    					'1': 'hsl(var(--chart-1))',
    					'2': 'hsl(var(--chart-2))',
    					'3': 'hsl(var(--chart-3))',
    					'4': 'hsl(var(--chart-4))',
    					'5': 'hsl(var(--chart-5))'
    				}
    		}
    	},
    	screens: {
    		sm: '640px',
    		md: '768px',
    		lg: '1024px',
    			xl: '1280px',
    			'2xl': '1536px',
    			'3xl': '1920px'
    	},
    	fontFamily: {
    		body: ['Geist Sans',
				'Inter',
				'ui-sans-serif','system-ui',
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
				'Noto Color Emoji'],
    		sans: ['Geist Sans',
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
				'Open Sans',
				'Apple Color Emoji', 
				'Segoe UI Emoji', 
				'Segoe UI Symbol',
				'Noto Color Emoji'],
			serif: [ 
				'Noto Serif', 
				'sans-serif',
				'Apple Color Emoji', 
				'Segoe UI Emoji', 
				'Segoe UI Symbol',
				'Noto Color Emoji'],
    		mono: ['Geist Mono',
				'ui-monospace',
				'SFMono-Regular',
				'Menlo',
				'Monaco',
				'Consolas', 
				'Liberation Mono', 
				'Courier New', 
				'monospace']
    	}
    },
	plugins: [
		typography,
        require("tailwindcss-animate"),
        require("tailwindcss-motion"),
		require('tailwindcss-bg-patterns'),
    ],
};

export default config;
