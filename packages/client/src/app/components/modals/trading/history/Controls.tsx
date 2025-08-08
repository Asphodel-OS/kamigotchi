import { Dispatch } from 'react';
import styled from 'styled-components';

import { TradeType } from 'app/cache/trade';
import { IconButton, Text } from 'app/components/library';

interface DropdownOption {
  text: string;
  object?: any;
}

interface Props {
  controls: {
    typeFilter: TradeType;
    setTypeFilter: Dispatch<TradeType>;
  };
}

export const Controls = (props: Props) => {
  const { controls } = props;
  const { typeFilter, setTypeFilter } = controls;

  const toggleTypeFilter = () => {
    if (typeFilter === 'Buy') setTypeFilter('Sell');
    if (typeFilter === 'Sell') setTypeFilter('Barter');
    if (typeFilter === 'Barter') setTypeFilter('Buy');
  };

  return (
    <Container>
      <Title>Search Offers</Title>
      <Body>
        <Row>
          <Text size={1.2}>Type:</Text>
          <IconButton text={`< ${typeFilter} >`} onClick={toggleTypeFilter} />
        </Row>
      </Body>
    </Container>
  );
};

const Container = styled.div`
  border-right: 0.15vw solid black;
  height: 100%;
  width: 40%;
  gap: 0.6vw;

  display: flex;
  flex-flow: column nowrap;
  justify-content: flex-start;
`;

const Title = styled.div`
  position: sticky;
  top: 0;
  background-color: rgb(221, 221, 221);
  width: 100%;

  padding: 1.8vw;
  opacity: 0.9;
  color: black;
  font-size: 1.2vw;
  text-align: left;
  z-index: 1;
`;

const Body = styled.div`
  position: relative;
  height: 50%;
  margin: 1.8vw 0.6vw;
  gap: 1.2vw;

  display: flex;
  flex-direction: column;
  align-items: center;

  scrollbar-color: transparent transparent;
`;

const Row = styled.div`
  width: 100%;
  gap: 0.6vw;

  display: flex;
  flex-flow: row nowrap;
  justify-content: flex-start;
  align-items: center;
`;
