#!/bin/bash
set -e

echo "=== Checking bundle size limits ==="

check_size() {
  local pattern=$1
  local limit_mb=$2
  local name=$3

  local largest=$(ls -S $pattern 2>/dev/null | head -1)
  if [ -z "$largest" ]; then
    echo "⚠ $name: no files matching $pattern"
    return 0
  fi

  local size=$(wc -c < "$largest")
  local limit_bytes=$((limit_mb * 1024 * 1024))
  local size_mb=$((size / 1024 / 1024))

  echo "$name: ${size_mb}MB ($size bytes) - limit: ${limit_mb}MB [$largest]"

  if [ $size -gt $limit_bytes ]; then
    echo "::error::$name ($size bytes) exceeds ${limit_mb}MB limit"
    return 1
  fi
}

check_size "dist/assets/index-*.js" 4 "index.js" || exit 1
check_size "dist/assets/cosmos-vendor-*.js" 3 "cosmos-vendor.js" || exit 1
check_size "dist/assets/react-vendor-*.js" 1 "react-vendor.js" || exit 1

echo ""
echo "=== All JS bundles (largest first) ==="
ls -lhS dist/assets/*.js | head -15

echo ""
echo "✓ Bundle sizes OK"