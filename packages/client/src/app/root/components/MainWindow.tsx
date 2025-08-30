import { observer } from 'mobx-react-lite';
import styled from 'styled-components';

import { LoadingState } from 'app/components/boot';
import { Scene } from 'app/components/canvas';
import { ClockFixture } from 'app/components/fixtures/clock';
import { LeftMenuFixture, RightMenuFixture } from 'app/components/fixtures/menu';
import { NotificationFixture } from 'app/components/fixtures/notifications';
import { ActionQueue } from 'app/components/fixtures/queue';
import { AccountModal } from 'app/components/modals/account';
import { ChatModal } from 'app/components/modals/chat';
import { CraftingModal } from 'app/components/modals/crafting';
import { DialogueModal } from 'app/components/modals/dialogue';
import { FundOperator } from 'app/components/modals/FundOperator';
import { GachaModal } from 'app/components/modals/gacha';
import { GoalModal } from 'app/components/modals/goals';
import { HelpModal } from 'app/components/modals/help';
import { InventoryModal } from 'app/components/modals/inventory';
import { KamiModal } from 'app/components/modals/kami';
import { KamiPortalModal } from 'app/components/modals/kamiPortal';
import { LeaderboardModal } from 'app/components/modals/leaderboard';
import { MapModal } from 'app/components/modals/map';
import { MerchantModal } from 'app/components/modals/merchant';
import { EmaBoardModal } from 'app/components/modals/naming';
import { NodeModal } from 'app/components/modals/node';
import { ObolModal } from 'app/components/modals/obol';
import { PartyModal } from 'app/components/modals/party';
import { QuestModal } from 'app/components/modals/quests';
import { RevealModal } from 'app/components/modals/reveal';
import { SettingsModal } from 'app/components/modals/settings';
import { AnimationStudio } from 'app/components/modals/studio/AnimationStudio';
import { TradingModal } from 'app/components/modals/trading';
import {
  AccountRegistrar,
  GasHarasser,
  OperatorUpdater,
  TokenChecker,
  WalletConnecter,
} from 'app/components/validators';

// Unique grid area constants
const areas = {
  // Full screen areas
  fullScreen: '1 / 1 / 100 / 100',
  
  // Loading area (top-left corner)
  loading: '1 / 1 / 13 / 13',
  
  // Action queue (bottom-right corner)
  actionQueue: '90 / 66 / 100 / 99',
  
  // Clock area (bottom center)
  clockBottom: '78 / 33 / 99 / 67',
  
  // Menu areas (top)
  leftMenuTop: '3 / 2 / 6 / 33',
  rightMenuTop: '3 / 67 / 6 / 100',
  
  // Notifications (top-right)
  notifications: '8 / 72 / 30 / 100',
  
  // Modal areas - left column
  leftColumnModal: '8 / 2 / 99 / 33',
  leftColumnModalShort: '8 / 2 / 79 / 33',
  
  // Modal areas - right column
  rightColumnModal: '8 / 67 / 75 / 100',
  
  // Modal areas - center column
  centerColumnModal: '3 / 33 / 99 / 67',
  
  // Modal areas - wide center
  wideCenterModal: '8 / 2 / 99 / 67',
  
  // Modal areas - bottom center
  bottomCenterModal: '75 / 2 / 99 / 67',
  
  // Modal areas - center with top margin
  centerTopMargin: '15 / 33 / 99 / 67',
  centerTopMarginWide: '15 / 25 / 99 / 75',
  
  // Modal areas - centered squares
  centeredSquare: '30 / 30 / 74 / 70',
  centeredSquareSmall: '30 / 30 / 75 / 70',
  
  // Modal areas - wide centered
  wideCentered: '8 / 11 / 85 / 89',
  wideCenteredTall: '8 / 11 / 99 / 67',
  
  // Modal areas - medium centered
  mediumCentered: '24 / 20 / 78 / 80',
  
  // Modal areas - leaderboard
  leaderboard: '20 / 32 / 78 / 70',
  
  // Modal areas - obol
  obol: '20 / 36 / 80 / 65',
  
  // Modal areas - animation studio
  animationStudio: '20 / 20 / 80 / 80',
} as const;

