import SwapVertIcon from '@mui/icons-material/SwapVert';
import { useState } from 'react';
import styled from 'styled-components';

import { IconListButton } from 'app/components/library';
import { TokenIcons } from 'assets/images/tokens';

export const MyOrders = ({ isVisible }: { isVisible: boolean }) => {
  const [sortBy, setSortBy] = useState<string>('');

  const sortOptions = [
    { text: 'Price', onClick: () => setSortBy('Price') },
    { text: 'Type', onClick: () => setSortBy('Type') },
  ];

  return (
    <Tab isVisible={isVisible}>
      <ButtonWrapper>
        <IconListButton
          img={SwapVertIcon as any}
          text={sortBy}
          options={sortOptions}
          radius={0.6}
        />
      </ButtonWrapper>
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
          <ColumnHeader>Actions</ColumnHeader>
        </Column>
      </Row>
    </Tab>
  );
};

const Tab = styled.div<{ isVisible: boolean }>`
  ${({ isVisible }) => (isVisible ? `display: flex;` : `display: none;`)}
  flex-direction: column;
  flex: 1;
  overflow: auto;
  width: 100%;
  min-height: 10vw;
`;

const Row = styled.div`
  display: flex;
  flex-flow: row nowrap;
  align-items: center;
  width: 100%;
`;

const Column = styled.div`
  display: flex;
  flex-flow: column nowrap;
  flex: 1;
`;

const ColumnHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0.8vw;
  font-size: 1.1vw;
`;

const EthIcon = styled.img`
  width: 1.4vw;
  height: 1.4vw;
`;

const ButtonWrapper = styled.div`
  display: flex;
  gap: 0.4vw;
  padding: 0.4vw;
  width: fit-content;
`;
