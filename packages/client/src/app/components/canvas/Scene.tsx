import { useEffect } from 'react';
import { interval, map } from 'rxjs';
import styled from 'styled-components';

import { registerUIComponent } from 'app/root';
import { useAccount, useNetwork, useSelected } from 'app/stores';
import { backgrounds } from 'assets/images/backgrounds';
import { getAccountByOwner } from 'layers/network/shapes/Account';
import { Room } from './Room';

// The Scene paints the wallpaper and the room. It updates the selected room
// index in the Selected store whenever the player switches rooms or changes
// the connected account.
export function registerScene() {
  registerUIComponent(
    'Scene',
    {
      colStart: 1,
      colEnd: 100,
      rowStart: 1,
      rowEnd: 100,
    },
    (layers) => {
      const { network } = layers;
      const { world, components } = network;

      return interval(1000).pipe(
        map(() => {
          const { selectedAddress } = useNetwork.getState();
          const account = getAccountByOwner(world, components, selectedAddress);
          return {
            data: { account },
          };
        })
      );
    },

    ({ data }) => {
      const { account } = data;
      const { roomIndex, setRoom } = useSelected();
      const { validations } = useAccount();

      useEffect(() => {
        const newRoomIndex = account?.roomIndex ?? 0;
        if (roomIndex != newRoomIndex) setRoom(newRoomIndex);
      }, [account, validations]);

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
