import styled from 'styled-components';

import { IconButton } from 'app/components/library';
import { playClick } from 'utils/sounds';

export const Tabs = ({
  tab,
  setTab,
  onCreateOrder,
}: {
  tab: string;
  setTab: (tab: string) => void;
  onCreateOrder: () => void;
}) => {
  const handleTabClick = (newTab: string) => {
    playClick();
    setTab(newTab);
  };

  return (
    <Container>
      <TabButtons>
        <IconButton
          text='Listings'
          onClick={() => handleTabClick('listings')}
          disabled={tab === 'listings'}
        />

        <IconButton text='Bids' onClick={() => handleTabClick('bids')} disabled={tab === 'bids'} />
        <IconButton
          text='My Orders'
          onClick={() => handleTabClick('myOrders')}
          disabled={tab === 'myOrders'}
        />
      </TabButtons>
      <IconButton text='+' onClick={onCreateOrder} />
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
