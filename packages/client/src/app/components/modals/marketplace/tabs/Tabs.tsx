import styled from 'styled-components';

import { IconButton, TextTooltip } from 'app/components/library';
import { playClick } from 'utils/sounds';
import { MarketplaceTab } from '../types';

export const Tabs = ({
  tab,
  setTab,
  onCreateOrder,
  onCloseCreateOrder,
  createOrderOpen,
}: {
  tab: MarketplaceTab;
  setTab: (tab: MarketplaceTab) => void;
  onCreateOrder: () => void;
  onCloseCreateOrder: () => void;
  createOrderOpen: boolean;
}) => {
  const handleTabClick = (newTab: MarketplaceTab) => {
    playClick();
    onCloseCreateOrder();
    setTab(newTab);
  };

  return (
    <Container>
      <TabButtons>
        <TabItem $active={tab === 'listings'} $color='#FFF0E0'>
          <IconButton
            text='Listings'
            onClick={() => handleTabClick('listings')}
            color={tab === 'listings' ? '#FFF0E0' : undefined}
            scale={3}
          />
        </TabItem>
        <TabItem $active={tab === 'bids'} $color='#E0EEFF'>
          <IconButton
            text='Bids'
            onClick={() => handleTabClick('bids')}
            color={tab === 'bids' ? '#E0EEFF' : undefined}
            scale={3}
          />
        </TabItem>
      </TabButtons>
      <RightButtons>
        <TabItem $active={tab === 'myOrders'} $color='#E8E0FF'>
          <IconButton
            text='My Orders'
            onClick={() => handleTabClick('myOrders')}
            color={tab === 'myOrders' ? '#E8E0FF' : undefined}
            scale={3}
          />
        </TabItem>
        <TabItem $active={createOrderOpen} $color='#FFF3C4'>
          <TextTooltip text={['Create Order']}>
            <IconButton
              text='+'
              onClick={onCreateOrder}
              color={createOrderOpen ? '#FFF3C4' : undefined}
              scale={3}
            />
          </TextTooltip>
        </TabItem>
      </RightButtons>
    </Container>
  );
};

const Container = styled.div`
  width: 100%;
  background-color: white;
  display: flex;
  flex-flow: row nowrap;
  justify-content: space-between;
  align-items: center;
  padding: 0.4vw 0.6vw;
  border-bottom: solid #ccc 0.1vw;
  user-select: none;

  & button {
    font-weight: 600;
  }
`;

const TabButtons = styled.div`
  display: flex;
  gap: 1vw;
`;

const RightButtons = styled.div`
  display: flex;
  gap: 1vw;
`;

const TabItem = styled.div<{ $active: boolean; $color: string }>`
  opacity: ${({ $active }) => ($active ? 1 : 0.55)};
  transition: opacity 0.15s;

  &:hover {
    opacity: 1;
  }
`;
