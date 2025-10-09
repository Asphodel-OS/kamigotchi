#!/usr/bin/env ts-node
/**
 * Timing Data Analysis Script
 *
 * This script analyzes timing data files downloaded from the browser.
 * It can compare multiple timing files and generate reports.
 *
 * Usage:
 *   ts-node scripts/downloadTimingData.ts <file1.json> [file2.json ...]
 *   ts-node scripts/downloadTimingData.ts --compare <file1.json> <file2.json>
 */

import * as fs from 'fs';
import * as path from 'path';

interface TimingEntry {
  name: string;
  duration: number;
  startTime: number;
  entryType: string;
}

interface TimingReport {
  timestamp: string;
  userAgent: string;
  url: string;
  measures: TimingEntry[];
  marks: TimingEntry[];
  navigation?: TimingEntry[];
}

interface CategoryStats {
  count: number;
  total: number;
  avg: number;
  max: number;
  min: number;
}

/**
 * Load timing data from a JSON file
 */
function loadTimingData(filepath: string): TimingReport {
  const content = fs.readFileSync(filepath, 'utf-8');
  return JSON.parse(content);
}

/**
 * Calculate statistics for timing measures grouped by category
 */
function calculateCategoryStats(measures: TimingEntry[]): Record<string, CategoryStats> {
  const categoryData: Record<string, number[]> = {};

  for (const measure of measures) {
    // Extract category (e.g., 'fetchSnapshot' from 'fetchSnapshot:start')
    const category = measure.name.split(':')[0].split('.')[0];

    if (!categoryData[category]) {
      categoryData[category] = [];
    }
    categoryData[category].push(measure.duration);
  }

  const stats: Record<string, CategoryStats> = {};
  for (const [category, durations] of Object.entries(categoryData)) {
    stats[category] = {
      count: durations.length,
      total: durations.reduce((a, b) => a + b, 0),
      avg: durations.reduce((a, b) => a + b, 0) / durations.length,
      max: Math.max(...durations),
      min: Math.min(...durations),
    };
  }

  return stats;
}

/**
 * Print a timing report
 */
function printReport(data: TimingReport, filename: string) {
  console.log('\n' + '='.repeat(80));
  console.log(`📊 Timing Report: ${path.basename(filename)}`);
  console.log('='.repeat(80));
  console.log(`Timestamp: ${data.timestamp}`);
  console.log(`URL: ${data.url}`);
  console.log(`Total Measures: ${data.measures.length}`);
  console.log(`Total Marks: ${data.marks.length}`);

  const categoryStats = calculateCategoryStats(data.measures);

  console.log('\n📈 Category Statistics:');
  console.log('-'.repeat(80));
  console.log(
    '%-30s %8s %12s %12s %12s %12s',
    'Category',
    'Count',
    'Total (ms)',
    'Avg (ms)',
    'Max (ms)',
    'Min (ms)'
  );
  console.log('-'.repeat(80));

  const sortedCategories = Object.entries(categoryStats).sort(
    (a, b) => b[1].total - a[1].total
  );

  for (const [category, stats] of sortedCategories) {
    console.log(
      '%-30s %8d %12.2f %12.2f %12.2f %12.2f',
      category,
      stats.count,
      stats.total,
      stats.avg,
      stats.max,
      stats.min
    );
  }

  // Show top 10 longest individual operations
  console.log('\n⏱️  Top 10 Longest Operations:');
  console.log('-'.repeat(80));
  console.log('%-50s %12s', 'Operation', 'Duration (ms)');
  console.log('-'.repeat(80));

  const topMeasures = [...data.measures]
    .sort((a, b) => b.duration - a.duration)
    .slice(0, 10);

  for (const measure of topMeasures) {
    console.log('%-50s %12.2f', measure.name, measure.duration);
  }

  console.log('='.repeat(80) + '\n');
}

/**
 * Compare two timing reports
 */
function compareReports(data1: TimingReport, file1: string, data2: TimingReport, file2: string) {
  console.log('\n' + '='.repeat(80));
  console.log(`📊 Timing Comparison`);
  console.log('='.repeat(80));
  console.log(`File 1: ${path.basename(file1)} (${data1.timestamp})`);
  console.log(`File 2: ${path.basename(file2)} (${data2.timestamp})`);

  const stats1 = calculateCategoryStats(data1.measures);
  const stats2 = calculateCategoryStats(data2.measures);

  console.log('\n📈 Category Comparison (Total Duration):');
  console.log('-'.repeat(100));
  console.log(
    '%-30s %12s %12s %12s %10s',
    'Category',
    'File 1 (ms)',
    'File 2 (ms)',
    'Diff (ms)',
    'Change %'
  );
  console.log('-'.repeat(100));

  const allCategories = new Set([...Object.keys(stats1), ...Object.keys(stats2)]);

  const comparisons: Array<{
    category: string;
    total1: number;
    total2: number;
    diff: number;
    pct: number;
  }> = [];

  for (const category of allCategories) {
    const total1 = stats1[category]?.total || 0;
    const total2 = stats2[category]?.total || 0;
    const diff = total2 - total1;
    const pct = total1 > 0 ? (diff / total1) * 100 : 0;

    comparisons.push({ category, total1, total2, diff, pct });
  }

  // Sort by absolute difference
  comparisons.sort((a, b) => Math.abs(b.diff) - Math.abs(a.diff));

  for (const comp of comparisons) {
    const diffSign = comp.diff >= 0 ? '+' : '';
    const pctSign = comp.pct >= 0 ? '+' : '';
    console.log(
      '%-30s %12.2f %12.2f %s%11.2f %s%9.1f%%',
      comp.category,
      comp.total1,
      comp.total2,
      diffSign,
      comp.diff,
      pctSign,
      comp.pct
    );
  }

  console.log('='.repeat(100) + '\n');
}

/**
 * Main function
 */
function main() {
  const args = process.argv.slice(2);

  if (args.length === 0) {
    console.log('Usage:');
    console.log('  View single report:');
    console.log('    ts-node scripts/downloadTimingData.ts <file.json>');
    console.log('  Compare two reports:');
    console.log('    ts-node scripts/downloadTimingData.ts --compare <file1.json> <file2.json>');
    console.log('\nYou can download timing data from the browser console using:');
    console.log('    timingExport.download()');
    process.exit(1);
  }

  if (args[0] === '--compare') {
    if (args.length < 3) {
      console.error('Error: --compare requires two file arguments');
      process.exit(1);
    }

    const file1 = args[1];
    const file2 = args[2];

    if (!fs.existsSync(file1)) {
      console.error(`Error: File not found: ${file1}`);
      process.exit(1);
    }
    if (!fs.existsSync(file2)) {
      console.error(`Error: File not found: ${file2}`);
      process.exit(1);
    }

    const data1 = loadTimingData(file1);
    const data2 = loadTimingData(file2);

    compareReports(data1, file1, data2, file2);
  } else {
    // Print reports for each file
    for (const file of args) {
      if (!fs.existsSync(file)) {
        console.error(`Error: File not found: ${file}`);
        continue;
      }

      const data = loadTimingData(file);
      printReport(data, file);
    }
  }
}

main();
