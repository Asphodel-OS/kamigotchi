import { observer } from 'mobx-react-lite';
import { useEffect, useState } from 'react';
import styled from 'styled-components';

import { LoadingState } from 'app/components/boot';
import { Scene } from 'app/components/canvas';
import { ClockBarFixture, ClockFixture } from 'app/components/fixtures/clock';
import { RightMenuFixture } from 'app/components/fixtures/menu';
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
import { QuestDetailsModal } from 'app/components/modals/questDetails';
import { QuestModal } from 'app/components/modals/quests';
import { RevealModal } from 'app/components/modals/reveal';
import { SettingsModal } from 'app/components/modals/settings';
import { AnimationStudio } from 'app/components/modals/studio/AnimationStudio';
import { TokenPortalModal } from 'app/components/modals/tokenPortal';
import { TradingModal } from 'app/components/modals/trading';
import {
  AccountRegistrar,
  GasHarasser,
  OperatorUpdater,
  TokenChecker,
  WalletConnecter,
} from 'app/components/validators';

export const MainWindow = observer(({ ready }: { ready: boolean }) => {
  const [isMobile, setIsMobile] = useState(false);
  const [isPortrait, setIsPortrait] = useState(false);

  useEffect(() => {
    const portraitQuery = window.matchMedia('(max-aspect-ratio: 11/16) or (width < 900px)');
    const mobileQuery = window.matchMedia('(pointer: coarse)');
    setIsPortrait(portraitQuery.matches);
    setIsMobile(mobileQuery.matches);

    const handler = (e: MediaQueryListEvent) => setIsPortrait(e.matches);
    const mobileHandler = (e: MediaQueryListEvent) => setIsMobile(e.matches);

    mobileQuery.addEventListener('change', mobileHandler);
    portraitQuery.addEventListener('change', handler);
    return () => {
      portraitQuery.removeEventListener('change', handler);
      mobileQuery.removeEventListener('change', mobileHandler);
    };
  }, []);

  return (
    <Stack onContextMenu={(e) => isMobile && e.preventDefault()}>
      {/* Boot components */}
      <LoadingState.Render />

      {ready && (
        <>
          {/* Validators */}
          <WalletConnecter.Render />
          <AccountRegistrar.Render />
          <OperatorUpdater.Render />
          <GasHarasser.Render />
          <TokenChecker.Render />
        </>
      )}

      {ready && (
        <>
          {/* Canvas */}
          {<Scene.Render />}
        </>
      )}

      <UIGrid>
        <div style={{ gridArea: 'RightBottom', alignSelf: 'end' }}>{<ActionQueue.Render />}</div>

        {ready && (
          <>
            {/* Fixtures */}
            <div style={{ gridArea: 'LeftBottom' }}>
              {isPortrait || isMobile ? <ClockBarFixture.Render /> : <ClockFixture.Render />}
            </div>

            <div style={{ gridArea: 'RightTop' }}>{<RightMenuFixture.Render />}</div>

            <div style={{ gridArea: 'Right' }}>{<NotificationFixture.Render />}</div>

            {/* Menu modals */}
            <div style={{ gridArea: 'LeftTall' }}>{<AccountModal.Render />}</div>

            <div style={{ gridArea: 'Right' }}>{<ChatModal.Render />}</div>

            <div style={{ gridArea: 'Center' }}>{<CraftingModal.Render />}</div>

            <div style={{ gridArea: 'Right' }}>{<HelpModal.Render />}</div>

            <div style={{ gridArea: 'Right' }}>{<InventoryModal.Render />}</div>

            <div style={{ gridArea: 'Left' }}>{<MapModal.Render />}</div>

            <div style={{ gridArea: 'Center' }}>{<NodeModal.Render />}</div>

            <div style={{ gridArea: 'LeftTall' }}>{<PartyModal.Render />}</div>

            <div style={{ gridArea: 'Right' }}>{<QuestModal.Render />}</div>
            <div style={{ gridArea: 'Right' }}>{<QuestDetailsModal.Render />}</div>

            <div style={{ gridArea: 'Right' }}>{<SettingsModal.Render />}</div>

            <div style={{ gridArea: 'LeftWide' }}>{<TradingModal.Render />}</div>

            <div style={{ gridArea: 'RightWide' }}>{<KamiModal.Render />}</div>
          </>
        )}
      </UIGrid>

      {ready && (
        <>
          {/* Scene modals */}
          <div style={{ margin: '75vh 33vw 1vh 2vw' }}>
            <DialogueModal.Render />
          </div>

          <div style={{ margin: '15vw 33vw 1vh 33vw' }}>
            <EmaBoardModal.Render />
          </div>

          <div style={{ margin: 'auto', width: '40vw', height: '40vh' }}>
            <FundOperator.Render />
          </div>

          <div style={{ margin: '8vh 11vw 15vh 11vw' }}>
            <GachaModal.Render />
          </div>

          <div style={{ margin: 'auto', width: '60vw', height: '54vh' }}>
            <GoalModal.Render />
          </div>

          <div style={{ margin: '15vh 25vw 1vh 25vw' }}>
            <KamiPortalModal.Render />
          </div>

          <div style={{ margin: 'auto', width: '58vw', height: '54vh' }}>
            <LeaderboardModal.Render />
          </div>

          <div style={{ margin: 'auto', width: 'min(65vw,650px)' }}>
            <ObolModal.Render />
          </div>

          <div style={{ margin: 'auto', width: '40vw', height: '35vh' }}>
            <RevealModal.Render />
          </div>

          <div style={{ margin: 'auto', width: 'min(70vw,700px)', height: 'min(70vh,700px)' }}>
            <TokenPortalModal.Render />
          </div>
          <div style={{ margin: '8vh 2vw 1vh 33vw' }}>
            <MerchantModal.Render />
          </div>

          {['localhost', '127.0.0.1', ''].includes(globalThis?.location?.hostname) && (
            <div style={{ margin: 'auto', width: '60vh', height: '60vh' }}>
              <AnimationStudio.Render />
            </div>
          )}
        </>
      )}
    </Stack>
  );
});

