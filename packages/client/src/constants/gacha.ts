import { utils } from 'ethers';

import { formatEntityID } from 'engine/utils';

export const GACHA_ID = formatEntityID(utils.solidityKeccak256(['string'], ['gacha.id']));
export const GACHA_MAX_PER_TX = 10;
