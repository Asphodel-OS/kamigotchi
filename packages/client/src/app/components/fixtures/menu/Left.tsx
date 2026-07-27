import styled from 'styled-components';

import { useLayers } from 'app/root/hooks';
import { UIComponent } from 'app/root/types';
import { useAccount, useSelected, useVisibility } from 'app/stores';
import { queryNodeByIndex } from 'network/shapes/Node';
import {
  AccountMenuButton,
  MapMenuButton,
  NodeMenuButton,
  OnyxMenuButton,
  PartyMenuButton,
  StudioMenuButton,
  SudoMenuButton,
} from './buttons';

export const LeftMenuFixture: UIComponent = {
  id: 'LeftMenuFixture',
  Render: () => {
    const layers = useLayers();
    const menuVisible = useVisibility((s) => s.fixtures.menu);
    // every button here is dead pre-account — hide until registration completes
    const accountValidations = useAccount((s) => s.validations);
    const accountReady = accountValidations.accountChecked && accountValidations.accountExists;

    /////////////////
    // PREPARATION

    const { nodeEntity } = (() => {
      const { network } = layers;
      const { world } = network;
      const roomIndex = useSelected((s) => s.roomIndex);
      return { nodeEntity: queryNodeByIndex(world, roomIndex) };
    })();

    /////////////////
    // RENDER

    return (
      <Wrapper style={{ display: menuVisible && accountReady ? 'flex' : 'none' }}>
        <AccountMenuButton />
        <PartyMenuButton />
        <MapMenuButton />
        <NodeMenuButton disabled={!nodeEntity} />
        <SudoMenuButton />
        <OnyxMenuButton />
        <StudioMenuButton />
      </Wrapper>
    );
  },
};

const Wrapper = styled.div`
  flex-direction: row;
  align-items: center;
  justify-content: flex-start;
  gap: 0.6vh;
  position: relative;
  z-index: 10;
`;
