import { useEffect } from 'react';
import styled from 'styled-components';

import { useLayers } from 'app/root/hooks';
import { UIComponent } from 'app/root/types';
import { useAccount, useSelected } from 'app/stores';
import { backgrounds } from 'assets/images/backgrounds';
import { useComponentValue } from 'engine/recs';
import { Room } from './Room';

// The Scene paints the wallpaper and the room. It updates the selected room
// index in the Selected store whenever the player switches rooms or changes
// the connected account.
export const Scene: UIComponent = {
  id: 'Scene',
  Render: () => {
    const layers = useLayers();

    /////////////////
    // PREPARATION

    const { network } = layers;
    const { components } = network;
    const { RoomIndex: RoomIndexComponent } = components;

    /////////////////
    // INSTANTIATION

    const roomIndex = useSelected((s) => s.roomIndex);
    const setRoom = useSelected((s) => s.setRoom);
    const accountEntity = useAccount((s) => s.account.entity);
    const roomIndexValue = useComponentValue(RoomIndexComponent, accountEntity);

    /////////////////
    // SUBSCRIPTION

    // update the room index whenever account or account's RoomIndex component changes
    useEffect(() => {
      if (!accountEntity) return;
      setRoom(roomIndexValue?.value ?? 0);
    }, [accountEntity, roomIndexValue, setRoom]);

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
