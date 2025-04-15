import { useEffect } from 'react';
import styled from 'styled-components';

import { playClick } from 'utils/sounds';
import { ViewMode } from '../../types';

interface Props {
  controls: {
    mode: ViewMode;
    setMode: (mode: ViewMode) => void;
  };
}

export const Public = (props: Props) => {
  const { controls } = props;
  const { mode, setMode } = controls;

  useEffect(() => {}, []);

  const handleClick = () => {
    setMode('ALT');
    playClick();
  };

  return (
    <Container isSelected={mode === 'ALT'} onClick={handleClick}>
      <Text>Public Mint</Text>
    </Container>
  );
};

const Container = styled.div<{ isSelected: boolean }>`
  border-radius: 1.2vw;
  background-color: ${({ isSelected }) => (isSelected ? 'white' : '#beb')};
  height: 18vw;
  width: 24vw;

  display: flex;
  flex-flow: column nowrap;
  align-items: center;
  justify-content: center;
  cursor: pointer;
`;

const Text = styled.div`
  font-size: 1.5vw;
`;
