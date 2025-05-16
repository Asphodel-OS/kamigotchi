export const ignoreSolcErrors = [
  '--ignored-error-codes',
  '6321',
  '--ignored-error-codes',
  '5740',
  '--ignored-error-codes',
  '5667',
  '--ignored-error-codes',
  '2072',
  '--ignored-error-codes',
  '2018',
];

export const verifyContracts = [
  '--verify',
  '--verifier',
  'custom',
  '--retries',
  '3',
  '--delay',
  '2',
  '--verifier-url',
  'https://verification.alleslabs.dev/evm/verification/solidity/external/yominet-1',
];
