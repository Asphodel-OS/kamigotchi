import { PortalConfigs } from 'app/cache/config';

// tooltip copy for the header help chip. taxes and delay read from the live
// portal config so the numbers can never drift from what the world charges
export const getHelpText = (config: PortalConfigs) => {
  const imp = config.tax.import;
  const exp = config.tax.export;
  const delayDays = (config.delay ?? 0) / 86400;
  return [
    'You can deposit and withdraw supported',
    'ERC20 tokens through the Token Portal.',
    '\n',
    'Once deposited, assets are converted into',
    'in-world items you can freely spend and use.',
    'Deposited assets are available instantly,',
    'but withdrawals generate a pending Receipt',
    `which can be claimed after a delay (~${delayDays.toFixed(0)}d atm).`,
    '\n',
    `Import tax: ${imp.rate * 100}% + ${imp.flat} flat per deposit.`,
    `Export tax: ${exp.rate * 100}% + ${exp.flat} flat per withdrawal.`,
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
