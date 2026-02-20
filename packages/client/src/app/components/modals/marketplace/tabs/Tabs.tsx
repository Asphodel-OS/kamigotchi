import styled from 'styled-components';

import { IconButton, TextTooltip } from 'app/components/library';
import { playClick } from 'utils/sounds';

export type MarketplaceTab = 'listings' | 'bids' | 'myOrders';

export const Tabs = ({
  tab,
  setTab,
  onCreateOrder,
  onCloseCreateOrder,
}: {
  tab: MarketplaceTab;
  setTab: (tab: MarketplaceTab) => void;
  onCreateOrder: () => void;
  onCloseCreateOrder: () => void;
}) => {
  const handleTabClick = (newTab: MarketplaceTab) => {
    playClick();
    onCloseCreateOrder();
    setTab(newTab);
  };

  return (
    <Container>
      <TabButtons>
        <IconButton
          text='Listings'
          onClick={() => handleTabClick('listings')}
          disabled={tab === 'listings'}
          color='#FFF0E0'
        />
        <IconButton
          text='Bids'
          onClick={() => handleTabClick('bids')}
          disabled={tab === 'bids'}
          color='#E0EEFF'
        />
      </TabButtons>
      <RightButtons>
        <IconButton
          text='My Orders'
          onClick={() => handleTabClick('myOrders')}
          disabled={tab === 'myOrders'}
        />
        <TextTooltip text={['Create Order.']}>
          <IconButton text='+' onClick={onCreateOrder} />
        </TextTooltip>
      </RightButtons>
    </Container>
  );
};

const Container = styled.div`
  margin-bottom: 0.6vw;
  width: 100%;
  background-color: white;
  display: flex;
  flex-flow: row nowrap;
  justify-content: space-between;
`;

const TabButtons = styled.div`
  display: flex;
  gap: 1vw;
`;

const RightButtons = styled.div`
  display: flex;
  gap: 1vw;
`;
