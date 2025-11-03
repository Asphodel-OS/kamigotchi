import { DefaultChain } from 'constants/chains';

export const EXPLORER_URL = DefaultChain?.blockExplorers?.default?.url ?? '';
export const LOG_HEIGHTS = ['none', '23vh', '90vh'];
