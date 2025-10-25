import { hoverFx } from 'app/styles/effects';
import React, { useState } from 'react';
import styled from 'styled-components';

export const VerticalToggle = ({
  setModeSelected,
}: {
  setModeSelected: React.Dispatch<React.SetStateAction<number>>;
}) => {
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
      <SwitchHolder>
        <Switch position={getTranslate(position)} />
      </SwitchHolder>
    </Container>
  );
};

const Container = styled.div`
  position: relative;
  background-color: white;
  border-block: 0.15vw solid black;

  width: 1.5vw;

  display: flex;
  flex-direction: column;
  justify-content: space-around;
  align-items: center;

  cursor: pointer;
  &:hover {
    animation: ${() => hoverFx()} 0.2s;
    transform: scale(1.05);
    z-index: 1;
    border-right: 0.15vw solid black;
    border-left: 0.15vw solid black;
  }
`;

const SwitchHolder = styled.div`
  width: 80%;
  height: 90%;
  pointer-events: none;
  display: flex;
  align-items: flex-start;
  justify-content: center;
  background-color: #ccc;
  border-radius: 1vw;
`;

const Switch = styled.div<{ position: string }>`
  position: absolute;
  width: 70%;
  aspect-ratio: 1;
  background-color: #494545;
  border-radius: 50%;
  transition: transform 0.3s ease;
  transform: translateY(${({ position }) => position});
`;
