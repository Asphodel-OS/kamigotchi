import { useEffect } from 'react';
import { map, merge } from 'rxjs';
import styled from 'styled-components';

import { backgrounds } from 'assets/images/backgrounds';
import { getAccountFromBurner } from 'layers/network/shapes/Account';
import { registerUIComponent } from 'layers/react/engine/store';
import { useAccount, useSelected } from 'layers/react/store';
import { Room } from './Room';

// The Scene Fixture paints the wallpaper and the room.
// It updates the selected room index in the Selected store whenever the
// player switches rooms or changes the connected account.
export function registerScene() {
  registerUIComponent(
    'SceneFixture',
    {
      colStart: 1,
      colEnd: 100,
      rowStart: 1,
      rowEnd: 100,
    },
    (layers) => {
      const { network } = layers;
      const { components } = network;
      const { OperatorAddress, RoomIndex } = components;

      return merge(RoomIndex.update$, OperatorAddress.update$).pipe(
        map(() => {
          const account = getAccountFromBurner(network);
          return {
            data: { account },
          };
        })
      );
    },

    ({ data }) => {
      const account = data.account;
      const { roomIndex, setRoom } = useSelected();
      const { validations } = useAccount();

      useEffect(() => {
        if (!account) return;
        const index = account.roomIndex;
        setRoom(index);
      }, [account.roomIndex, validations.accountExists]);

      /////////////////
      // DISPLAY

      return (
        <Wrapper>
          <Container>
            <Room index={roomIndex} />
            <Wallpaper src={backgrounds.kamiPatternWide} />
          </Container>
        </Wrapper>
      );
    }
  );
}

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
  height: 100%;
  min-width: 100%;
  position: absolute;
  z-index: -3;
  image-rendering: pixelated;
  image-rendering: -moz-crisp-edges;
  image-rendering: crisp-edges;
`;
