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

export const MainWindow = observer(({
  ready,
}: {
  ready: boolean;
}) => (
  <Stack>
    {!ready && <>
      {/* Boot components */}
      {<LoadingState.Render />}
    </>}

    {/* Validators */}
    {<WalletConnecter.Render />}
    {<AccountRegistrar.Render />}
    {<OperatorUpdater.Render />}
    {<GasHarasser.Render />}
    {<TokenChecker.Render />}

    {ready && <>
      {/* Canvas */}
      {<Scene.Render />}
    </>}

    <UIGrid>
      <div style={{ gridArea: "RightBottom" }}>
        {<ActionQueue.Render />}
      </div>

      {ready && <>
        {/* Fixtures */}
        <div style={{ gridArea: "LeftBottom" }}>
          {<ClockFixture.Render />}
        </div>

        <div style={{ gridArea: "LeftTop" }}>
          {<LeftMenuFixture.Render />}
        </div>

        <div style={{ gridArea: "RightTop" }}>
          {<RightMenuFixture.Render />}
        </div>

        <div style={{ gridArea: "Right" }}>
          {<NotificationFixture.Render />}
        </div>

        {/* Menu modals */}
        <div style={{ gridArea: "LeftTall" }}>
          {<AccountModal.Render />}
        </div>

        <div style={{ gridArea: "Right" }}>
          {<ChatModal.Render />}
        </div>

        <div style={{ gridArea: "Center" }}>
          {<CraftingModal.Render />}
        </div>

        <div style={{ gridArea: "Right" }}>
          {<HelpModal.Render />}
        </div>

        <div style={{ gridArea: "Right" }}>
          {<InventoryModal.Render />}
        </div>

        <div style={{ gridArea: "Left" }}>
          {<MapModal.Render />}
        </div>

        <div style={{ gridArea: "Center" }}>
          {<NodeModal.Render />}
        </div>

        <div style={{ gridArea: "LeftTall" }}>
          {<PartyModal.Render />}
        </div>

        <div style={{ gridArea: "Right" }}>
          {<QuestModal.Render />}
        </div>

        <div style={{ gridArea: "Right" }}>
          {<SettingsModal.Render />}
        </div>

        <div style={{ gridArea: "LeftWide" }}>
          {<TradingModal.Render />}
        </div>

        <div style={{ gridArea: "RightWide" }}>
          {<KamiModal.Render />}
        </div>
      </>}
    </UIGrid>

    {ready && <>
      {/* Scene modals */}
      <DialogueModal.Render />
      <EmaBoardModal.Render />
      <FundOperator.Render />
      <GachaModal.Render />
      <GoalModal.Render />
      <KamiPortalModal.Render />
      <LeaderboardModal.Render />
      <ObolModal.Render />
      <RevealModal.Render />
      <MerchantModal.Render />

      {/* Dev-only */}
      {([
          'localhost',
          '127.0.0.1',
          ''
        ].includes(globalThis?.location?.hostname)
      ) && (
        <AnimationStudio.Render />
      )}
    </>}
  </Stack>
));

const Stack = styled.div`
  display: grid;
  grid:
    'Stack' minmax(0, 100vh)
    / 100vw
  ;
  align-items: stretch;

  > * {
    grid-area: Stack;
  }
`;

const UIGrid = styled.div`
  display: grid;

  /* 3 columns: "Left", "Center", "Right" */
  grid:
    "LeftTop Center RightTop" auto
    [LeftWide-start LeftTall-start RightWide-start]
    "Left Center Right" minmax(0, 1fr)
    "LeftBottom Center RightBottom" auto
    [LeftWide-end LeftTall-end RightWide-end]
    / [LeftWide-start LeftTall-start] minmax(0, 1fr) [LeftTall-end RightWide-start] minmax(0, 1fr) [LeftWide-end] minmax(0, 1fr) [RightWide-end]
  ;

  /* 2 columns: "Left", and "Center" (overlapped with "Right") */
  @media (orientation: portrait) {
    grid:
      "LeftTop RightTop" auto
      [LeftWide-start LeftTall-start Right-start RightWide-start]
      "Left Center" minmax(0, 1fr)
      "LeftBottom RightBottom" auto
      [LeftWide-end LeftTall-end Right-end RightWide-end]
      / [LeftWide-start LeftTall-start] minmax(0, 1fr) [LeftTall-end LeftWide-end Right-start RightWide-start] minmax(0, 1fr) [Right-end RightWide-end]
    ;
  }

  /* 1 column. Rows: "LeftTop", "Left" "Center" "Right" overlapping, "RightTop" */
  @media (max-aspect-ratio: 11/16) {
    grid:
      "LeftTop LeftTop" auto
      [Left-start LeftWide-start LeftTall-start Right-start RightWide-start]
      "Center Center" minmax(0, 1fr)
      [Left-end LeftWide-end LeftTall-end Right-end RightWide-end]
      "RightTop RightTop" auto
      "LeftBottom RightBottom" auto
      / [Left-start LeftWide-start LeftTall-start Right-start RightWide-start] auto minmax(0, 1fr) [Left-end LeftWide-end LeftTall-end Right-end RightWide-end]
    ;
  }

  gap: 1.5em 1em;
  padding: 1em;

  pointer-events: none;
  z-index: 10;
`;
