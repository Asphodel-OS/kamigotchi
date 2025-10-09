# SyncWorker Timing Export

This directory contains deep performance timing instrumentation for the SyncWorker's `init()` method, with a focus on `fetchSnapshot()` and all its sub-functions.

## Overview

Performance marks and measures have been added to track timing at multiple levels:

- **Top level**: `fetchSnapshot`, `getStateBlock`, `storeStateBlock`
- **Component fetching**: `fetchComponents`, `getComponents`, `storeStateComponents`
- **Entity fetching**: `fetchEntities`, `getEntities` (overall + per-chunk), `storeStateEntities` (per-chunk)
- **State removals**: `fetchStateRemovals`, `getStateRemovals` (overall + per-chunk), `removeStateValues` (per-chunk)
- **State values**: `fetchStateValues`, `getStateValues` (overall + per-chunk), `storeStateValues` (per-chunk)

## How It Works

The SyncWorker runs in a Web Worker context (separate from the main browser thread). When initialization completes:

1. The worker collects all performance marks and measures
2. Sends them to the main thread via a `TimingData` event
3. The main thread stores them in global state
4. You can access them via the browser console using `timingExport` utilities

This happens automatically - you don't need to do anything special to capture the timing data.

## Usage in Browser

### Quick Start

Open the browser console and use the globally available `timingExport` utilities:

```javascript
// Download timing data as a JSON file
timingExport.download()

// Print timing report to console (optional: filter by name)
timingExport.print()
timingExport.print('fetchSnapshot')  // Filter to only show fetchSnapshot-related timings

// Print summary grouped by category
timingExport.summary()

// Get raw timing data as an object
const data = timingExport.collect()

// Get summary statistics as an object
const stats = timingExport.getSummary()
```

### When to Collect Timing Data

The timing data is **automatically captured when the SyncWorker finishes initializing** (when the app reaches the "LIVE" state). You'll see a console message like:

```
📊 Worker timing data received: { measures: 245, marks: 490 }
💡 Use timingExport.download() to download the timing data
```

After you see this message, you can download or view the timing data anytime.

### Browser Console Workflow

1. Open your app in the browser
2. Wait for sync to complete (status shows "Streaming Live Events")
3. Open browser DevTools (F12)
4. In the console, run: `timingExport.download()`
5. A JSON file will be downloaded with a timestamp in the filename
6. Optionally, view the data in console: `timingExport.print()` or `timingExport.summary()`

## Analyzing Downloaded Data

After downloading timing data from the browser, you can analyze it on your local machine using the provided scripts.

### View a Single Report

```bash
# Using Node.js (no dependencies required)
node scripts/analyzeTimingData.js timing-data-2025-10-09T12-30-45.json

# Using TypeScript (requires ts-node)
ts-node scripts/downloadTimingData.ts timing-data-2025-10-09T12-30-45.json
```

This will show:
- Overall statistics (total measures, marks)
- Category statistics (count, total, avg, max, min)
- Top 10 longest operations

### Compare Two Reports

Compare timing data from different runs (e.g., before and after an optimization):

```bash
node scripts/analyzeTimingData.js --compare before.json after.json
```

This will show:
- Side-by-side comparison of each category
- Differences in milliseconds
- Percentage change

### Example Analysis Output

```
================================================================================
📊 Timing Report: timing-data-2025-10-09T12-30-45.json
================================================================================
Timestamp: 2025-10-09T12:30:45.123Z
URL: https://yourapp.com
Total Measures: 245
Total Marks: 490

📈 Category Statistics:
--------------------------------------------------------------------------------
Category                         Count   Total (ms)    Avg (ms)    Max (ms)    Min (ms)
--------------------------------------------------------------------------------
fetchStateValues                    43     15234.56      354.06     2341.23       12.34
getStateValues                      42     14890.12      354.53     2340.89       11.98
fetchEntities                       35      8765.43      250.44     1456.78       45.67
getEntities                         34      8234.21      242.18     1450.32       44.21
...

⏱️  Top 10 Longest Operations:
--------------------------------------------------------------------------------
Operation                                              Duration (ms)
--------------------------------------------------------------------------------
getStateValues:chunk0                                       2340.89
fetchStateValues                                           15234.56
getEntities:chunk0                                          1450.32
...
```

## What Gets Measured

### fetchSnapshot (overall)
- Time to fetch complete snapshot from Kamigaze service
- Includes all sub-operations

### getStateBlock
- Time to fetch block metadata from Kamigaze

### fetchComponents
- Time to fetch all components
- Includes `getComponents` (network) and `storeStateComponents` (processing)

### fetchEntities (with per-chunk timing)
- Overall time to fetch all entities
- `getEntities:chunkN` - Time for each chunk to arrive
- `storeStateEntities:chunkN` - Time to process each chunk

### fetchStateRemovals (with per-chunk timing)
- Overall time to fetch and process removals
- `getStateRemovals:chunkN` - Time for each chunk to arrive
- `removeStateValues:chunkN` - Time to process each chunk

### fetchStateValues (with per-chunk timing)
- Overall time to fetch and process state values (usually the longest)
- `getStateValues:chunkN` - Time for each chunk to arrive
- `storeStateValues:chunkN` - Time to process each chunk (includes decoding)

## Understanding the Results

### Network vs. Processing Time

- `get*` measures = Network time (waiting for data from Kamigaze)
- `store*` / `remove*` measures = Processing time (decoding, storing in cache)

### Chunk-level granularity

For streamed operations (entities, state values, removals), you can see:
- Which chunks take longest to arrive (network bottleneck)
- Which chunks take longest to process (CPU bottleneck)
- Total time vs. sum of chunks (overhead)

### Comparing Runs

Use the compare feature to:
- Measure impact of optimizations
- Compare different network conditions
- Identify regressions

## Files

- `src/workers/sync/snapshot/fetch.ts` - Instrumented snapshot fetching code
- `src/workers/sync/timingExport.ts` - Browser utilities for collecting/exporting timing data
- `scripts/analyzeTimingData.js` - Node.js script to analyze downloaded JSON files
- `scripts/downloadTimingData.ts` - TypeScript version of the analysis script

## Tips

1. **Collect multiple samples**: Run the same scenario 3-5 times to account for variability
2. **Clear cache between runs**: Use incognito mode or clear IndexedDB to measure cold start
3. **Use filters**: When viewing in console, use `timingExport.print('getStateValues')` to focus on specific operations
4. **Compare network conditions**: Test on different network speeds to identify network-bound operations
5. **Watch for outliers**: If one chunk takes much longer, it might indicate a specific data pattern issue