const Stack = styled.div`
  display: grid;
  grid:
    'Stack' minmax(0, 100vh)
    /
    100vw;
  align-items: stretch;
  height: 100%;
  > * {
    grid-area: Stack;
    container-type: inline-size;
  }
`;

const UIGrid = styled.div`
  display: grid;
  padding: 0.75rem;
  gap: 0.5rem;
  /* 3 columns: "Left", "Center", "Right" */
  grid:
    []
    'LeftTop        Center         RightTop      ' auto
    [LeftWide-start LeftTall-start RightWide-start]
    'Left           Center         Right         ' minmax(0, 1fr)
    []
    'LeftBottom     Center         RightBottom   ' auto
    [LeftWide-end LeftTall-end RightWide-end]
    /
    [
    LeftWide-start
    LeftTall-start]
    minmax(0, 1fr)
    [
    LeftTall-end
    RightWide-start]
    minmax(0, 1fr)
    [
    LeftWide-end]
    minmax(0, 1fr)
    [
    RightWide-end];

  /* 2 columns: "Left", and "Center" (overlapped with "Right") */
  @media (orientation: portrait), (width < 1200px) {
    grid:
      []
      'LeftTop        RightTop      ' auto
      [LeftWide-start LeftTall-start Right-start RightWide-start]
      'Left           Center        ' minmax(0, 1fr)
      [ Right-end]
      'LeftBottom     RightBottom   ' auto
      [LeftWide-end LeftTall-end RightWide-end]
      /
      [
      LeftWide-start
      LeftTall-start]
      minmax(0, 1fr)
      [
      LeftTall-end
      LeftWide-end
      Right-start
      RightWide-start]
      minmax(0, 1fr)
      [
      Right-end
      RightWide-end];
  }

  /* 1 column. Rows: "LeftTop", "Left" "Center" "Right" overlapping, "RightTop", "LeftBottom" / "RightBottom" */
  @media (max-aspect-ratio: 11/16) or (width < 900px) {
    grid:
      []
      'LeftTop        LeftTop       ' auto
      [Left-start LeftWide-start LeftTall-start Right-start RightWide-start]
      'Center         Center        ' minmax(0, 1fr)
      [Left-end LeftWide-end LeftTall-end Right-end RightWide-end]
      'RightTop       RightTop      ' auto
      []
      'LeftBottom     RightBottom   ' auto
      []
      /
      [
      Left-start
      LeftWide-start
      LeftTall-start
      Right-start
      RightWide-start]
      auto
      []
      minmax(0, 1fr)
      [
      Left-end
      LeftWide-end
      LeftTall-end
      Right-end
      RightWide-end];
  }

  /* 1 column (alternative) */
  @media (max-aspect-ratio: 11/16) or (width < 900px) {
    grid:
      'LeftBottom     LeftBottom   ' auto
      [Left-start LeftWide-start LeftTall-start Right-start RightWide-start]
      'Center         Center       ' minmax(0, 1fr)
      [Left-end LeftWide-end LeftTall-end Right-end RightWide-end]
      'RightBottom    RightBottom  ' 25vmin
      []
      'LeftTop        LeftTop      ' auto
      []
      'RightTop       RightTop     ' auto
      []
      /
      [
      Left-start
      LeftWide-start
      LeftTall-start
      Right-start
      RightWide-start]
      auto
      []
      minmax(0, 1fr)
      [
      Left-end
      LeftWide-end
      LeftTall-end
      Right-end
      RightWide-end];
  }

  pointer-events: none;
  z-index: 10;

  > * {
    container-type: inline-size;
    isolation: isolate;

    font-size: clamp(1rem, 1cqi, 1.75rem);

    /*this will only apply to mobile devices*/
    @media (max-aspect-ratio: 11/16) and (pointer: coarse) {
      font-size: clamp(2rem, 2cqi, 3rem);
    }
  }
`;
