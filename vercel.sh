#!/bin/bash
 
if [[ $MODE == "production" ]]; then 
  npm run client build:prod
elif [[ $MODE == "staging" ]]; then
  npm run client build:prod
elif [[ $MODE == "testing" ]]; then
  npm run client build:test
else
  npm run client build:prod
fi