import styled from 'styled-components';

import { GachaMintConfig } from 'app/cache/config';
import { GachaMintData } from 'network/shapes/Gacha';
import { Item } from 'network/shapes/Item';
import { ViewMode } from '../../../types';
import { Public } from './Public';
import { Whitelist } from './Whitelist';

interface Props {
  isVisible: boolean;
  controls: {
    mode: ViewMode;
  };
  data: {
    balance: number;
    payItem: Item;
    saleItem: Item;
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
    quantity: number;
    price: number;
  };
}
export const Mint = (props: Props) => {
  const { controls, data, state, isVisible } = props;
  const { mode } = controls;

  return (
    <Container isVisible={isVisible}>
      <Whitelist isVisible={mode === 'DEFAULT'} data={data} state={state} />
      <Public isVisible={mode === 'ALT'} data={data} state={state} />
    </Container>
  );
};

const Container = styled.div<{ isVisible: boolean }>`
  position: relative;
  height: 100%;
  width: 100%;

  display: ${({ isVisible }) => (isVisible ? 'flex' : 'none')};
  flex-direction: column;
  justify-content: flex-start;
`;
