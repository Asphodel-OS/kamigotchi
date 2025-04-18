import styled from 'styled-components';

import { GachaMintConfig } from 'app/cache/config';
import { Overlay } from 'app/components/library';
import { Account } from 'network/shapes/Account';
import { GachaMintData } from 'network/shapes/Gacha';
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
  data: {
    account: Account;
    mint: {
      config: GachaMintConfig;
      data: {
        account: GachaMintData;
        gacha: GachaMintData;
      };
    };
  };
  state: {
    tick: number;
  };
}

export const Mint = (props: Props) => {
  const { isVisible, controls, data, state } = props;
  const { mint } = data;

  return (
    <Container isVisible={isVisible}>
      <Whitelist controls={controls} state={state} data={data} />
      <Public controls={controls} state={state} data={data} />
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
