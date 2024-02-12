import styled from 'styled-components';

import musuIcon from 'assets/images/icons/musu.png';
import { Tooltip } from 'layers/react/components/library/Tooltip';

interface Props {
  balance: number;
}

// get the row of consumable items to display in the player inventory
export const MusuRow = (props: Props) => {
  return (
    <Container key='musu'>
      <Tooltip text={['$MUSU']}>
        <Icon src={musuIcon} />
      </Tooltip>
      <Balance>{props.balance}</Balance>
    </Container>
  );
};

const Container = styled.div`
  padding: 0.5vw;

  display: flex;
  flex-flow: column no-wrap;
  justify-content: flex-end;
  align-items: center;
  width: 100%;
`;

const Icon = styled.img`
  width: 1.8vw;
  height: 1.8vw;
  margin-right: 0.5vw;
`;

const Balance = styled.div`
  border: solid #666 0.15vw;
  border-radius: 0.3vw;
  padding: 0.5vw;
  width: 50%;

  display: flex;
  flex-flow: row nowrap;
  justify-content: flex-end;

  color: black;
  font-family: Pixel;
  font-size: 1vw;
`;
