import styled from 'styled-components';

import { Overlay } from 'app/components/library';
import { TabType, ViewMode } from '../../types';
import { Public } from './Public';
import { Whitelist } from './Whitelist';

const CLAIMED = 2000;

interface Props {
  isVisible: boolean;
  controls: {
    mode: ViewMode;
    setMode: (mode: ViewMode) => void;
    tab: TabType;
  };
  state: {
    tick: number;
  };
}

export const Mint = (props: Props) => {
  const { isVisible, controls, state } = props;

  return (
    <Container isVisible={isVisible}>
      <Whitelist controls={controls} state={state} claimed={CLAIMED} />
      <Public controls={controls} state={state} claimed={CLAIMED} />
      <Overlay bottom={6}>
        <Text>good things come</Text>
      </Overlay>
      <Overlay bottom={3}>
        <Text>to those who mint kamis</Text>
      </Overlay>
    </Container>
  );
};

const Container = styled.div<{ isVisible: boolean }>`
  display: ${({ isVisible }) => (isVisible ? 'flex' : 'none')};
  position: relative;
  width: 100%;

  flex-flow: row wrap;
  align-items: center;
  justify-content: center;
  gap: 2.5vw;
`;

const Text = styled.div`
  font-size: 1.2vw;
  line-height: 1.8vw;
  color: #b9e9b9;
`;
