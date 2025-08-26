import type { UIComponentWithGrid } from 'app/root/types';
import { LoadingState } from './boot';
import { Scene } from './canvas';

import { ClockFixture } from './fixtures/clock';
import { LeftMenuFixture, RightMenuFixture } from './fixtures/menu';
import { NotificationFixture } from './fixtures/notifications';
import { ActionQueue } from './fixtures/queue';

import { AccountModal } from './modals/account';
import { ChatModal } from './modals/chat';
import { CraftingModal } from './modals/crafting';
import { DialogueModal } from './modals/dialogue';
import { FundOperator } from './modals/FundOperator';
import { GachaModal } from './modals/gacha';
import { GoalModal } from './modals/goals';
import { HelpModal } from './modals/help';
import { InventoryModal } from './modals/inventory';
import { KamiModal } from './modals/kami';
import { KamiPortalModal } from './modals/kamiPortal';
import { LeaderboardModal } from './modals/leaderboard';
import { MapModal } from './modals/map';
import { MerchantModal } from './modals/merchant';
import { EmaBoardModal } from './modals/naming';
import { NodeModal } from './modals/node';
import { ObolModal } from './modals/obol';
import { PartyModal } from './modals/party';
import { QuestModal } from './modals/quests';
import { RevealModal } from './modals/reveal';
import { SettingsModal } from './modals/settings';
import { AnimationStudio } from './modals/studio/AnimationStudio';
import { TradingModal } from './modals/trading';
import {
  AccountRegistrar,
  GasHarasser,
  OperatorUpdater,
  TokenChecker,
  WalletConnecter,
} from './validators';

export const allComponents: UIComponentWithGrid[] = [
  // boot
  {
    uiComponent: LoadingState,
    gridConfig: { colStart: 1, colEnd: 13, rowStart: 1, rowEnd: 13 },
  },
  {
    uiComponent: ActionQueue,
    gridConfig: { colStart: 66, colEnd: 99, rowStart: 90, rowEnd: 100 },
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
    uiComponent: QuestModal,
    gridConfig: { colStart: 67, colEnd: 100, rowStart: 8, rowEnd: 75 },
  },
  {
    uiComponent: SettingsModal,
    gridConfig: { colStart: 67, colEnd: 100, rowStart: 8, rowEnd: 75 },
  },
  
  {
    uiComponent: TradingModal,
    gridConfig: { colStart: 2, colEnd: 67, rowStart: 8, rowEnd: 99 },
  },

  // scene modals
  {
    uiComponent: DialogueModal,
    gridConfig: { colStart: 2, colEnd: 67, rowStart: 75, rowEnd: 99 },
  },
  {
    uiComponent: EmaBoardModal,
    gridConfig: { colStart: 33, colEnd: 67, rowStart: 15, rowEnd: 99 },
  },
  {
    uiComponent: GachaModal,
    gridConfig: { colStart: 11, colEnd: 89, rowStart: 8, rowEnd: 85 },
  },
  {
    uiComponent: GoalModal,
    gridConfig: { colStart: 20, colEnd: 80, rowStart: 24, rowEnd: 78 },
  },
  {
    uiComponent: KamiPortalModal,
    gridConfig: { colStart: 25, colEnd: 75, rowStart: 15, rowEnd: 99 },
  },
  {
    uiComponent: KamiModal,
    gridConfig: { colStart: 11, colEnd: 67, rowStart: 8, rowEnd: 99 },
  },
  {
    uiComponent: LeaderboardModal,
    gridConfig: { colStart: 32, colEnd: 70, rowStart: 20, rowEnd: 78 },
  },
  {
    uiComponent: ObolModal,
    gridConfig: { colStart: 36, colEnd: 65, rowStart: 20, rowEnd: 80 },
  },
  {
    uiComponent: RevealModal,
    gridConfig: { colStart: 30, colEnd: 70, rowStart: 30, rowEnd: 75 },
  },
  {
    uiComponent: MerchantModal,
    gridConfig: { colStart: 2, colEnd: 67, rowStart: 8, rowEnd: 99 },
  },

  // dev-only
  ...(typeof window !== 'undefined' &&
  (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')
    ? [
        {
          uiComponent: AnimationStudio,
          gridConfig: { colStart: 20, colEnd: 80, rowStart: 20, rowEnd: 80 },
        },
      ]
    : []),
];
