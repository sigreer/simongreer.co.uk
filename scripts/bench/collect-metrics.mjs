#!/usr/bin/env node
/**
 * Aggregate benchmark results from a run directory.
 *
 * Reads all Lighthouse JSON files from a bench-results/{date}-{label}/
 * directory, calculates statistical summaries (mean, median, p75, p95)
 * for each metric, and outputs a structured metrics-summary.json and a
 * human-readable metrics-summary.md (markdown table).
 *
 * Usage:
 *   node scripts/bench/collect-metrics.mjs --dir bench-results/2026-02-27-v5-baseline
 */

import { readFileSync, writeFileSync, readdirSync, existsSync } from 'node:fs';
import { join, resolve } from 'node:path';

import { METRICS, thresholdStatus } from './config.mjs';

// ---------------------------------------------------------------------------
// CLI argument parsing
// ---------------------------------------------------------------------------

function parseArgs(argv) {
  const args = {
    dir: null,
    help: false,
  };

  for (let i = 2; i < argv.length; i++) {
    const arg = argv[i];
    switch (arg) {
      case '--dir':
      case '-d':
        args.dir = argv[++i];
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
collect-metrics.mjs - Aggregate benchmark results

USAGE
  node scripts/bench/collect-metrics.mjs --dir <results-directory>

OPTIONS
  --dir, -d <path>       Path to the bench-results run directory (required)
  -h, --help             Show this help message

DESCRIPTION
  Reads all lighthouse-*.json files from the given directory, calculates
  mean, median, p75, and p95 statistics for each metric across all runs,
  and writes:
    - metrics-summary.json  (structured data)
    - metrics-summary.md    (human-readable markdown table)

EXAMPLES
  node scripts/bench/collect-metrics.mjs --dir bench-results/2026-02-27-v5-baseline
  node scripts/bench/collect-metrics.mjs -d bench-results/2026-02-27-speed-brain
`);
}

// ---------------------------------------------------------------------------
// Statistics helpers
// ---------------------------------------------------------------------------

function sortedNumbers(arr) {
  return [...arr].filter((v) => v !== null && v !== undefined).sort((a, b) => a - b);
}

function mean(values) {
  if (values.length === 0) return null;
  return values.reduce((s, v) => s + v, 0) / values.length;
}

function median(values) {
  const sorted = sortedNumbers(values);
  if (sorted.length === 0) return null;
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0
    ? (sorted[mid - 1] + sorted[mid]) / 2
    : sorted[mid];
}

function percentile(values, p) {
  const sorted = sortedNumbers(values);
  if (sorted.length === 0) return null;
  const index = (p / 100) * (sorted.length - 1);
  const lower = Math.floor(index);
  const upper = Math.ceil(index);
  if (lower === upper) return sorted[lower];
  return sorted[lower] + (sorted[upper] - sorted[lower]) * (index - lower);
}

function computeStats(values) {
  const clean = sortedNumbers(values);
  return {
    count: clean.length,
    mean: mean(clean),
    median: median(clean),
    p75: percentile(clean, 75),
    p95: percentile(clean, 95),
    min: clean.length > 0 ? clean[0] : null,
    max: clean.length > 0 ? clean[clean.length - 1] : null,
  };
}

// ---------------------------------------------------------------------------
// Main logic
// ---------------------------------------------------------------------------

function collectFromDirectory(dirPath) {
  const resolvedDir = resolve(dirPath);

  if (!existsSync(resolvedDir)) {
    console.error(`Error: Directory not found: ${resolvedDir}`);
    process.exit(1);
  }

  const files = readdirSync(resolvedDir).filter(
    (f) => f.startsWith('lighthouse-') && f.endsWith('.json'),
  );

  if (files.length === 0) {
    console.error(`Error: No lighthouse-*.json files found in ${resolvedDir}`);
    process.exit(1);
  }

  console.log(`Found ${files.length} Lighthouse result file(s) in ${resolvedDir}`);

  const summaries = {};

  for (const file of files) {
    const filePath = join(resolvedDir, file);
    const data = JSON.parse(readFileSync(filePath, 'utf-8'));

    const key = `${data.path || 'unknown'} [${data.strategy || 'unknown'}]`;
    console.log(`  Processing: ${file} -> ${key} (${data.runs?.length || 0} runs)`);

    // Collect metric values across all successful runs
    const metricValues = {};
    for (const m of METRICS) {
      metricValues[m.id] = [];
    }

    const scoreValues = {};

    for (const run of data.runs || []) {
      if (run.error) continue;
      const metrics = run.metrics || {};

      for (const m of METRICS) {
        if (metrics[m.id] !== null && metrics[m.id] !== undefined) {
          metricValues[m.id].push(metrics[m.id]);
        }
      }

      // Collect category scores
      if (metrics.scores) {
        for (const [cat, score] of Object.entries(metrics.scores)) {
          if (!scoreValues[cat]) scoreValues[cat] = [];
          if (score !== null) scoreValues[cat].push(score);
        }
      }
    }

    // Compute stats for each metric
    const metricStats = {};
    for (const m of METRICS) {
      const stats = computeStats(metricValues[m.id]);
      stats.status = stats.median !== null
        ? thresholdStatus(m.id, stats.median)
        : 'unknown';
      metricStats[m.id] = stats;
    }

    // Compute stats for scores
    const scoreStats = {};
    for (const [cat, values] of Object.entries(scoreValues)) {
      scoreStats[cat] = computeStats(values);
    }

    summaries[key] = {
      url: data.url,
      path: data.path,
      strategy: data.strategy,
      label: data.label,
      date: data.date,
      totalRuns: data.totalRuns,
      successfulRuns: (data.runs || []).filter((r) => !r.error).length,
      metrics: metricStats,
      scores: scoreStats,
    };
  }

  return summaries;
}

function generateMarkdown(summaries) {
  const lines = [];
  lines.push('# Benchmark Metrics Summary');
  lines.push('');

  for (const [key, summary] of Object.entries(summaries)) {
    lines.push(`## ${key}`);
    lines.push('');
    lines.push(`- **URL**: ${summary.url}`);
    lines.push(`- **Label**: ${summary.label}`);
    lines.push(`- **Date**: ${summary.date}`);
    lines.push(
      `- **Runs**: ${summary.successfulRuns}/${summary.totalRuns} successful`,
    );
    lines.push('');

    // Metrics table
    lines.push(
      '| Metric | Mean | Median | P75 | P95 | Min | Max | Status |',
    );
    lines.push(
      '|--------|------|--------|-----|-----|-----|-----|--------|',
    );

    for (const m of METRICS) {
      const s = summary.metrics[m.id];
      if (!s || s.count === 0) {
        lines.push(`| ${m.label} | - | - | - | - | - | - | - |`);
        continue;
      }

      const fmt = (v) => {
        if (v === null) return '-';
        // CLS uses 4 decimal places, everything else 0-1
        return m.id === 'cls' ? v.toFixed(4) : v.toFixed(1);
      };

      const statusIcon =
        s.status === 'pass'
          ? 'PASS'
          : s.status === 'warn'
            ? 'WARN'
            : s.status === 'fail'
              ? 'FAIL'
              : '-';

      lines.push(
        `| ${m.label} | ${fmt(s.mean)} | ${fmt(s.median)} | ${fmt(s.p75)} | ${fmt(s.p95)} | ${fmt(s.min)} | ${fmt(s.max)} | ${statusIcon} |`,
      );
    }

    lines.push('');

    // Scores table
    if (Object.keys(summary.scores).length > 0) {
      lines.push(
        '| Category | Mean | Median | Min | Max |',
      );
      lines.push(
        '|----------|------|--------|-----|-----|',
      );

      for (const [cat, s] of Object.entries(summary.scores)) {
        const fmt = (v) => (v === null ? '-' : `${(v * 100).toFixed(0)}%`);
        lines.push(
          `| ${cat} | ${fmt(s.mean)} | ${fmt(s.median)} | ${fmt(s.min)} | ${fmt(s.max)} |`,
        );
      }
      lines.push('');
    }
  }

  return lines.join('\n');
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

function main() {
  const args = parseArgs(process.argv);

  if (args.help) {
    printHelp();
    process.exit(0);
  }

  if (!args.dir) {
    console.error('Error: --dir argument is required.');
    console.error('Run with --help for usage information.');
    process.exit(1);
  }

  const summaries = collectFromDirectory(args.dir);
  const resolvedDir = resolve(args.dir);

  // Write JSON summary
  const jsonPath = join(resolvedDir, 'metrics-summary.json');
  writeFileSync(jsonPath, JSON.stringify(summaries, null, 2));
  console.log(`\nJSON summary: ${jsonPath}`);

  // Write Markdown summary
  const mdPath = join(resolvedDir, 'metrics-summary.md');
  const markdown = generateMarkdown(summaries);
  writeFileSync(mdPath, markdown);
  console.log(`Markdown summary: ${mdPath}`);

  // Also print a brief overview to stdout
  console.log('\n--- Overview ---');
  for (const [key, summary] of Object.entries(summaries)) {
    console.log(`\n${key}:`);
    for (const m of METRICS) {
      const s = summary.metrics[m.id];
      if (!s || s.count === 0) continue;
      const val = m.id === 'cls' ? s.median?.toFixed(4) : s.median?.toFixed(1);
      console.log(`  ${m.label}: ${val} (${s.status})`);
    }
  }
}

main();
