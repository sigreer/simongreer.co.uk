/**
 * Speed Brain Benchmark Proxy Worker
 *
 * Sits in front of bench.simongreer.co.uk and conditionally injects the
 * Speculation-Rules HTTP header to simulate Cloudflare Speed Brain being
 * ON or OFF. This gives per-request control for A/B benchmarking without
 * needing to toggle the feature in the Cloudflare dashboard.
 *
 * Activation signals (either one triggers injection):
 *   - Query parameter:  ?speed-brain=on
 *   - Request header:   x-bench-speed-brain: on
 *
 * The worker always adds a response header indicating which mode was used:
 *   x-bench-speed-brain: on | off
 */

export interface Env {
	/** Origin URL for the benchmark site, e.g. "https://simongreer-bench.pages.dev" */
	BENCH_ORIGIN: string;
}

/**
 * The Speculation-Rules JSON payload that Cloudflare Speed Brain injects.
 * This matches the real header value produced by the feature.
 */
const SPECULATION_RULES_JSON = JSON.stringify({
	prefetch: [
		{
			source: "document",
			where: {
				and: [
					{ href_matches: "/*" },
					{ not: { href_matches: "/cdn-cgi/*" } },
					{ not: { selector_matches: "a[rel~=noreferrer]" } },
				],
			},
			eagerness: "moderate",
		},
	],
});

export default {
	async fetch(request: Request, env: Env): Promise<Response> {
		const url = new URL(request.url);

		// --- Determine activation ---
		const paramActive = url.searchParams.get("speed-brain") === "on";
		const headerActive =
			request.headers.get("x-bench-speed-brain") === "on";
		const speedBrainOn = paramActive || headerActive;

		// --- Build upstream request ---
		// Strip the speed-brain query param so it doesn't pollute origin
		// caching or appear in analytics.
		url.searchParams.delete("speed-brain");

		// Rewrite the host to the benchmark origin while preserving the path
		// and remaining query string.
		const origin = new URL(env.BENCH_ORIGIN);
		url.hostname = origin.hostname;
		url.port = origin.port;
		url.protocol = origin.protocol;

		const upstreamRequest = new Request(url.toString(), {
			method: request.method,
			headers: request.headers,
			body: request.body,
			redirect: "follow",
		});

		// --- Fetch from origin ---
		const response = await fetch(upstreamRequest);

		// Clone headers so we can mutate them.
		const headers = new Headers(response.headers);

		// --- Inject Speed Brain header if activated ---
		if (speedBrainOn) {
			headers.set("Speculation-Rules", SPECULATION_RULES_JSON);
			headers.set("x-bench-speed-brain", "on");
		} else {
			headers.set("x-bench-speed-brain", "off");
		}

		return new Response(response.body, {
			status: response.status,
			statusText: response.statusText,
			headers,
		});
	},
} satisfies ExportedHandler<Env>;
