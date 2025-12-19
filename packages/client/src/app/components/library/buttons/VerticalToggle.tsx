import React, { useState } from 'react';
import styled from 'styled-components';

import { hoverFx } from 'app/styles/effects';

// TODO: needs robust positioning calculations
// good opportunity for pair programming (@tisiphone + @acheron)
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

  const getPosition = (pos: number) => pos % 3;

  return (
    <Container onClick={handleClick}>
      <SwitchHolder>
        <Switch step={getPosition(position)} />
      </SwitchHolder>
    </Container>
  );
};

const Container = styled.div`
  position: relative;
  background-color: white;
  border-block: 0.15em solid black;

  width: 1.5em;

  display: flex;
  flex-direction: column;
  justify-content: space-around;
  align-items: center;

  cursor: pointer;
  &:hover {
    animation: ${() => hoverFx()} 0.2s;
    transform: scale(1.05);
    z-index: 1;
    border-right: 0.15em solid black;
    border-left: 0.15em solid black;
  }
`;

const SwitchHolder = styled.div`
  position: relative;
  width: 80%;
  height: 90%;
  pointer-events: none;
  background-color: #ccc;
  border-radius: 1em;
`;

const Switch = styled.div<{ step: number }>`
  position: absolute;
  background-color: #494545;
  border-radius: 50%;

  aspect-ratio: 1;
  width: 70%;
  left: 50%;
  top: ${({ step }) => step * 50}%;

  transform: translateX(-50%) translateY(${({ step }) => step * -50}%);
  transition: transform 0.3s ease;
`;
