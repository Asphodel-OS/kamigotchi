import styled from 'styled-components';

import { GachaMintConfig } from 'app/cache/config';
import { EmptyText } from 'app/components/library';
import { GachaMintData } from 'network/shapes/Gacha';
import { Item } from 'network/shapes/Item';
import { PricePanel } from '../PricePanel';

interface Props {
  isVisible: boolean;
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
    };
  };
  state: {
    quantity: number;
    price: number;
    tick: number;
  };
}

export const Public = (props: Props) => {
  const { data, state, isVisible } = props;
  const { tick } = state;
  const { mint } = data;

  /////////////////
  // CHECKERS

  // check whether the mint has started
  const hasStarted = () => {
    const now = tick / 1000;
    return now > mint.config.public.startTs;
  };

  // check whether the account has reached the max number of this type of mint
  const hasReachedMax = () => {
    return mint.data.account.public >= mint.config.public.max;
  };

  // check whether minted out
  const isComplete = () => {
    return mint.data.gacha.total >= mint.config.total;
  };

  /////////////////
  // INTERPRETATION

  // get the error text if there's an issue
  const getErrorText = () => {
    if (!hasStarted()) return 'Public mint has not yet started';
    if (isComplete()) return 'All minted out ^^ thanks for playing';
    if (hasReachedMax()) return 'You have reached the max public mints';
    return '';
  };
  return (
    <Container isVisible={isVisible}>
      {getErrorText() && <EmptyText text={[getErrorText()]} />}
      <PricePanel isVisible={!getErrorText()} data={data} state={state} />
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
