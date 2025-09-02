import styled from 'styled-components';

import { GachaMintConfig } from 'app/cache/config';
import { Overlay } from 'app/components/library';
import { Account } from 'network/shapes/Account';
import { GachaMintData } from 'network/shapes/Gacha';
import { TabType, ViewMode } from '../../types';
import { Public } from './Public';
import { Whitelist } from './Whitelist';

export const Mint = ({
  isVisible,
  controls,
  data,
  state,
}: {
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
      whitelisted: boolean;
    };
  };
  state: {
    tick: number;
  };
}) => {
  return (
    <Container isVisible={isVisible}>
      <Whitelist controls={controls} state={state} data={data} />
      <Public controls={controls} state={state} data={data} />
      <Overlay bottom={2.1} orientation='column'>
        <Text size={1.2}>good things come</Text>
        <Text size={1.2}>to those who mint kami</Text>
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
  gap: 2.5em;
`;

const Text = styled.div<{ size: number }>`
  font-size: ${({ size }) => size}em;
  line-height: ${({ size }) => size * 2}em;
  color: #b9e9b9;
`;
