import { EntityIndex } from '@mud-classic/recs';
import { useEffect, useMemo, useState } from 'react';
import styled from 'styled-components';

import { getAccount as _getAccount } from 'app/cache/account';
import { UIComponent } from 'app/root/types';
import { useSelected } from 'app/stores';
import { backgrounds } from 'assets/images/backgrounds';
import { queryAccountFromEmbedded } from 'network/shapes/Account';
import { getGoalByIndex as _getGoalByIndex } from 'network/shapes/Goals';
import { getRoomIndex as _getRoomIndex } from 'network/shapes/utils/component';
import { Room } from './Room';
import { useLayers } from 'app/root/hooks';

// The Scene paints the wallpaper and the room. It updates the selected room
// index in the Selected store whenever the player switches rooms or changes
// the connected account.
export const Scene: UIComponent = {
  id: 'Scene',
  Render: () => {
    const layers = useLayers();

    const {
      data: {
        accountEntity,
      },
      utils: {
        getAccount,
        getGoalByIndex,
        getRoomIndex,
      }
    } = useMemo(() => {
      const { network } = layers;
      const { world, components } = network;

      const accountEntity = queryAccountFromEmbedded(network);
      return {
        data: {
          accountEntity,
        },
        utils: {
          getAccount: (entity: EntityIndex) => _getAccount(world, components, entity),
          getGoalByIndex: (index: number) => _getGoalByIndex(world, components, index),
          getRoomIndex: (entity: EntityIndex) => _getRoomIndex(components, entity),
        },
      };
    }, [layers]);

    const { roomIndex, setRoom } = useSelected();
    const [lastRefresh, setLastRefresh] = useState(Date.now());

    // ticking
    useEffect(() => {
      const timerId = setInterval(() => {
        setLastRefresh(Date.now());
      }, 250);
      return () => clearInterval(timerId);
    }, []);

    // update the room index on each interval and whenever the account changes
    useEffect(() => {
      if (!accountEntity) return;
      const roomIndex = getRoomIndex(accountEntity);
      setRoom(roomIndex);
    }, [accountEntity, lastRefresh]);

    /////////////////
    // DISPLAY

    return (
      <Wrapper>
        <Container>
          <Room index={roomIndex} />
          <Wallpaper src={backgrounds.long2} />
        </Container>
      </Wrapper>
    );
  },
};

const Wrapper = styled.div`
  display: block;
  justify-content: center;
  align-items: center;
  opacity: 1;
  z-index: -5;
  pointer-events: auto;
  position: absolute;
  width: 100%;
  height: 100%;
  user-select: none;
`;

const Container = styled.div`
  position: relative;
  width: 100%;
  height: 100%;
  z-index: -4;
  display: flex;
  justify-content: center;
  align-items: center;
`;

const Wallpaper = styled.img`
  position: absolute;
  width: 100%;
  max-height: 100%;
  object-fit: cover;

  z-index: -3;
  image-rendering: pixelated;
  image-rendering: -moz-crisp-edges;
`;
