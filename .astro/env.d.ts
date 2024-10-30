declare module 'astro:env/client' {
	export const DIRECTUS_URL: string | undefined;	
	export const SITE_URL: string | undefined;	
}declare module 'astro:env/server' {
	export const DIRECTUS_API_TOKEN: string | undefined;	
}