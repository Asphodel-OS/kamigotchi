import { ClockFixture } from './fixtures/clock';
import { LeftMenuFixture, RightMenuFixture } from './fixtures/menu';
import { NotificationFixture } from './fixtures/notifications';
import { ActionQueue } from './fixtures/queue';

import { AccountModal } from './modals/account';
import { ChatModal } from './modals/chat';
import { CraftingModal } from './modals/crafting';
import { DialogueModal } from './modals/dialogue';
import { GachaModal } from './modals/gacha';
import { GoalModal } from './modals/goals';
import { HelpModal } from './modals/help';
import { InventoryModal } from './modals/inventory';
import { KamiDetails } from './modals/kami';
import { KamiBridge } from './modals/kamiBridge';
import { LeaderboardModal } from './modals/leaderboard';
import { LootBoxModal } from './modals/lootBox/LootBox';
import { MapModal } from './modals/map';
import { MerchantWindow } from './modals/merchant';
import { EmaBoard } from './modals/naming';
import { NodeModal } from './modals/node';
import { PartyModal } from './modals/party';
import { Presale } from './modals/presale';
import { Reveal } from './modals/reveal/Reveal';
import { Settings } from './modals/settings';
import { TradingModal } from './modals/trading';
import { AnimationStudio } from './modals/studio/AnimationStudio';

import type { UIComponentWithGrid } from 'app/root/types';
import { Quests } from './modals/quests';
import { AccountRegistrar, GasHarasser, OperatorUpdater, WalletConnecter } from './validators';
import { TokenChecker } from './validators/TokenChecker';

import { LoadingState } from './boot';
import { Scene } from './canvas';

export const allComponents: UIComponentWithGrid[] = [
  // boot
  {
    uiComponent: LoadingState,
    gridConfig: { colStart: 1, colEnd: 13, rowStart: 1, rowEnd: 13 },
  },

  // validators
  {
    uiComponent: WalletConnecter,
    gridConfig: { colStart: 1, colEnd: 100, rowStart: 1, rowEnd: 100 },
  },
  {
    uiComponent: AccountRegistrar,
    gridConfig: { colStart: 1, colEnd: 100, rowStart: 1, rowEnd: 100 },
  },
  {
    uiComponent: OperatorUpdater,
    gridConfig: { colStart: 1, colEnd: 100, rowStart: 1, rowEnd: 100 },
  },
  {
    uiComponent: GasHarasser,
    gridConfig: { colStart: 1, colEnd: 100, rowStart: 1, rowEnd: 100 },
  },
  {
    uiComponent: TokenChecker,
    gridConfig: { colStart: 1, colEnd: 100, rowStart: 1, rowEnd: 100 },
  },

  // fixtures
  {
    uiComponent: ClockFixture,
    gridConfig: { colStart: 33, colEnd: 67, rowStart: 78, rowEnd: 99 },
  },
  {
    uiComponent: LeftMenuFixture,
    gridConfig: { colStart: 2, colEnd: 33, rowStart: 3, rowEnd: 6 },
  },
  {
    uiComponent: RightMenuFixture,
    gridConfig: { colStart: 67, colEnd: 100, rowStart: 3, rowEnd: 6 },
  },
  {
    uiComponent: NotificationFixture,
    gridConfig: { colStart: 72, colEnd: 100, rowStart: 8, rowEnd: 30 },
  },
  {
    uiComponent: ActionQueue,
    gridConfig: { colStart: 66, colEnd: 99, rowStart: 90, rowEnd: 100 },
  },

  // canvas
  {
    uiComponent: Scene,
    gridConfig: { colStart: 1, colEnd: 100, rowStart: 1, rowEnd: 100 },
  },

  // menu modals
  {
    uiComponent: AccountModal,
    gridConfig: { colStart: 2, colEnd: 33, rowStart: 8, rowEnd: 99 },
  },
  {
    uiComponent: ChatModal,
    gridConfig: { colStart: 67, colEnd: 100, rowStart: 8, rowEnd: 75 },
  },
  {
    uiComponent: CraftingModal,
    gridConfig: { colStart: 33, colEnd: 67, rowStart: 3, rowEnd: 99 },
  },
  {
    uiComponent: HelpModal,
    gridConfig: { colStart: 67, colEnd: 100, rowStart: 8, rowEnd: 75 },
  },
  {
    uiComponent: InventoryModal,
    gridConfig: { colStart: 67, colEnd: 100, rowStart: 8, rowEnd: 75 },
  },
  {
    uiComponent: MapModal,
    gridConfig: { colStart: 2, colEnd: 33, rowStart: 8, rowEnd: 79 },
  },
  {
    uiComponent: NodeModal,
    gridConfig: { colStart: 33, colEnd: 67, rowStart: 3, rowEnd: 99 },
  },
  {
    uiComponent: PartyModal,
    gridConfig: { colStart: 2, colEnd: 33, rowStart: 8, rowEnd: 99 },
  },
  {
    uiComponent: Quests,
    gridConfig: { colStart: 67, colEnd: 100, rowStart: 8, rowEnd: 75 },
  },
  {
    uiComponent: Settings,
    gridConfig: { colStart: 67, colEnd: 100, rowStart: 8, rowEnd: 75 },
  },
  ...(
    typeof window !== 'undefined' &&
    (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')
      ? [{
          uiComponent: AnimationStudio,
          gridConfig: { colStart: 20, colEnd: 80, rowStart: 20, rowEnd: 80 },
        }]
      : []
  ),
  {
    uiComponent: TradingModal,
    gridConfig: { colStart: 2, colEnd: 67, rowStart: 8, rowEnd: 99 },
  },
  {
    uiComponent: Presale,
    gridConfig: { colStart: 25, colEnd: 75, rowStart: 25, rowEnd: 75 },
  },

  // scene modals
  {
    uiComponent: DialogueModal,
    gridConfig: { colStart: 2, colEnd: 67, rowStart: 75, rowEnd: 99 },
  },
  {
    uiComponent: KamiBridge,
    gridConfig: { colStart: 33, colEnd: 67, rowStart: 15, rowEnd: 99 },
  },
  {
    uiComponent: EmaBoard,
    gridConfig: { colStart: 33, colEnd: 67, rowStart: 15, rowEnd: 99 },
  },
  {
    uiComponent: Reveal,
    gridConfig: { colStart: 30, colEnd: 70, rowStart: 30, rowEnd: 75 },
  },
  {
    uiComponent: MerchantWindow,
    gridConfig: { colStart: 2, colEnd: 67, rowStart: 8, rowEnd: 99 },
  },
  {
    uiComponent: GoalModal,
    gridConfig: { colStart: 20, colEnd: 80, rowStart: 24, rowEnd: 78 },
  },
];
