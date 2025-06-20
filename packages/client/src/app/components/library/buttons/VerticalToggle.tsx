import { hoverFx } from 'app/styles/effects';
import React, { useState } from 'react';
import styled from 'styled-components';

interface Props {
  setModeSelected: React.Dispatch<React.SetStateAction<number>>;
}

export const VerticalToggle = (props: Props) => {
  const { setModeSelected } = props;
  const [position, setPosition] = useState(0); // top to bottom

  const handleClick = () => {
    const nextPos = position + 1;
    const mode = nextPos % 3;
    setPosition(nextPos);
    setModeSelected(mode);
  };

  const getTranslate = (pos: number) => (pos % 3) * 55 + '%';

  return (
    <Container onClick={handleClick}>
      <KnobWrapper>
        <Knob position={getTranslate(position)} />
      </KnobWrapper>
    </Container>
  );
};

const Container = styled.div`
  position: relative;
  width: 100%;
  height: 100%;
  background-color: white;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  justify-content: space-around;
  cursor: pointer;
  border-block: 0.12vw solid black;
  align-items: center;
  &:hover {
    animation: ${() => hoverFx()} 0.2s;
    transform: scale(1.05);
  }
`;

const KnobWrapper = styled.div`
  width: 80%;
  height: 90%;
  pointer-events: none;
  display: flex;
  align-items: flex-start;
  justify-content: center;
  background-color: #ccc;
  border-radius: 1vw;
`;

const Knob = styled.div<{ position: string }>`
  position: absolute;
  width: 70%;
  aspect-ratio: 1;
  background-color: #494545;
  border-radius: 50%;
  transition: transform 0.3s ease;
  transform: translateY(${({ position }) => position});
`;
