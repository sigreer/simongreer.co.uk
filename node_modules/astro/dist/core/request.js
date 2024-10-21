const clientAddressSymbol = Symbol.for("astro.clientAddress");
const clientLocalsSymbol = Symbol.for("astro.locals");
function createRequest({
  url,
  headers,
  clientAddress,
  method = "GET",
  body = void 0,
  logger,
  locals,
  isPrerendered = false
}) {
  const headersObj = isPrerendered ? void 0 : headers instanceof Headers ? headers : new Headers(
    // Filter out HTTP/2 pseudo-headers. These are internally-generated headers added to all HTTP/2 requests with trusted metadata about the request.
    // Examples include `:method`, `:scheme`, `:authority`, and `:path`.
    // They are always prefixed with a colon to distinguish them from other headers, and it is an error to add the to a Headers object manually.
    // See https://httpwg.org/specs/rfc7540.html#HttpRequest
    Object.entries(headers).filter(([name]) => !name.startsWith(":"))
  );
  if (typeof url === "string") url = new URL(url);
  if (isPrerendered) {
    url.search = "";
  }
  const request = new Request(url, {
    method,
    headers: headersObj,
    // body is made available only if the request is for a page that will be on-demand rendered
    body: isPrerendered ? null : body
  });
  if (isPrerendered) {
    const _headers = request.headers;
    const headersDesc = Object.getOwnPropertyDescriptor(request, "headers") || {};
    Object.defineProperty(request, "headers", {
      ...headersDesc,
      get() {
        logger.warn(
          null,
          `\`Astro.request.headers\` is not available on prerendered pages. If you need access to request headers, make sure that the page is server rendered using \`export const prerender = false;\` or by setting \`output\` to \`"server"\` in your Astro config to make all your pages server rendered.`
        );
        return _headers;
      }
    });
  } else if (clientAddress) {
    Reflect.set(request, clientAddressSymbol, clientAddress);
  }
  Reflect.set(request, clientLocalsSymbol, locals ?? {});
  return request;
}
export {
  createRequest
};
