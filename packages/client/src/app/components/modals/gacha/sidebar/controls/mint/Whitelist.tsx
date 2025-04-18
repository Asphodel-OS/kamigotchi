import styled from 'styled-components';

import { GachaMintConfig } from 'app/cache/config';
import { EmptyText } from 'app/components/library';
import { GachaMintData } from 'network/shapes/Gacha';
import { Item } from 'network/shapes/Item';

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
  };
}

export const Whitelist = (props: Props) => {
  const { data, isVisible } = props;
  const { mint } = data;

  // check whether the mint has started
  const hasStarted = () => {
    const now = Date.now() / 1000;
    return now > mint.config.whitelist.startTs;
  };

  const isComplete = () => {
    return mint.data.gacha.total >= mint.config.total;
  };

  return (
    <Container isVisible={isVisible}>
      {!hasStarted() && <EmptyText text={['WHITELIST MINT HAS NOT YET STARTED']} />}
    </Container>
  );
};

const Container = styled.div<{ isVisible: boolean }>`
  position: relative;
  height: 100%;
  width: 100%;
  padding: 0.6vw;

  display: ${({ isVisible }) => (isVisible ? 'flex' : 'none')};
  flex-direction: column;
  justify-content: flex-start;
`;
