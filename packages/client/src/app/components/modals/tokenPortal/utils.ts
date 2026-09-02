import { PortalConfigs } from 'app/cache/config';
import { triggerBridgeModal } from 'app/triggers';
import { TokenIcons } from 'assets/images/tokens';
import { Tokens } from 'constants/tokens';
import { Item } from 'network/shapes';

// display facts per portal token, keyed by the item's registry token address
export interface TokenMeta {
  symbol: string; // '$ONYX'
  icon: string;
  buyLabel: string;
  onBuy: () => void;
}

const TOKEN_META: Record<string, Omit<TokenMeta, 'onBuy'> & { onBuy: (address: string) => void }> =
  {
    [Tokens.ONYX.address.toLowerCase()]: {
      symbol: '$ONYX',
      icon: TokenIcons.onyx,
      buyLabel: 'Purchase $ONYX',
      onBuy: (address) => openBaselineLink(address),
    },
    [Tokens.ETH.address.toLowerCase()]: {
      symbol: '$ETH',
      icon: TokenIcons.eth,
      buyLabel: 'Bridge ETH',
      onBuy: () => triggerBridgeModal(),
    },
  };

// unknown portal tokens fall back to a neutral label so the modal never crashes
// on an item registered on-chain before the client learned its branding, or on
// a receipt whose item the registry no longer resolves
export const getTokenMeta = (item?: Item): TokenMeta => {
  const address = (item?.token?.address ?? '').toLowerCase();
  const meta = TOKEN_META[address];
  if (!meta) {
    return {
      symbol: item?.name ?? '',
      icon: item?.image ?? '',
      buyLabel: '',
      onBuy: () => undefined,
    };
  }
  return { ...meta, onBuy: () => meta.onBuy(address) };
};

// the shape reader substitutes a dead address when an ERC20-typed item has no
// TokenAddress yet (registered in the item registry but not on the portal)
const DEAD_ADDRESS = '0x000000000000000000000000000000000000dead';
export const isPortalItem = (item: Item) => {
  const address = (item.token?.address ?? '').toLowerCase();
  return item.type === 'ERC20' && !!address && address !== DEAD_ADDRESS;
};

// wallet balance/allowance for a token address, tolerant of checksum casing
// between the registry-sourced address and the TokenChecker's store keys
export const findWalletPair = (
  balances: Map<string, { allowance: number; balance: number }>,
  address?: string
) => {
  if (!address) return undefined;
  const exact = balances.get(address);
  if (exact) return exact;
  const wanted = address.toLowerCase();
  for (const [key, pair] of balances) if (key.toLowerCase() === wanted) return pair;
  return undefined;
};

// item units -> whole tokens, shown at the item's scale (1 ETH = 1e5 shards -> 5 dp)
export const fmtTokenAmt = (units: number, item: Item) => {
  const scale = item.token?.scale ?? 0;
  return (units / 10 ** scale).toFixed(scale);
};

// get the necessary deposit balance to achieve the target balance (in item units)
export const getNeededDeposit = (config: PortalConfigs, target: number) => {
  const { flat, rate } = config.tax.import;
  const needAmt = Math.floor((target + flat) / (1 - rate));
  return needAmt;
};

// get the resulting (post-tax) withdrawal balance from initial (in item units)
export const getResultWithdraw = (config: PortalConfigs, target: number) => {
  const { flat, rate } = config.tax.export;
  const ratedTax = Math.floor(target * rate);
  const amt = target - ratedTax - flat;
  return Math.max(0, amt);
};

// open the link to Baseline Markets ONYX listing. hardcoded for now; the
// caller (IconButton) owns the click sound
export const openBaselineLink = (address: string) => {
  const url = `https://app.baseline.markets/tokens/1/0x80Ea38D56E262457D73c0d8dFe027AE8925821e2`;
  window.open(url, '_blank');
};

// get the balance conversion rate from token to item
export const getSwapRate = (item: Item) => {
  return 10 ** (item.token?.scale ?? 0);
};
