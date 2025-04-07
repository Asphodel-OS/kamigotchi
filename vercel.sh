#!/bin/bash
 
if [[ $MODE == "production" ]]; then 
  pnpm -F client build:prod
elif [[ $MODE == "staging" ]]; then
  pnpm -F client build:prev
elif [[ $MODE == "testing" ]]; then
  pnpm -F client build:test
else
  pnpm -F client build:prod
fi