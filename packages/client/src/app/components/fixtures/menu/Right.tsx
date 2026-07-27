import { UIComponent } from 'app/root/types';
import { useAccount, useVisibility } from 'app/stores';
import styled from 'styled-components';
import {
  ChatMenuButton,
  CraftMenuButton,
  InventoryMenuButton,
  KamiSwapMenuButton,
  MoreMenuButton,
  QuestMenuButton,
  TradingMenuButton,
} from './buttons';

export const RightMenuFixture: UIComponent = {
  id: 'RightMenuFixture',
  Render: () => {
    const menuVisible = useVisibility((s) => s.fixtures.menu);
    // pre-account, every button here is a no-op except More (Settings/Bridge/
    // Help live inside) — hide the rest until registration completes
    const accountValidations = useAccount((s) => s.validations);
    const accountReady = accountValidations.accountChecked && accountValidations.accountExists;
    const showFull = menuVisible && accountReady;
    return (
      <>
        <Wrapper style={{ display: showFull ? 'flex' : 'none' }}>
          <KamiSwapMenuButton />
          <TradingMenuButton />
          <CraftMenuButton />
          <InventoryMenuButton />
          <QuestMenuButton />
          <ChatMenuButton />
          <MoreMenuButton />
        </Wrapper>
        <Wrapper style={{ display: showFull ? 'none' : 'flex' }}>
          <MoreMenuButton />
        </Wrapper>
      </>
    );
  },
};

const Wrapper = styled.div`
  flex-direction: row;
  align-items: center;
  justify-content: flex-end;
  padding-right: 0.32vw;
  gap: 0.6vh;
  position: relative;
  z-index: 10;
`;
