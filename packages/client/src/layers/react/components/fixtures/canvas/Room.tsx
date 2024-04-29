import { rooms } from 'constants/rooms';
import { useEffect, useState } from 'react';
import styled from 'styled-components';

interface Props {
  index: number;
}

export const Room = (props: Props) => {
  const { index } = props;
  const [imageUrl, setImageUrl] = useState('');

  useEffect(() => {
    if (!!index) {
      const room = rooms[index];
      setImageUrl(room.background?.path ?? '');
    }
  }, [index]);

  ///////////////////
  // RENDER

  return (
    <Wrapper>
      <Background src={imageUrl} />
    </Wrapper>
  );
};

const Wrapper = styled.div`
  position: absolute;
  width: auto;
  height: 100%;
  z-index: -2;
`;

const Background = styled.img`
  width: 100%;
  height: 100%;
  image-rendering: pixelated;
  image-rendering: -moz-crisp-edges;
  image-rendering: crisp-edges;
`;
