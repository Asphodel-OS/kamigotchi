import styled from 'styled-components';

import { GachaMintConfig } from 'app/cache/config';
import { EmptyText } from 'app/components/library';
import { GachaMintData } from 'network/shapes/Gacha';
import { Item } from 'network/shapes/Item';
import { PricePanel } from '../PricePanel';

export const Whitelist = ({
  data,
  state,
  isVisible,
}: {
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
      whitelisted: boolean;
    };
  };
  state: {
    quantity: number;
    price: number;
    tick: number;
  };
}) => {
  const { tick } = state;
  const { mint } = data;

  /////////////////
  // CHECKERS

  // check whether the mint has started
  const hasStarted = () => {
    const now = tick / 1000;
    return now > mint.config.whitelist.startTs;
  };

  // check whether the account has reached the max number of this type of mint
  const hasReachedMax = () => {
    return mint.data.account.whitelist >= mint.config.whitelist.max;
  };

  // check whether minted out
  const isComplete = () => {
    return mint.data.gacha.total >= mint.config.total;
  };

  // check whether the account is whitelisted for this mint
  const isWhitelisted = () => {
    return mint.whitelisted;
  };

  /////////////////
  // INTERPRETATION

  // get the error text if there's an issue
  const getErrorText = () => {
    if (isComplete()) return 'All minted out ^^ thanks for playing';
    if (!hasStarted()) return 'Whitelist mint has not yet started';
    if (!isWhitelisted()) return 'You are not whitelisted';
    if (hasReachedMax()) return 'You have reached the max Whitelist mints';
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
