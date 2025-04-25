import { AdminAPI } from '../api';

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
  await initTokens(api);
  await initTrade(api);
  await initSkills(api);
  await initVIP(api);
}

// local config settings for faster testing
export async function initLocalConfigs(api: AdminAPI) {
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

export async function initTestingConfigs(api: AdminAPI) {
  // await api.config.set.bool('WORLD_PRIVATE', true);
  await api.config.set.string('BASE_KAMI_NAME', 'Test Kami ');
}

///////////////////
// CATEGORIES

async function initBase(api: AdminAPI) {
  await api.config.set.string('BASE_KAMI_NAME', 'Kamigotchi ');
  await api.config.set.string('BASE_URI', 'i.test.kamigotchi.io/kami');
}

async function initLeaderboard(api: AdminAPI) {
  await api.config.set.number('SCORE_EPOCH', 1);
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
  await api.config.set.number('MINT_MAX_TOTAL', 3000);

  // whitelist
  // TODO: update price and start time
  await api.config.set.number('MINT_START_WL', 1744934400); // 2025, Apr 18 7:43am epoch (s)
  // await api.config.set.number('MINT_START_WL', 1745452800); // 2025, Apr 24 12am epoch (s)
  await api.config.set.number('MINT_PRICE_WL', 50); // 0.05 ETH, 50 mETH
  await api.config.set.number('MINT_MAX_WL', 1);

  // public
  // TODO: update price and start time
  await api.config.set.number('MINT_START_PUBLIC', 1744966800); // 2025, Apr 18 9am epoch (s)
  // await api.config.set.number('MINT_START_PUBLIC', 1745539200); // 2025, Apr 25 12am epoch (s)
  await api.config.set.number('MINT_PRICE_PUBLIC', 100); // 0.1 ETH, 100 mETH
  await api.config.set.number('MINT_MAX_PUBLIC', 5);
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

export async function initHarvest(api: AdminAPI) {
  // efficacy configs [prec, neut, +, -]
  await api.config.set.array('KAMI_HARV_EFFICACY_BODY', [3, 0, 650, 250]);
  await api.config.set.array('KAMI_HARV_EFFICACY_HAND', [3, 0, 400, 150]);

  // standard configs [nudge, n_prec, ratio, r_prec, shift, s_prec, boost, b_prec]
  await api.config.set.array('KAMI_HARV_FERTILITY', [0, 0, 1500, 3, 0, 0, 1000, 3]);
  await api.config.set.array('KAMI_HARV_INTENSITY', [5, 0, 480, 0, 0, 0, 10, 0]); // nudge is multiplier on base, ratio is inversed
  await api.config.set.array('KAMI_HARV_BOUNTY', [0, 9, 0, 0, 0, 0, 1000, 3]);
  await api.config.set.array('KAMI_HARV_STRAIN', [20, 0, 7500, 3, 0, 0, 1000, 3]); // hijacking nudge here for denominator base value
}

export async function initLiquidation(api: AdminAPI) {
  await api.config.set.array('KAMI_LIQ_EFFICACY', [3, 0, 500, 500]); // [prec, neut, +, -]
  await api.config.set.array('KAMI_LIQ_ANIMOSITY', [0, 0, 400, 3]); // ratio applies to iCDF

  // standard configs [nudge, n_prec, ratio, r_prec, shift, s_prec, boost, b_prec]
  await api.config.set.array('KAMI_LIQ_THRESHOLD', [0, 3, 1000, 3, 0, 3, 0, 0]);
  await api.config.set.array('KAMI_LIQ_SALVAGE', [0, 2, 0, 3, 0, 0, 0, 0]); // hijacked nudge for power tuning (REQUIRED: config[3] >= config[1])
  await api.config.set.array('KAMI_LIQ_SPOILS', [45, 2, 0, 3, 0, 0, 0, 0]); // hijacked nudge for power tuning (REQUIRED: config[3] >= config[1])
  await api.config.set.array('KAMI_LIQ_KARMA', [0, 0, 3000, 3, 0, 0, 0, 0]);
}

async function initTokens(api: AdminAPI) {
  await api.config.set.address(
    'ERC20_RECEIVER_ADDRESS',
    '0x26274225b556D623367ddA1D07120B92F4983d6B'
  );
}

async function initTrade(api: AdminAPI) {
  await api.config.set.number('MAX_TRADES_PER_ACCOUNT', 10);
}

async function initSkills(api: AdminAPI) {
  await api.config.set.array('KAMI_TREE_REQ', [0, 5, 15, 25, 40, 55, 75, 95]);
}

async function initVIP(api: AdminAPI) {
  await api.config.set.array('VIP_STAGE', [1737553572, 1209600, 0, 0, 0, 0, 0, 0]);
}
