/**
 * Timing Export Utilities
 *
 * These utilities allow you to export performance timing data from the browser
 * to analyze sync performance across different runs.
 */

export interface TimingEntry {
  name: string;
  duration: number;
  startTime: number;
  entryType: string;
}

export interface TimingReport {
  timestamp: string;
  userAgent: string;
  url: string;
  measures: TimingEntry[];
  marks: TimingEntry[];
  navigation?: TimingEntry[];
}

// Global storage for worker timing data
let workerTimingData: { measures: TimingEntry[]; marks: TimingEntry[] } | null = null;

/**
 * Store timing data received from the worker
 */
export const storeWorkerTimingData = (measures: TimingEntry[], marks: TimingEntry[]): void => {
  workerTimingData = { measures, marks };
  console.log('📊 Worker timing data received:', {
    measures: measures.length,
    marks: marks.length,
  });
  console.log('💡 Use timingExport.download() to download the timing data');
};

/**
 * Collects all performance timing data
 */
export const collectTimingData = (): TimingReport => {
  // Use worker timing data if available, otherwise fall back to main thread
  const measures = workerTimingData?.measures || performance.getEntriesByType('measure');
  const marks = workerTimingData?.marks || performance.getEntriesByType('mark');
  const navigation = performance.getEntriesByType('navigation');

  return {
    timestamp: new Date().toISOString(),
    userAgent: navigator.userAgent,
    url: window.location.href,
    measures: measures.map(entry => ({
      name: entry.name,
      duration: entry.duration,
      startTime: entry.startTime,
      entryType: entry.entryType,
    })),
    marks: marks.map(entry => ({
      name: entry.name,
      duration: entry.duration,
      startTime: entry.startTime,
      entryType: entry.entryType,
    })),
    navigation: navigation.map(entry => ({
      name: entry.name,
      duration: entry.duration,
      startTime: entry.startTime,
      entryType: entry.entryType,
    })),
  };
};

/**
 * Exports timing data as a downloadable JSON file
 */
export const downloadTimingData = (filename?: string): void => {
  const data = collectTimingData();
  const jsonString = JSON.stringify(data, null, 2);
  const blob = new Blob([jsonString], { type: 'application/json' });
  const url = URL.createObjectURL(blob);

  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
  const defaultFilename = `timing-data-${timestamp}.json`;

  const a = document.createElement('a');
  a.href = url;
  a.download = filename || defaultFilename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);

  console.log('Timing data downloaded:', defaultFilename);
};

/**
 * Prints a formatted timing report to the console
 */
export const printTimingReport = (filter?: string): void => {
  const data = collectTimingData();

  console.group('🕐 Performance Timing Report');
  console.log('Timestamp:', data.timestamp);
  console.log('URL:', data.url);

  const measures = filter
    ? data.measures.filter(m => m.name.includes(filter))
    : data.measures;

  if (measures.length > 0) {
    console.group('📊 Measures');
    console.table(
      measures
        .sort((a, b) => b.duration - a.duration)
        .map(m => ({
          Name: m.name,
          'Duration (ms)': m.duration.toFixed(2),
          'Start (ms)': m.startTime.toFixed(2),
        }))
    );
    console.groupEnd();
  }

  if (!filter) {
    console.group('📍 Marks');
    console.log(`Total marks: ${data.marks.length}`);
    if (data.marks.length < 50) {
      console.table(
        data.marks.map(m => ({
          Name: m.name,
          'Time (ms)': m.startTime.toFixed(2),
        }))
      );
    } else {
      console.log('(Too many marks to display - use filter or download data)');
    }
    console.groupEnd();
  }

  console.groupEnd();
};

/**
 * Gets a summary of timing data organized by category
 */
export const getTimingSummary = (): Record<string, { count: number; total: number; avg: number; max: number; min: number }> => {
  const data = collectTimingData();
  const summary: Record<string, { count: number; total: number; values: number[] }> = {};

  for (const measure of data.measures) {
    // Extract category (e.g., 'fetchSnapshot' from 'fetchSnapshot:start')
    const category = measure.name.split(':')[0].split('.')[0];

    if (!summary[category]) {
      summary[category] = { count: 0, total: 0, values: [] };
    }

    summary[category].count++;
    summary[category].total += measure.duration;
    summary[category].values.push(measure.duration);
  }

  // Calculate statistics
  return Object.fromEntries(
    Object.entries(summary).map(([key, value]) => [
      key,
      {
        count: value.count,
        total: Math.round(value.total * 100) / 100,
        avg: Math.round((value.total / value.count) * 100) / 100,
        max: Math.round(Math.max(...value.values) * 100) / 100,
        min: Math.round(Math.min(...value.values) * 100) / 100,
      }
    ])
  );
};

/**
 * Prints a timing summary grouped by category
 */
export const printTimingSummary = (): void => {
  const summary = getTimingSummary();
  console.group('📈 Timing Summary by Category');
  console.table(summary);
  console.groupEnd();
};

// Expose to window for easy access in browser console
if (typeof window !== 'undefined') {
  (window as any).timingExport = {
    download: downloadTimingData,
    print: printTimingReport,
    summary: printTimingSummary,
    collect: collectTimingData,
    getSummary: getTimingSummary,
  };

  console.log('💡 Timing export utilities available:');
  console.log('  - timingExport.download()      // Download timing data as JSON');
  console.log('  - timingExport.print(filter?)  // Print timing report to console');
  console.log('  - timingExport.summary()       // Print timing summary by category');
  console.log('  - timingExport.collect()       // Get raw timing data');
  console.log('  - timingExport.getSummary()    // Get timing summary object');
}
