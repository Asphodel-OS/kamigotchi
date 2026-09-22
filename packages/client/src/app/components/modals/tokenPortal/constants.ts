import { PortalConfigs } from 'app/cache/config';

// "12h" / "2d" / "60s": the delay in whichever unit divides it cleanly
const fmtDelay = (seconds: number) => {
  if (seconds >= 86400 && seconds % 86400 === 0) return `${seconds / 86400}d`;
  if (seconds >= 3600 && seconds % 3600 === 0) return `${seconds / 3600}h`;
  if (seconds >= 60 && seconds % 60 === 0) return `${seconds / 60}m`;
  return `${seconds}s`;
};

// tooltip copy for the header help chip. taxes and delay read from the live
// portal config so the numbers can never drift from what the world charges
export const getHelpText = (config: PortalConfigs) => {
  const imp = config.tax.import;
  const exp = config.tax.export;
  const delay = fmtDelay(config.delay ?? 0);
  return [
    'You can deposit and withdraw supported',
    'tokens ($ONYX, $ETH) through the Token Portal.',
    '\n',
    'Once deposited, assets are converted into',
    'in-world items (Onyx Shards, Ether Shards)',
    'you can freely spend, trade, and pool.',
    'Deposited assets are available instantly,',
    'but withdrawals generate a pending Receipt',
    `which can be claimed after a delay (${delay}).`,
    '$ETH withdrawals can pay out to your operator',
    'wallet instead of your owner wallet.',
    '\n',
    `Import tax: ${imp.rate * 100}% + ${imp.flat} shard flat per deposit.`,
    `Export tax: ${exp.rate * 100}% + ${exp.flat} shard flat per withdrawal.`,
    'The flat part is one shard of the token you move:',
    '0.01 $ONYX for Onyx Shards, 0.00001 $ETH for Ether Shards.',
    'Taxes are non-refundable and subject to change.',
    '\n',
    'Thank you for your patronage ^^',
    '\n',
    '---',
    '\n',
    'In all seriousness, the withdrawal delay is',
    'a safety measure, and the plan is to use fees',
    'as an economic heuristic to lower the delay',
    'for honest players. This mechanism remains',
    'unsolved and is open to discussion in the',
    'community Discord.',
  ];
};
