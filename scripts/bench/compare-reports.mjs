#!/usr/bin/env node
/**
 * Compare two benchmark runs side-by-side.
 *
 * Loads metrics-summary.json from each directory, produces a comparison
 * markdown table showing deltas and percentage changes, and optionally
 * sends the comparison to a Mattermost webhook.
 *
 * Usage:
 *   node scripts/bench/compare-reports.mjs \
 *     --a bench-results/2026-02-27-v5-baseline \
 *     --b bench-results/2026-02-27-v5-speed-brain \
 *     --webhook
 */

import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { join, resolve, basename } from 'node:path';

import {
  METRICS,
  THRESHOLDS,
  PAGESPEED_WEBHOOK_URL,
} from './config.mjs';

// ---------------------------------------------------------------------------
// CLI argument parsing
// ---------------------------------------------------------------------------

function parseArgs(argv) {
  const args = {
    dirA: null,
    dirB: null,
    webhook: false,
    webhookUrl: PAGESPEED_WEBHOOK_URL,
    output: null,
    help: false,
  };

  for (let i = 2; i < argv.length; i++) {
    const arg = argv[i];
    switch (arg) {
      case '--a':
        args.dirA = argv[++i];
        break;
      case '--b':
        args.dirB = argv[++i];
        break;
      case '--webhook':
        args.webhook = true;
        break;
      case '--webhook-url':
        args.webhookUrl = argv[++i];
        args.webhook = true;
        break;
      case '--output':
      case '-o':
        args.output = argv[++i];
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
compare-reports.mjs - Compare two benchmark runs

USAGE
  node scripts/bench/compare-reports.mjs --a <dir-a> --b <dir-b> [options]

OPTIONS
  --a <dir>              Path to first benchmark results directory (required)
  --b <dir>              Path to second benchmark results directory (required)
  --webhook              Send comparison to Mattermost webhook
  --webhook-url <url>    Override webhook URL (implies --webhook)
  --output, -o <file>    Write comparison markdown to a file
  -h, --help             Show this help message

ENVIRONMENT
  PAGESPEED_WEBHOOK_URL  Mattermost webhook URL for --webhook flag.

DESCRIPTION
  Both directories must contain a metrics-summary.json file (produced
  by collect-metrics.mjs). The script matches pages by path + strategy
  and produces a comparison table showing:
    - Metric values from each run
    - Absolute delta
    - Percentage change
    - Status (improved / regressed / neutral)

  Lower values are better for all metrics except scores.

EXAMPLES
  node scripts/bench/compare-reports.mjs \\
    --a bench-results/2026-02-27-v5-baseline \\
    --b bench-results/2026-02-27-v5-speed-brain

  node scripts/bench/compare-reports.mjs \\
    --a bench-results/2026-02-27-v5-baseline \\
    --b bench-results/2026-02-27-v5-speed-brain \\
    --webhook --output comparison.md
`);
}

// ---------------------------------------------------------------------------
// Comparison logic
// ---------------------------------------------------------------------------

/**
 * Determine if a metric improvement means a lower value is better.
 * For all web vital metrics, lower is better.
 */
function lowerIsBetter(metricId) {
  return true; // All our tracked metrics: lower = better
}

function statusLabel(delta, metricId) {
  if (delta === null || delta === undefined) return 'N/A';

  const absDelta = Math.abs(delta);
  const threshold = THRESHOLDS[metricId];

  // Use 5% of the pass threshold as a "noise" threshold for neutral
  const noiseThreshold = threshold ? threshold.pass * 0.05 : 0;

  if (absDelta <= noiseThreshold) return 'neutral';

  if (lowerIsBetter(metricId)) {
    return delta < 0 ? 'improved' : 'regressed';
  }
  return delta > 0 ? 'improved' : 'regressed';
}

function statusMarker(status) {
  switch (status) {
    case 'improved':
      return '[IMPROVED]';
    case 'regressed':
      return '[REGRESSED]';
    case 'neutral':
      return '[NEUTRAL]';
    default:
      return '[-]';
  }
}

function loadSummary(dir) {
  const summaryPath = join(resolve(dir), 'metrics-summary.json');
  if (!existsSync(summaryPath)) {
    console.error(`Error: metrics-summary.json not found in ${dir}`);
    console.error('Run collect-metrics.mjs first to generate the summary.');
    process.exit(1);
  }
  return JSON.parse(readFileSync(summaryPath, 'utf-8'));
}

function generateComparison(summaryA, summaryB, labelA, labelB) {
  const lines = [];
  lines.push(`# Benchmark Comparison`);
  lines.push('');
  lines.push(`- **Config A**: ${labelA}`);
  lines.push(`- **Config B**: ${labelB}`);
  lines.push('');

  // Find matching keys (path + strategy combinations)
  const keysA = new Set(Object.keys(summaryA));
  const keysB = new Set(Object.keys(summaryB));
  const commonKeys = [...keysA].filter((k) => keysB.has(k));
  const onlyA = [...keysA].filter((k) => !keysB.has(k));
  const onlyB = [...keysB].filter((k) => !keysA.has(k));

  if (onlyA.length > 0) {
    lines.push(`> Pages only in A: ${onlyA.join(', ')}`);
    lines.push('');
  }
  if (onlyB.length > 0) {
    lines.push(`> Pages only in B: ${onlyB.join(', ')}`);
    lines.push('');
  }

  if (commonKeys.length === 0) {
    lines.push(
      '**No matching pages found between the two runs.** Ensure both runs tested the same paths and strategies.',
    );
    return lines.join('\n');
  }

  for (const key of commonKeys) {
    const a = summaryA[key];
    const b = summaryB[key];

    lines.push(`## ${key}`);
    lines.push('');
    lines.push(
      `| Metric | ${labelA} | ${labelB} | Delta | Delta % | Status |`,
    );
    lines.push(
      '|--------|-----------|-----------|-------|---------|--------|',
    );

    for (const m of METRICS) {
      const statsA = a.metrics?.[m.id];
      const statsB = b.metrics?.[m.id];

      const valA = statsA?.median ?? null;
      const valB = statsB?.median ?? null;

      const fmt = (v) => {
        if (v === null) return '-';
        return m.id === 'cls' ? v.toFixed(4) : v.toFixed(1);
      };

      let delta = null;
      let deltaPercent = null;
      let status = 'N/A';

      if (valA !== null && valB !== null) {
        delta = valB - valA;
        deltaPercent = valA !== 0 ? (delta / valA) * 100 : null;
        status = statusLabel(delta, m.id);
      }

      const deltaStr =
        delta !== null
          ? `${delta >= 0 ? '+' : ''}${m.id === 'cls' ? delta.toFixed(4) : delta.toFixed(1)}`
          : '-';
      const deltaPctStr =
        deltaPercent !== null
          ? `${deltaPercent >= 0 ? '+' : ''}${deltaPercent.toFixed(1)}%`
          : '-';

      lines.push(
        `| ${m.label} | ${fmt(valA)} | ${fmt(valB)} | ${deltaStr} | ${deltaPctStr} | ${statusMarker(status)} |`,
      );
    }

    lines.push('');

    // Scores comparison
    const scoreCats = new Set([
      ...Object.keys(a.scores || {}),
      ...Object.keys(b.scores || {}),
    ]);

    if (scoreCats.size > 0) {
      lines.push(
        `| Score | ${labelA} | ${labelB} | Delta |`,
      );
      lines.push(
        '|-------|-----------|-----------|-------|',
      );

      for (const cat of scoreCats) {
        const valA = a.scores?.[cat]?.median ?? null;
        const valB = b.scores?.[cat]?.median ?? null;
        const fmtScore = (v) =>
          v === null ? '-' : `${(v * 100).toFixed(0)}%`;

        let deltaStr = '-';
        if (valA !== null && valB !== null) {
          const d = (valB - valA) * 100;
          deltaStr = `${d >= 0 ? '+' : ''}${d.toFixed(0)}pp`;
        }

        lines.push(
          `| ${cat} | ${fmtScore(valA)} | ${fmtScore(valB)} | ${deltaStr} |`,
        );
      }
      lines.push('');
    }
  }

  return lines.join('\n');
}

// ---------------------------------------------------------------------------
// Webhook
// ---------------------------------------------------------------------------

async function sendToWebhook(webhookUrl, markdown) {
  console.log('Sending comparison to webhook...');

  const payload = { text: markdown };
  const response = await fetch(webhookUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(
      `Webhook error (${response.status}): ${response.statusText}\n${errorText}`,
    );
  }

  console.log('Webhook sent successfully.');
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

  if (!args.dirA || !args.dirB) {
    console.error('Error: Both --a and --b arguments are required.');
    console.error('Run with --help for usage information.');
    process.exit(1);
  }

  const summaryA = loadSummary(args.dirA);
  const summaryB = loadSummary(args.dirB);

  const labelA = basename(resolve(args.dirA));
  const labelB = basename(resolve(args.dirB));

  const markdown = generateComparison(summaryA, summaryB, labelA, labelB);

  // Print to stdout
  console.log(markdown);

  // Optionally write to file
  if (args.output) {
    writeFileSync(args.output, markdown);
    console.log(`\nComparison written to ${args.output}`);
  }

  // Optionally send to webhook
  if (args.webhook) {
    if (!args.webhookUrl) {
      console.error(
        'Error: No webhook URL. Set PAGESPEED_WEBHOOK_URL env var or use --webhook-url.',
      );
      process.exit(1);
    }
    await sendToWebhook(args.webhookUrl, markdown);
  }
}

main().catch((err) => {
  console.error('Fatal error:', err.message);
  process.exit(1);
});
