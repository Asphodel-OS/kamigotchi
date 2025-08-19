export {
  getAddress as getConfigAddress,
  getArray as getConfigArray,
  getValue as getConfigValue,
  processAddress as processConfigAddress,
  processArray as processConfigArray,
  processValue as processConfigValue,
} from './base';
export { getMintConfig as getGachaMintConfig } from './gacha';
export { getConfig as getKamiConfig, processConfig as processKamiConfig } from './kami';

export type { GachaMintConfig } from './gacha';
