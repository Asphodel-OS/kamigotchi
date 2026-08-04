import styled from 'styled-components';

import { EmptyText, IconButton, TextTooltip } from 'app/components/library';
import { TokenIcons } from 'assets/images/tokens';
import { MyOrder } from './MyOrders';

export const HistorySection = ({
  isVisible,
  onClose,
  orders,
  formatPrice,
  getBidProgress,
  openKamiModal,
  resolveKami,
}: {
  isVisible: boolean;
  onClose: () => void;
  orders: (MyOrder & { state: 'Cancelled' | 'Completed' })[];
  formatPrice: (wei: string) => string;
  getBidProgress: (total: number, quantity: number) => string;
  openKamiModal: (index: number) => void;
  resolveKami: (index: number) => { image: string; name: string } | undefined;
}) => {
  return (
    <HistoryContainer isVisible={isVisible}>
      <HistoryHeader>
        <HeaderTitle>History</HeaderTitle>
        <IconButton text='X' onClick={onClose} scale={1.5} />
      </HistoryHeader>
      <HistoryBody>
        <Row>
          <Column>
            <ColumnHeader>Type</ColumnHeader>
          </Column>
          <Column>
            <ColumnHeader>Offers</ColumnHeader>
          </Column>
          <Column>
            <ColumnHeader>
              <EthIcon src={TokenIcons.eth} alt='ETH' />
            </ColumnHeader>
          </Column>
          <Column>
            <ColumnHeader>State</ColumnHeader>
          </Column>
        </Row>
        {orders.length === 0 && <EmptyText text={['No history']} size={0.9} />}
        {orders.map((order) => (
          <HistoryRow
            key={`history-${order.type}-${order.orderId}`}
            order={order}
            resolveKami={resolveKami}
            openKamiModal={openKamiModal}
            getBidProgress={getBidProgress}
            formatPrice={formatPrice}
          />
        ))}
      </HistoryBody>
    </HistoryContainer>
  );
};

const HistoryRow = ({
  order,
  resolveKami,
  openKamiModal,
  getBidProgress,
  formatPrice,
}: {
  order: MyOrder & { state: 'Cancelled' | 'Completed' };
  resolveKami: (index: number) => { image: string; name: string } | undefined;
  openKamiModal: (index: number) => void;
  getBidProgress: (total: number, quantity: number) => string;
  formatPrice: (wei: string) => string;
}) => {
  const kami = resolveKami(order.kamiIndex);

  return (
    <Row>
      <Column>
        <CellText>{order.type}</CellText>
      </Column>
      <Column>
        {order.type === 'Listing' ? (
          <OrderKami>
            {kami && (
              <OrderKamiImage
                src={kami.image}
                alt={kami.name ?? `Kami #${order.kamiIndex}`}
                onClick={() => openKamiModal(order.kamiIndex)}
              />
            )}
          </OrderKami>
        ) : getBidProgress(order.total, order.quantity) ? (
          <TextTooltip
            text={[
              `${order.total - order.quantity}/${order.total} kami in this bid have already been purchased.`,
            ]}
          >
            <CellText>
              {order.bidType === 'Kami' ? `Kami #${order.kamiIndex} ` : ''}
              {getBidProgress(order.total, order.quantity)}
            </CellText>
          </TextTooltip>
        ) : (
          <CellText>{order.bidType === 'Kami' ? `Kami #${order.kamiIndex}` : ''}</CellText>
        )}
      </Column>
      <Column>
        <CellText>{formatPrice(order.price)}</CellText>
      </Column>
      <Column>
        <CellText>{order.state}</CellText>
      </Column>
    </Row>
  );
};

const HistoryContainer = styled.div<{ isVisible: boolean }>`
  ${({ isVisible }) => (isVisible ? `display: flex;` : `display: none;`)}
  flex-direction: column;
  flex: 0 0 50%;
  overflow: hidden;
  border-top: 0.15vw solid black;
  width: 100%;
`;

const HistoryHeader = styled.div`
  display: flex;
  align-items: center;
  background-color: rgb(221, 221, 221);
  padding: 0.8vw;
  font-size: 1.2vw;
  position: sticky;
  top: 0;
  z-index: 1;
`;

const HeaderTitle = styled.span`
  flex: 1;
  text-align: center;
  font-size: 1.1vw;
`;

const HistoryBody = styled.div`
  display: flex;
  flex-direction: column;
  overflow-y: auto;
  flex: 1;

  scrollbar-width: none;
  &::-webkit-scrollbar {
    display: none;
  }
`;

const Row = styled.div`
  display: flex;
  flex-flow: row nowrap;
  align-items: center;
  width: 100%;
  min-height: 3vw;
`;

const Column = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  flex: 1;
`;

const ColumnHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0.4vw 0.6vw;
  font-size: 1.05vw;
  line-height: 1.2;
`;

const CellText = styled.span`
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.95vw;
  line-height: 1.2;
  padding: 0.4vw 0.6vw;
`;

const OrderKami = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
`;

const OrderKamiImage = styled.img`
  width: 2.6vw;
  height: 2.6vw;
  border-radius: 0.3vw;
  border: 0.1vw solid black;
  image-rendering: pixelated;
  cursor: pointer;
`;

const EthIcon = styled.img`
  width: 1.4vw;
  height: 1.4vw;
`;
