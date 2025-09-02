import { EntityIndex } from '@mud-classic/recs';
import { useEffect, useState } from 'react';
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
    } = (() => {
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
    })();

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
      <>
        <Wallpaper src={backgrounds.long2} />
        <Container>
          <Room index={roomIndex} />
        </Container>
      </>
    );
  },
};

const Container = styled.div`
  display: grid;
  place-items: center;

  @media (max-aspect-ratio: 11/16) {
    padding-bottom: max(0px, 25vmin);
  }

  pointer-events: auto;
  user-select: none;
`;

const Wallpaper = styled.div<{ src: string }>`
  position: absolute;
  width: 100%;
  height: 100%;
  background-image: url(${props => props.src});
  background-repeat: repeat;
  background-size: contain;
  image-rendering: pixelated;
  image-rendering: -moz-crisp-edges;
`;
