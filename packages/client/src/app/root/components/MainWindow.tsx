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

// Grid areas using named grid lines
const areas = {
  // Full screen areas
  fullScreen: 'start / start / end / end',
  
  // Loading area (top-left corner)
  loading: 'start / start / loading-end / loading-end',
  
  // Action queue (bottom-right corner)
  actionQueue: 'action-queue-start / action-queue-start-col / end / action-queue-end-col',
  
  // Clock area (bottom center)
  clockBottom: 'medium-centered-end / center-start / modal-right-end / center-end',
  
  // Menu areas (top)
  leftMenuTop: 'menu-start / menu-left-start / menu-end / center-start',
  rightMenuTop: 'menu-start / center-end / menu-end / end',
  
  // Notifications (top-right)
  notifications: 'modal-start / notifications-start-col / centered-square-start / end',
  
  // Modal areas - left column
  leftColumnModal: 'modal-start / menu-left-start / modal-right-end / center-start',
  leftColumnModalShort: 'modal-start / menu-left-start / modal-short-end / center-start',
  
  // Modal areas - right column
  rightColumnModal: 'modal-start / center-end / centered-square-small-end / end',
  
  // Modal areas - center column
  centerColumnModal: 'menu-start / center-start / modal-right-end / center-end',
  
  // Modal areas - wide center
  wideCenterModal: 'modal-start / menu-left-start / modal-right-end / center-end',
  
  // Modal areas - bottom center
  bottomCenterModal: 'centered-square-small-end / menu-left-start / modal-right-end / center-end',
  
  // Modal areas - center with top margin
  centerTopMargin: 'center-top-start / center-start / modal-right-end / center-end',
  centerTopMarginWide: 'center-top-start / center-wide-start / modal-right-end / center-wide-end',
  
  // Modal areas - centered squares
  centeredSquare: 'centered-square-start / centered-square-start-col / centered-square-end / centered-square-end-col',
  centeredSquareSmall: 'centered-square-start / centered-square-start-col / centered-square-small-end / centered-square-end-col',
  
  // Modal areas - wide centered
  wideCentered: 'modal-start / wide-centered-start / wide-centered-end / wide-centered-end-col',
  wideCenteredTall: 'modal-start / wide-centered-start / modal-right-end / center-end',
  
  // Modal areas - medium centered
  mediumCentered: 'medium-centered-start / animation-studio-start-col / medium-centered-end / medium-centered-end-col',
  
  // Modal areas - leaderboard
  leaderboard: 'leaderboard-start / leaderboard-start-col / medium-centered-end / centered-square-end-col',
  
  // Modal areas - obol
  obol: 'leaderboard-start / obol-start-col / animation-studio-end / obol-end-col',
  
  // Modal areas - animation studio
  animationStudio: 'leaderboard-start / animation-studio-start-col / animation-studio-end / medium-centered-end-col',
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
  grid-template: 
    [start] 2%
    [menu-start] 3%
    [menu-end] 2%
    [modal-start] 5%
    [loading-end] 2%
    [center-top-start] 5%
    [leaderboard-start] 4%
    [medium-centered-start] 6%
    [centered-square-start] 44%
    [centered-square-end] 1%
    [centered-square-small-end] 3%
    [medium-centered-end] 1%
    [modal-short-end] 1%
    [animation-studio-end] 5%
    [wide-centered-end] 5%
    [action-queue-start] 9%
    [modal-right-end] 1%
    [end] 1%
    /
    [start] 1%
    [menu-left-start] 9%
    [wide-centered-start] 2%
    [loading-end] 7%
    [animation-studio-start-col] 5%
    [center-wide-start] 5%
    [centered-square-start-col] 2%
    [leaderboard-start-col] 1%
    [center-start] 3%
    [obol-start-col] 29%
    [obol-end-col] 1%
    [action-queue-start-col] 1%
    [center-end] 3%
    [centered-square-end-col] 2%
    [notifications-start-col] 3%
    [center-wide-end] 5%
    [medium-centered-end-col] 9%
    [wide-centered-end-col] 10%
    [action-queue-end-col] 1%
    [end] 1%;
  position: absolute;
  left: 0;
  top: 0;
  height: 100vh;
  width: 100vw;
  pointer-events: none;
  z-index: 10;
  overflow: hidden;
`;
