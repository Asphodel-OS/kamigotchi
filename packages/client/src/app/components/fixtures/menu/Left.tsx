import styled from 'styled-components';

import { useLayers } from 'app/root/hooks';
import { UIComponent } from 'app/root/types';
import { useSelected, useVisibility } from 'app/stores';
import { queryNodeByIndex } from 'network/shapes/Node';
import { useEffect, useState } from 'react';
import {
  AccountMenuButton,
  CraftMenuButton,
  InventoryMenuButton,
  MapMenuButton,
  MoreMenuButton,
  NodeMenuButton,
  PartyMenuButton,
  QuestMenuButton,
  ShopMenuButton,
} from './buttons';

export const LeftMenuFixture: UIComponent = {
  id: 'LeftMenuFixture',
  Render: () => {
    const layers = useLayers();
    const menuVisible = useVisibility((s) => s.fixtures.menu);
    const [isMobile, setIsMobile] = useState(false);

    useEffect(() => {
      const desktopQuery = window.matchMedia('(max-aspect-ratio: 11/16) ');
      setIsMobile(desktopQuery.matches);
      const handler = (e: MediaQueryListEvent) => setIsMobile(e.matches);
      desktopQuery.addEventListener('change', handler);
      return () => {
        desktopQuery.removeEventListener('change', handler);
      };
    }, []);
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
      <Wrapper>
        {!isMobile && (
          <>
            <MoreMenuButton />
            {menuVisible && (
              <>
                <AccountMenuButton />
                <PartyMenuButton />
                <MapMenuButton />
                <NodeMenuButton disabled={!nodeEntity} />
                <CraftMenuButton />
                <ShopMenuButton />
                <InventoryMenuButton />
                <QuestMenuButton />
              </>
            )}
          </>
        )}
      </Wrapper>
    );
  },
};

const Wrapper = styled.div`
  justify-self: start;

  @media (max-aspect-ratio: 11/16) {
    justify-self: stretch;

    > * {
      flex: 1;

      button {
        width: 100%;
      }
    }
  }

  display: flex;
  gap: 0.3em;
`;
