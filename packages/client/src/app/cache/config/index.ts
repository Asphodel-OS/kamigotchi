export {
  getAddress as getConfigAddress,
  getArray as getConfigArray,
  getValue as getConfigValue,
  processAddress as processConfigAddress,
  processArray as processConfigArray,
  processValue as processConfigValue,
} from './base';
export { getMintConfig as getGachaMintConfig } from './gacha';
export { getKamiConfig } from './kami';

export type { GachaMintConfig } from './gacha';
