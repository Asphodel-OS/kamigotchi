import styled from 'styled-components';

import { TabType, ViewMode } from '../../types';
import { Public } from './Public';
import { Whitelist } from './Whitelist';

interface Props {
  isVisible: boolean;
  controls: {
    mode: ViewMode;
    setMode: (mode: ViewMode) => void;
    tab: TabType;
  };
}
export const Mint = (props: Props) => {
  const { isVisible, controls } = props;

  return (
    <Container isVisible={isVisible}>
      <Whitelist controls={controls} />
      <Public controls={controls} />
      {/* <EmptyText text={['Good things come', ' to those who wait']} size={2.1} />
      <Overlay bottom={6}>
        <Text>better things come</Text>
      </Overlay>
      <Overlay bottom={3}>
        <Text>to those who mint kamis</Text>
      </Overlay> */}
    </Container>
  );
};

const Container = styled.div<{ isVisible: boolean }>`
  position: relative;
  height: 95%;
  width: 100%;

  display: ${({ isVisible }) => (isVisible ? 'flex' : 'none')};
  flex-flow: row wrap;
  align-items: center;
  justify-content: center;
  gap: 2.5vw;
`;

const Text = styled.div`
  font-size: 1.2vw;
  color: #baeaba;
`;