export const MainWindow = observer(({
  ready,
}: {
  ready: boolean;
}) => (
  <UIGrid>
    {/* Boot components */}
    <div style={{ gridArea: areas.loading }}>
      {<LoadingState.Render />}
    </div>

    <div style={{ gridArea: areas.actionQueue }}>
      {<ActionQueue.Render />}
    </div>

    {ready && <>
      {/* Validators */}
      <div style={{ gridArea: areas.fullScreen }}>
        {<WalletConnecter.Render />}
      </div>

      <div style={{ gridArea: areas.fullScreen }}>
        {<AccountRegistrar.Render />}
      </div>

      <div style={{ gridArea: areas.fullScreen }}>
        {<OperatorUpdater.Render />}
      </div>

      <div style={{ gridArea: areas.fullScreen }}>
        {<GasHarasser.Render />}
      </div>

      <div style={{ gridArea: areas.fullScreen }}>
        {<TokenChecker.Render />}
      </div>

      {/* Fixtures */}
      <div style={{ gridArea: areas.clockBottom }}>
        {<ClockFixture.Render />}
      </div>

      <div style={{ gridArea: areas.leftMenuTop }}>
        {<LeftMenuFixture.Render />}
      </div>

      <div style={{ gridArea: areas.rightMenuTop }}>
        {<RightMenuFixture.Render />}
      </div>

      <div style={{ gridArea: areas.notifications }}>
        {<NotificationFixture.Render />}
      </div>

      {/* Canvas */}
      <div style={{ gridArea: areas.fullScreen }}>
        {<Scene.Render />}
      </div>

      {/* Menu modals */}
      <div style={{ gridArea: areas.leftColumnModal }}>
        {<AccountModal.Render />}
      </div>

      <div style={{ gridArea: areas.rightColumnModal }}>
        {<ChatModal.Render />}
      </div>

      <div style={{ gridArea: areas.centerColumnModal }}>
        {<CraftingModal.Render />}
      </div>

      <div style={{ gridArea: areas.rightColumnModal }}>
        {<HelpModal.Render />}
      </div>

      <div style={{ gridArea: areas.rightColumnModal }}>
        {<InventoryModal.Render />}
      </div>

      <div style={{ gridArea: areas.leftColumnModalShort }}>
        {<MapModal.Render />}
      </div>

      <div style={{ gridArea: areas.centerColumnModal }}>
        {<NodeModal.Render />}
      </div>

      <div style={{ gridArea: areas.leftColumnModal }}>
        {<PartyModal.Render />}
      </div>

      <div style={{ gridArea: areas.rightColumnModal }}>
        {<QuestModal.Render />}
      </div>

      <div style={{ gridArea: areas.rightColumnModal }}>
        {<SettingsModal.Render />}
      </div>

      <div style={{ gridArea: areas.wideCenterModal }}>
        {<TradingModal.Render />}
      </div>

      {/* Scene modals */}
      <div style={{ gridArea: areas.bottomCenterModal }}>
        {<DialogueModal.Render />}
      </div>

      <div style={{ gridArea: areas.centerTopMargin }}>
        {<EmaBoardModal.Render />}
      </div>

      <div style={{ gridArea: areas.centeredSquare }}>
        {<FundOperator.Render />}
      </div>

      <div style={{ gridArea: areas.wideCentered }}>
        {<GachaModal.Render />}
      </div>

      <div style={{ gridArea: areas.mediumCentered }}>
        {<GoalModal.Render />}
      </div>

      <div style={{ gridArea: areas.centerTopMarginWide }}>
        {<KamiPortalModal.Render />}
      </div>

      <div style={{ gridArea: areas.wideCenteredTall }}>
        {<KamiModal.Render />}
      </div>

      <div style={{ gridArea: areas.leaderboard }}>
        {<LeaderboardModal.Render />}
      </div>

      <div style={{ gridArea: areas.obol }}>
        {<ObolModal.Render />}
      </div>

      <div style={{ gridArea: areas.centeredSquareSmall }}>
        {<RevealModal.Render />}
      </div>

      <div style={{ gridArea: areas.wideCenterModal }}>
        {<MerchantModal.Render />}
      </div>

      {/* Dev-only */}
      {([
          'localhost',
          '127.0.0.1',
          ''
        ].includes(globalThis?.location?.hostname)
      ) && (
        <div style={{ gridArea: areas.animationStudio }}>
          {<AnimationStudio.Render />}
        </div>
      )}
    </>}
  </UIGrid>
));

const UIGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(100, 1%);
  grid-template-rows: repeat(100, 1%);
  position: absolute;
  left: 0;
  top: 0;
  height: 100vh;
  width: 100vw;
  pointer-events: none;
  z-index: 10;
  overflow: hidden;
`;
