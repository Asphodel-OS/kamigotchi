#!/usr/bin/env node
/**
 * Timing Data Analysis Script (JavaScript version)
 *
 * This script analyzes timing data files downloaded from the browser.
 * It can compare multiple timing files and generate reports.
 *
 * Usage:
 *   node scripts/analyzeTimingData.js <file1.json> [file2.json ...]
 *   node scripts/analyzeTimingData.js --compare <file1.json> <file2.json>
 */

const fs = require('fs');
const path = require('path');

/**
 * Load timing data from a JSON file
 */
function loadTimingData(filepath) {
  const content = fs.readFileSync(filepath, 'utf-8');
  return JSON.parse(content);
}

/**
 * Calculate statistics for timing measures grouped by category
 */
function calculateCategoryStats(measures) {
  const categoryData = {};

  for (const measure of measures) {
    // Extract category (e.g., 'fetchSnapshot' from 'fetchSnapshot:start')
    const category = measure.name.split(':')[0].split('.')[0];

    if (!categoryData[category]) {
      categoryData[category] = [];
    }
    categoryData[category].push(measure.duration);
  }

  const stats = {};
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
 * Format a string with padding (simple implementation)
 */
function pad(str, width, align = 'left') {
  str = String(str);
  if (str.length >= width) return str;
  const padding = ' '.repeat(width - str.length);
  return align === 'left' ? str + padding : padding + str;
}

/**
 * Print a timing report
 */
function printReport(data, filename) {
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
    pad('Category', 30) +
    pad('Count', 8, 'right') +
    pad('Total (ms)', 12, 'right') +
    pad('Avg (ms)', 12, 'right') +
    pad('Max (ms)', 12, 'right') +
    pad('Min (ms)', 12, 'right')
  );
  console.log('-'.repeat(80));

  const sortedCategories = Object.entries(categoryStats).sort(
    (a, b) => b[1].total - a[1].total
  );

  for (const [category, stats] of sortedCategories) {
    console.log(
      pad(category, 30) +
      pad(stats.count.toString(), 8, 'right') +
      pad(stats.total.toFixed(2), 12, 'right') +
      pad(stats.avg.toFixed(2), 12, 'right') +
      pad(stats.max.toFixed(2), 12, 'right') +
      pad(stats.min.toFixed(2), 12, 'right')
    );
  }

  // Show top 10 longest individual operations
  console.log('\n⏱️  Top 10 Longest Operations:');
  console.log('-'.repeat(80));
  console.log(pad('Operation', 50) + pad('Duration (ms)', 12, 'right'));
  console.log('-'.repeat(80));

  const topMeasures = [...data.measures]
    .sort((a, b) => b.duration - a.duration)
    .slice(0, 10);

  for (const measure of topMeasures) {
    console.log(
      pad(measure.name, 50) +
      pad(measure.duration.toFixed(2), 12, 'right')
    );
  }

  console.log('='.repeat(80) + '\n');
}

/**
 * Compare two timing reports
 */
function compareReports(data1, file1, data2, file2) {
  console.log('\n' + '='.repeat(100));
  console.log(`📊 Timing Comparison`);
  console.log('='.repeat(100));
  console.log(`File 1: ${path.basename(file1)} (${data1.timestamp})`);
  console.log(`File 2: ${path.basename(file2)} (${data2.timestamp})`);

  const stats1 = calculateCategoryStats(data1.measures);
  const stats2 = calculateCategoryStats(data2.measures);

  console.log('\n📈 Category Comparison (Total Duration):');
  console.log('-'.repeat(100));
  console.log(
    pad('Category', 30) +
    pad('File 1 (ms)', 12, 'right') +
    pad('File 2 (ms)', 12, 'right') +
    pad('Diff (ms)', 12, 'right') +
    pad('Change %', 10, 'right')
  );
  console.log('-'.repeat(100));

  const allCategories = new Set([...Object.keys(stats1), ...Object.keys(stats2)]);

  const comparisons = [];

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
      pad(comp.category, 30) +
      pad(comp.total1.toFixed(2), 12, 'right') +
      pad(comp.total2.toFixed(2), 12, 'right') +
      pad(diffSign + comp.diff.toFixed(2), 12, 'right') +
      pad(pctSign + comp.pct.toFixed(1) + '%', 10, 'right')
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
    console.log('    node scripts/analyzeTimingData.js <file.json>');
    console.log('  Compare two reports:');
    console.log('    node scripts/analyzeTimingData.js --compare <file1.json> <file2.json>');
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
