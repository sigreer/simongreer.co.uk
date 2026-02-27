/**
 * Shared configuration for the benchmark system.
 *
 * Provides default URLs, Lighthouse settings, metric thresholds,
 * and output directory configuration. All values can be overridden
 * by environment variables or CLI arguments.
 */

// ---------------------------------------------------------------------------
// Environment
// ---------------------------------------------------------------------------

/** PageSpeed Insights API key (required for Lighthouse runs). */
export const PAGESPEED_API_KEY = process.env.PAGESPEED_API_KEY || '';

/** Mattermost webhook URL for sending reports. */
export const PAGESPEED_WEBHOOK_URL = process.env.PAGESPEED_WEBHOOK_URL || '';

/** The deployed site URL to benchmark against. */
export const BENCH_SITE_URL =
  process.env.BENCH_SITE_URL || 'https://simongreer.co.uk';

// ---------------------------------------------------------------------------
// Default URLs to test (paths appended to BENCH_SITE_URL)
// ---------------------------------------------------------------------------

export const DEFAULT_PATHS = ['/', '/blog', '/tech'];

// ---------------------------------------------------------------------------
// Lighthouse / PageSpeed Insights settings
// ---------------------------------------------------------------------------

/** Number of runs per page for statistical significance. */
export const DEFAULT_RUNS = 5;

/** Strategies to test. */
export const STRATEGIES = ['mobile', 'desktop'];

/** Lighthouse categories to request. */
export const CATEGORIES = [
  'performance',
  'accessibility',
  'best-practices',
  'seo',
];

// ---------------------------------------------------------------------------
// Metrics to capture
// ---------------------------------------------------------------------------

/**
 * Keys used to extract metric values from the Lighthouse JSON result.
 * The `key` corresponds to `lighthouseResult.audits[key].numericValue`.
 */
export const METRICS = [
  { id: 'lcp', key: 'largest-contentful-paint', label: 'LCP (ms)' },
  { id: 'fcp', key: 'first-contentful-paint', label: 'FCP (ms)' },
  { id: 'ttfb', key: 'server-response-time', label: 'TTFB (ms)' },
  { id: 'cls', key: 'cumulative-layout-shift', label: 'CLS' },
  { id: 'tbt', key: 'total-blocking-time', label: 'TBT (ms)' },
  { id: 'si', key: 'speed-index', label: 'Speed Index (ms)' },
  {
    id: 'total-byte-weight',
    key: 'total-byte-weight',
    label: 'Total Transfer (bytes)',
  },
  {
    id: 'network-requests',
    key: 'network-requests',
    label: 'Request Count',
    extractCount: true,
  },
];

// ---------------------------------------------------------------------------
// Thresholds  – pass / warn / fail
// Values represent the *upper bound* for that status.
// For CLS the values are unitless; everything else is in ms or bytes.
// ---------------------------------------------------------------------------

export const THRESHOLDS = {
  lcp: { pass: 2500, warn: 4000 },
  fcp: { pass: 1800, warn: 3000 },
  ttfb: { pass: 800, warn: 1800 },
  cls: { pass: 0.1, warn: 0.25 },
  tbt: { pass: 200, warn: 600 },
  si: { pass: 3400, warn: 5800 },
  'total-byte-weight': { pass: 1_600_000, warn: 3_000_000 },
  'network-requests': { pass: 50, warn: 80 },
};

// ---------------------------------------------------------------------------
// Output
// ---------------------------------------------------------------------------

/** Root directory for benchmark results (relative to project root). */
export const OUTPUT_DIR = 'bench-results';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Return a threshold status string for a given metric value.
 *
 * @param {string} metricId  One of the keys in THRESHOLDS.
 * @param {number} value     The measured value.
 * @returns {'pass'|'warn'|'fail'|'unknown'}
 */
export function thresholdStatus(metricId, value) {
  const t = THRESHOLDS[metricId];
  if (!t) return 'unknown';
  if (value <= t.pass) return 'pass';
  if (value <= t.warn) return 'warn';
  return 'fail';
}

/**
 * Build a fully-qualified URL from a path and optional base.
 *
 * @param {string} path  e.g. "/blog"
 * @param {string} [base]  e.g. "https://simongreer.co.uk"
 * @returns {string}
 */
export function buildUrl(path, base = BENCH_SITE_URL) {
  // If the path is already a full URL, return it as-is.
  if (path.startsWith('http://') || path.startsWith('https://')) return path;
  return new URL(path, base).toString();
}

/**
 * Format today's date as YYYY-MM-DD.
 *
 * @returns {string}
 */
export function todayLabel() {
  const d = new Date();
  const pad = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}
