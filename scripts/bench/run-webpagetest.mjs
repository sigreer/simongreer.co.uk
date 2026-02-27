#!/usr/bin/env node
/**
 * WebPageTest runner (optional integration).
 *
 * Submits a test to the WebPageTest API, polls for completion,
 * and writes the results as JSON. Gracefully skips if no API key
 * is provided.
 *
 * Usage:
 *   node scripts/bench/run-webpagetest.mjs \
 *     --url https://simongreer.co.uk \
 *     --label v5-baseline \
 *     --api-key YOUR_WPT_KEY
 */

import { writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { resolve, join } from 'node:path';

import { BENCH_SITE_URL, OUTPUT_DIR, todayLabel, buildUrl } from './config.mjs';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const WPT_API_BASE = 'https://www.webpagetest.org/runtest.php';
const WPT_RESULT_BASE = 'https://www.webpagetest.org/jsonResult.php';
const DEFAULT_RUNS = 3;
const POLL_INTERVAL_MS = 15_000;
const MAX_POLL_ATTEMPTS = 120; // ~30 minutes max wait

// ---------------------------------------------------------------------------
// CLI argument parsing
// ---------------------------------------------------------------------------

function parseArgs(argv) {
  const args = {
    url: BENCH_SITE_URL,
    label: 'unlabelled',
    apiKey: process.env.WPT_API_KEY || '',
    runs: DEFAULT_RUNS,
    paths: null,
    help: false,
  };

  for (let i = 2; i < argv.length; i++) {
    const arg = argv[i];
    switch (arg) {
      case '--url':
        args.url = argv[++i];
        break;
      case '--label':
        args.label = argv[++i];
        break;
      case '--api-key':
        args.apiKey = argv[++i];
        break;
      case '--runs':
        args.runs = parseInt(argv[++i], 10);
        break;
      case '--paths':
        args.paths = argv[++i].split(',').map((p) => p.trim());
        break;
      case '--help':
      case '-h':
        args.help = true;
        break;
      default:
        console.error(`Unknown argument: ${arg}`);
        process.exit(1);
    }
  }

  return args;
}

function printHelp() {
  console.log(`
run-webpagetest.mjs - WebPageTest runner (optional)

USAGE
  node scripts/bench/run-webpagetest.mjs [options]

OPTIONS
  --url <url>            Base URL to benchmark (default: BENCH_SITE_URL env or ${BENCH_SITE_URL})
  --label <label>        Label for this benchmark run (default: unlabelled)
  --api-key <key>        WebPageTest API key (or set WPT_API_KEY env var)
  --runs <n>             Number of test runs (default: ${DEFAULT_RUNS})
  --paths <list>         Comma-separated URL paths to test (default: /)
  -h, --help             Show this help message

ENVIRONMENT
  WPT_API_KEY            WebPageTest API key (alternative to --api-key)
  BENCH_SITE_URL         Base URL override.

EXAMPLES
  node scripts/bench/run-webpagetest.mjs --url https://simongreer.co.uk --label v5-baseline --api-key KEY
  node scripts/bench/run-webpagetest.mjs --paths /,/blog --label speed-brain
`);
}

// ---------------------------------------------------------------------------
// WebPageTest API helpers
// ---------------------------------------------------------------------------

async function submitTest(url, apiKey, runs) {
  const params = new URLSearchParams({
    url,
    k: apiKey,
    f: 'json',
    runs: String(runs),
    fvonly: '0', // first view + repeat view
    video: '1', // enable filmstrip capture
    lighthouse: '1',
  });

  const response = await fetch(`${WPT_API_BASE}?${params.toString()}`);
  if (!response.ok) {
    throw new Error(
      `WPT submit error (${response.status}): ${response.statusText}`,
    );
  }

  const data = await response.json();
  if (data.statusCode !== 200) {
    throw new Error(
      `WPT submit rejected: ${data.statusText || JSON.stringify(data)}`,
    );
  }

  return data.data;
}

async function pollForResult(testId) {
  for (let attempt = 0; attempt < MAX_POLL_ATTEMPTS; attempt++) {
    const response = await fetch(
      `${WPT_RESULT_BASE}?test=${testId}&f=json&pagespeed=1`,
    );
    if (!response.ok) {
      throw new Error(
        `WPT poll error (${response.status}): ${response.statusText}`,
      );
    }

    const data = await response.json();

    if (data.statusCode === 200) {
      return data.data;
    }

    if (data.statusCode >= 400) {
      throw new Error(
        `WPT test failed: ${data.statusText || JSON.stringify(data)}`,
      );
    }

    // Still running (statusCode 1xx)
    process.stdout.write('.');
    await new Promise((r) => setTimeout(r, POLL_INTERVAL_MS));
  }

  throw new Error('WPT test timed out after maximum poll attempts.');
}

function extractWptMetrics(result) {
  const firstView = result.median?.firstView || {};
  const repeatView = result.median?.repeatView || {};

  return {
    firstView: {
      lcp: firstView.chromeUserTiming?.LargestContentfulPaint ?? firstView['chromeUserTiming.LargestContentfulPaint'] ?? null,
      fcp: firstView.firstContentfulPaint ?? null,
      ttfb: firstView.TTFB ?? null,
      cls: firstView['chromeUserTiming.CumulativeLayoutShift'] ?? null,
      tbt: firstView.TotalBlockingTime ?? null,
      si: firstView.SpeedIndex ?? null,
      totalBytes: firstView.bytesIn ?? null,
      requestCount: firstView.requestsFull ?? null,
      loadTime: firstView.loadTime ?? null,
      fullyLoaded: firstView.fullyLoaded ?? null,
    },
    repeatView: {
      lcp: repeatView.chromeUserTiming?.LargestContentfulPaint ?? repeatView['chromeUserTiming.LargestContentfulPaint'] ?? null,
      fcp: repeatView.firstContentfulPaint ?? null,
      ttfb: repeatView.TTFB ?? null,
      cls: repeatView['chromeUserTiming.CumulativeLayoutShift'] ?? null,
      tbt: repeatView.TotalBlockingTime ?? null,
      si: repeatView.SpeedIndex ?? null,
      totalBytes: repeatView.bytesIn ?? null,
      requestCount: repeatView.requestsFull ?? null,
      loadTime: repeatView.loadTime ?? null,
      fullyLoaded: repeatView.fullyLoaded ?? null,
    },
    summary: result.summary ?? null,
    testUrl: result.testUrl ?? null,
    runs: result.runs ? Object.keys(result.runs).length : null,
  };
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main() {
  const args = parseArgs(process.argv);

  if (args.help) {
    printHelp();
    process.exit(0);
  }

  if (!args.apiKey) {
    console.warn(
      'Warning: No WebPageTest API key provided. Skipping WPT tests.',
    );
    console.warn(
      'Set WPT_API_KEY env var or pass --api-key to enable WPT testing.',
    );
    process.exit(0);
  }

  const paths = args.paths || ['/'];
  const dateLabel = todayLabel();
  const runDir = resolve(OUTPUT_DIR, `${dateLabel}-${args.label}`);

  if (!existsSync(runDir)) {
    mkdirSync(runDir, { recursive: true });
  }

  console.log(`WebPageTest run: ${args.label}`);
  console.log(`Base URL:        ${args.url}`);
  console.log(`Paths:           ${paths.join(', ')}`);
  console.log(`Runs per test:   ${args.runs}`);
  console.log(`Output dir:      ${runDir}`);
  console.log('');

  for (const path of paths) {
    const fullUrl = buildUrl(path, args.url);
    const pathSlug = path.replace(/\//g, '_').replace(/^_/, '') || 'index';

    console.log(`Submitting WPT test for ${fullUrl}...`);

    try {
      const submission = await submitTest(fullUrl, args.apiKey, args.runs);
      console.log(`  Test ID: ${submission.testId}`);
      console.log(`  Status page: ${submission.userUrl}`);
      process.stdout.write('  Waiting for results');

      const result = await pollForResult(submission.testId);
      console.log(' done');

      const metrics = extractWptMetrics(result);

      const payload = {
        url: fullUrl,
        path,
        label: args.label,
        date: dateLabel,
        testId: submission.testId,
        statusUrl: submission.userUrl,
        metrics,
      };

      const filename = `webpagetest-${pathSlug}.json`;
      const outPath = join(runDir, filename);
      writeFileSync(outPath, JSON.stringify(payload, null, 2));
      console.log(`  Saved: ${outPath}\n`);
    } catch (err) {
      console.error(`  Error testing ${fullUrl}: ${err.message}\n`);
    }
  }

  console.log('WebPageTest complete.');
}

main().catch((err) => {
  console.error('Fatal error:', err.message);
  process.exit(1);
});
