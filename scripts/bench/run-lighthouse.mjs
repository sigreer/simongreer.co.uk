#!/usr/bin/env node
/**
 * Lighthouse CI runner using the PageSpeed Insights API.
 *
 * Runs N iterations against each strategy (mobile / desktop), extracts
 * core web vitals and additional metrics, and writes the raw results
 * as JSON files into the bench-results directory.
 *
 * Usage:
 *   node scripts/bench/run-lighthouse.mjs \
 *     --url https://simongreer.co.uk \
 *     --label v5-baseline \
 *     --runs 5 \
 *     --strategy mobile,desktop
 */

import { writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { resolve, join } from 'node:path';

import {
  PAGESPEED_API_KEY,
  BENCH_SITE_URL,
  DEFAULT_RUNS,
  STRATEGIES,
  CATEGORIES,
  METRICS,
  OUTPUT_DIR,
  todayLabel,
  buildUrl,
} from './config.mjs';

// ---------------------------------------------------------------------------
// CLI argument parsing
// ---------------------------------------------------------------------------

function parseArgs(argv) {
  const args = {
    url: BENCH_SITE_URL,
    label: 'unlabelled',
    runs: DEFAULT_RUNS,
    strategies: [...STRATEGIES],
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
      case '--runs':
        args.runs = parseInt(argv[++i], 10);
        break;
      case '--strategy':
        args.strategies = argv[++i].split(',').map((s) => s.trim());
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
run-lighthouse.mjs - Lighthouse CI runner via PageSpeed Insights API

USAGE
  node scripts/bench/run-lighthouse.mjs [options]

OPTIONS
  --url <url>            Base URL to benchmark (default: BENCH_SITE_URL env or ${BENCH_SITE_URL})
  --label <label>        Label for this benchmark run (default: unlabelled)
  --runs <n>             Number of iterations per page/strategy (default: ${DEFAULT_RUNS})
  --strategy <list>      Comma-separated strategies: mobile,desktop (default: both)
  --paths <list>         Comma-separated URL paths to test (default: /, /blog, /tech)
  -h, --help             Show this help message

ENVIRONMENT
  PAGESPEED_API_KEY      Required. Your PageSpeed Insights API key.
  BENCH_SITE_URL         Base URL override.

EXAMPLES
  node scripts/bench/run-lighthouse.mjs --url https://bench.simongreer.co.uk --label v5-baseline --runs 5
  node scripts/bench/run-lighthouse.mjs --label speed-brain --paths /,/blog --strategy mobile
`);
}

// ---------------------------------------------------------------------------
// PageSpeed Insights API call
// ---------------------------------------------------------------------------

async function fetchPageSpeedResult(url, strategy, apiKey) {
  const categoryParams = CATEGORIES.map((c) => `category=${c}`).join('&');
  const apiUrl = `https://www.googleapis.com/pagespeedonline/v5/runPagespeed?url=${encodeURIComponent(url)}&key=${apiKey}&strategy=${strategy}&${categoryParams}`;

  const response = await fetch(apiUrl);
  if (!response.ok) {
    const text = await response.text();
    throw new Error(
      `PageSpeed API error (${response.status}): ${response.statusText}\n${text}`,
    );
  }
  return response.json();
}

// ---------------------------------------------------------------------------
// Metric extraction
// ---------------------------------------------------------------------------

function extractMetrics(result) {
  const audits = result.lighthouseResult?.audits || {};
  const metrics = {};

  for (const m of METRICS) {
    const audit = audits[m.key];
    if (!audit) {
      metrics[m.id] = null;
      continue;
    }

    if (m.extractCount) {
      // network-requests audit stores items in details.items
      const items = audit.details?.items;
      metrics[m.id] = Array.isArray(items) ? items.length : null;
    } else {
      metrics[m.id] = audit.numericValue ?? null;
    }
  }

  // Category scores (0-1 floats)
  const categories = result.lighthouseResult?.categories || {};
  metrics.scores = {};
  for (const cat of CATEGORIES) {
    metrics.scores[cat] = categories[cat]?.score ?? null;
  }

  return metrics;
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

  if (!PAGESPEED_API_KEY) {
    console.error(
      'Error: PAGESPEED_API_KEY environment variable is required.',
    );
    console.error('Set it in your .dev.vars or export it before running.');
    process.exit(1);
  }

  const paths = args.paths || ['/', '/blog', '/tech'];
  const dateLabel = todayLabel();
  const runDir = resolve(OUTPUT_DIR, `${dateLabel}-${args.label}`);

  if (!existsSync(runDir)) {
    mkdirSync(runDir, { recursive: true });
  }

  console.log(`Benchmark run: ${args.label}`);
  console.log(`Base URL:      ${args.url}`);
  console.log(`Paths:         ${paths.join(', ')}`);
  console.log(`Strategies:    ${args.strategies.join(', ')}`);
  console.log(`Runs per page: ${args.runs}`);
  console.log(`Output dir:    ${runDir}`);
  console.log('');

  const allResults = {};

  for (const path of paths) {
    const fullUrl = buildUrl(path, args.url);
    const pathSlug = path.replace(/\//g, '_').replace(/^_/, '') || 'index';

    for (const strategy of args.strategies) {
      console.log(
        `Testing ${fullUrl} [${strategy}] - ${args.runs} run(s)...`,
      );

      const runs = [];

      for (let i = 1; i <= args.runs; i++) {
        process.stdout.write(`  Run ${i}/${args.runs}... `);
        try {
          const result = await fetchPageSpeedResult(
            fullUrl,
            strategy,
            PAGESPEED_API_KEY,
          );
          const metrics = extractMetrics(result);
          runs.push({
            run: i,
            timestamp: new Date().toISOString(),
            metrics,
          });
          console.log('done');
        } catch (err) {
          console.error(`failed: ${err.message}`);
          runs.push({
            run: i,
            timestamp: new Date().toISOString(),
            error: err.message,
          });
        }
      }

      const resultPayload = {
        url: fullUrl,
        path,
        strategy,
        label: args.label,
        date: dateLabel,
        totalRuns: args.runs,
        runs,
      };

      const filename = `lighthouse-${pathSlug}-${strategy}.json`;
      const outPath = join(runDir, filename);
      writeFileSync(outPath, JSON.stringify(resultPayload, null, 2));
      console.log(`  Saved: ${outPath}\n`);

      const key = `${pathSlug}-${strategy}`;
      allResults[key] = resultPayload;
    }
  }

  // Write a combined manifest
  const manifestPath = join(runDir, 'manifest.json');
  writeFileSync(
    manifestPath,
    JSON.stringify(
      {
        label: args.label,
        date: dateLabel,
        baseUrl: args.url,
        paths,
        strategies: args.strategies,
        runsPerPage: args.runs,
        files: Object.keys(allResults).map(
          (k) =>
            `lighthouse-${k.replace(`-${allResults[k].strategy}`, '')}-${allResults[k].strategy}.json`,
        ),
      },
      null,
      2,
    ),
  );
  console.log(`Manifest: ${manifestPath}`);
  console.log('Benchmark complete.');
}

main().catch((err) => {
  console.error('Fatal error:', err.message);
  process.exit(1);
});
