### Upgrading System with Multisig owner

1. Ensure _multisig_ is defined in `.env`
2. Deploy new system(s) with `npm run deploy:test:partial` `--systems`. Save the new system address(es) for later.
3. Generate multisig batch txs with `npm run multisig:systems:test` `--systems <system name>` `--addresses <new addresses>`
4. Copy `./batchTx.json` to Safe create tx site
   Note: only 1 system at a time is supported for now when generating batch txs
   yada yada yada
