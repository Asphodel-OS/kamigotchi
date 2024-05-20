import { utils } from 'ethers';
import { AdminAPI } from '../admin';

export async function initConfigs(api: AdminAPI) {
  await api.config.set.string('BASE_URI', 'https://image.asphodel.io/kami/');

  // Leaderboards
  await api.config.set.number('LEADERBOARD_EPOCH', 1);

  // Account Stamina
  await api.config.set.number('ACCOUNT_STAMINA_BASE', 20);
  await api.config.set.number('ACCOUNT_STAMINA_RECOVERY_PERIOD', 300);

  // Friends
  await api.config.set.number('BASE_FRIENDS_LIMIT', 10);
  await api.config.set.number('FRIENDS_REQUEST_LIMIT', 10);

  // Kami Mint Price and Limits
  // to be 5, set at 500 for testing
  await api.config.set.number('MINT_ACCOUNT_MAX', 5);
  await api.config.set.number('MINT_INITIAL_MAX', 1111);
  await api.config.set.number('MINT_TOTAL_MAX', 4444);
  await api.config.set.number('MINT_PRICE', utils.parseEther('0.0'));
  await api.config.set.number('GACHA_REROLL_PRICE', utils.parseEther('0.0001'));

  // Kami Base Stats
  await api.config.set.number('KAMI_BASE_HEALTH', 50);
  await api.config.set.number('KAMI_BASE_POWER', 10);
  await api.config.set.number('KAMI_BASE_VIOLENCE', 10);
  await api.config.set.number('KAMI_BASE_HARMONY', 10);
  await api.config.set.number('KAMI_BASE_SLOTS', 0);

  // Kami Leveling Curve
  await api.config.set.number('KAMI_LVL_REQ_BASE', 40); // experience required for level 1->2
  await api.config.set.array('KAMI_LVL_REQ_MULT_BASE', [1259, 3]);

  // Kami Standard Cooldown Requirement
  await api.config.set.number('KAMI_STANDARD_COOLDOWN', 180);

  ////////////////////
  // SKILL EFFECT (AsphoAST Nodes)
  // [nudge, nudge_prec, ratio, ratio_prec, shift, shift_prec, boost, boost_prec]

  // Harvest Effects
  await api.config.set.array('KAMI_HARV_EFFICACY', [0, 500, 500, 3]); // [neut, up, down, prec]
  await api.config.set.array('KAMI_HARV_FERTILITY', [0, 0, 2500, 3, 0, 0, 1000, 3]);
  await api.config.set.array('KAMI_HARV_BOUNTY', [0, 9, 0, 0, 0, 0, 1000, 3]);
  await api.config.set.array('KAMI_HARV_INTENSITY', [0, 0, 10800, 0, 0, 0, 0, 0]);
  await api.config.set.array('KAMI_HARV_DEDICATION', [0, 0, 1500, 3]); // nontraditional AST node, but similar

  // Health Effects
  await api.config.set.array('KAMI_MUSU_STRAIN', [0, 0, 200, 3, 0, 0, 1000, 3]);
  await api.config.set.array('KAMI_REST_METABOLISM', [0, 0, 200, 3, 0, 0, 1000, 3]);

  // Liquidation Effects
  await api.config.set.array('KAMI_LIQ_EFFICACY', [0, 500, 500, 3]); // [neut, up, down, prec]
  await api.config.set.array('KAMI_LIQ_ANIMOSITY', [0, 0, 400, 3]); // nontraditional AST node
  await api.config.set.array('KAMI_LIQ_THRESHOLD', [0, 3, 1000, 3, 0, 3, 0, 0]);
  await api.config.set.array('KAMI_LIQ_SALVAGE', [0, 0, 0, 3, 0, 0, 0, 0]);
  await api.config.set.array('KAMI_LIQ_SPOILS', [0, 0, 500, 3, 0, 0, 0, 0]);
}

// local config settings for faster testing
export async function initLocalConfigs(api: AdminAPI) {
  await api.config.set.number('MINT_ACCOUNT_MAX', 50000000);
  await api.config.set.number('ACCOUNT_STAMINA_RECOVERY_PERIOD', 10);
  await api.config.set.number('KAMI_LVL_REQ_BASE', 5); // experience required for level 1->2
  await api.config.set.number('KAMI_STANDARD_COOLDOWN', 30);
  await api.config.set.array('KAMI_HARV_FERTILITY', [0, 0, 100000, 3, 0, 0, 1000, 3]);
  await api.config.set.array('KAMI_HARV_INTENSITY', [0, 0, 300, 0, 0, 0, 0, 0]);
  await api.config.set.array('KAMI_REST_METABOLISM', [0, 0, 100000, 3, 0, 0, 1000, 3]);
}
