import { AdminAPI } from '../admin';

export async function initConfigs(api: AdminAPI) {
  await initBase(api);
  await initLeaderboard(api);
  await initAccount(api);
  await initFriends(api);
  await initLeveling(api);
  await initMint(api);
  await initStats(api);
  await initHarvest(api);
  await initLiquidation(api);
  await initSkills(api);
}

// local config settings for faster testing
export async function initLocalConfigs(api: AdminAPI) {
  await api.config.set.string('BASE_URI', 'https://image.asphodel.io/kami');
  await api.config.set.array('ACCOUNT_STAMINA', [
    100, // total stamina
    1, // recovery period per point
    5, // movement cost (in stamina)
    5, // experience per move
  ]);
  await api.config.set.number('KAMI_LVL_REQ_BASE', 5); // experience required for level 1->2
  await api.config.set.number('KAMI_STANDARD_COOLDOWN', 30);
  await api.config.set.array('KAMI_HARV_FERTILITY', [0, 0, 100, 0, 0, 0, 1000, 3]);
  await api.config.set.array('KAMI_HARV_INTENSITY', [1, 0, 2, 0, 0, 0, 0, 0]); // 960x testnet rate
  await api.config.set.array('KAMI_REST_METABOLISM', [0, 0, 100, 0, 0, 0, 1000, 3]);
  await api.config.set.number('BYPASS_VRF', 1);
}

///////////////////
// CATEGORIES

async function initBase(api: AdminAPI) {
  await api.config.set.string('BASE_URI', 'https://i.test.asphodel.io/kami');
}

async function initLeaderboard(api: AdminAPI) {
  await api.config.set.number('LEADERBOARD_EPOCH', 1);
}

async function initAccount(api: AdminAPI) {
  await api.config.set.array('ACCOUNT_STAMINA', [
    100, // total stamina
    60, // recovery period per point
    5, // movement cost (in stamina)
    5, // experience per move
  ]);
}

async function initFriends(api: AdminAPI) {
  await api.config.set.number('FRIENDS_BASE_LIMIT', 10);
  await api.config.set.number('FRIENDS_REQUEST_LIMIT', 10);
}

async function initLeveling(api: AdminAPI) {
  await api.config.set.number('KAMI_LVL_REQ_BASE', 40); // experience required for level 1->2
  await api.config.set.array('KAMI_LVL_REQ_MULT_BASE', [1259, 3]);
}

async function initMint(api: AdminAPI) {
  // await api.config.set.number('GACHA_REROLL_PRICE', utils.parseEther('0.0001'));
  await api.config.set.number('GACHA_REROLL_PRICE', 0);
  await api.config.set.number('GACHA_MAX_REROLLS', 10);
}

async function initStats(api: AdminAPI) {
  // base
  await api.config.set.number('KAMI_BASE_HEALTH', 50);
  await api.config.set.number('KAMI_BASE_POWER', 10);
  await api.config.set.number('KAMI_BASE_VIOLENCE', 10);
  await api.config.set.number('KAMI_BASE_HARMONY', 10);
  await api.config.set.number('KAMI_BASE_SLOTS', 0);

  // healing
  await api.config.set.array('KAMI_REST_METABOLISM', [0, 0, 1200, 3, 0, 0, 1000, 3]);

  // cooldown
  await api.config.set.number('KAMI_STANDARD_COOLDOWN', 180);
}

async function initHarvest(api: AdminAPI) {
  // [nudge, nudge_prec, ratio, ratio_prec, shift, shift_prec, boost, boost_prec]
  await api.config.set.array('KAMI_HARV_EFFICACY', [0, 500, 300, 3]); // [neut, up, down, prec]
  await api.config.set.array('KAMI_HARV_FERTILITY', [0, 0, 1500, 3, 0, 0, 1000, 3]);
  await api.config.set.array('KAMI_HARV_INTENSITY', [5, 0, 480, 0, 0, 0, 10, 0]); // nudge is multiplier on base, ratio is inversed
  await api.config.set.array('KAMI_HARV_BOUNTY', [0, 9, 0, 0, 0, 0, 1000, 3]);
  await api.config.set.array('KAMI_HARV_STRAIN', [20, 0, 7500, 3, 0, 0, 1000, 3]); // hijacking nudge here for denominator base value
}

async function initLiquidation(api: AdminAPI) {
  // [nudge, nudge_prec, ratio, ratio_prec, shift, shift_prec, boost, boost_prec]
  await api.config.set.array('KAMI_LIQ_EFFICACY', [0, 500, 500, 3]); // [neut, up, down, prec]
  await api.config.set.array('KAMI_LIQ_ANIMOSITY', [0, 0, 400, 3]); // nontraditional AST node
  await api.config.set.array('KAMI_LIQ_THRESHOLD', [0, 3, 1000, 3, 0, 3, 0, 0]);
  await api.config.set.array('KAMI_LIQ_SALVAGE', [0, 2, 0, 3, 0, 0, 0, 0]); // hijacked nudge for power tuning (REQUIRED: config[3] >= config[1])
  await api.config.set.array('KAMI_LIQ_SPOILS', [45, 2, 0, 3, 0, 0, 0, 0]); // hijacked nudge for power tuning (REQUIRED: config[3] >= config[1])
  await api.config.set.array('KAMI_LIQ_KARMA', [0, 0, 3000, 3, 0, 0, 0, 0]);
}

async function initSkills(api: AdminAPI) {
  await api.config.set.array('KAMI_TREE_REQ', [0, 5, 15, 25, 40, 55, 75, 95]);
}
