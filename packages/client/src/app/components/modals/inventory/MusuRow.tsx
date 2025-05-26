import styled from 'styled-components';

import { TextTooltip } from 'app/components/library';
import { ItemImages } from 'assets/images/items';

interface Props {
  balance: number;
}

// get the row of consumable items to display in the player inventory
export const MusuRow = (props: Props) => {
  const { balance } = props;

  return (
    <Container key='musu'>
      <TextTooltip text={['MUSU']}>
        <Icon src={ItemImages.musu} />
      </TextTooltip>
      <Balance>{balance.toLocaleString()}</Balance>
    </Container>
  );
};

const Container = styled.div`
  width: 100%;
  padding: 0.45vw;
  gap: 0.45vw;

  display: flex;
  flex-flow: row no-wrap;
  justify-content: flex-end;
  align-items: center;
`;

const Icon = styled.img`
  width: 1.8vw;
  height: 1.8vw;
  margin-top: 0.12vw;
`;

const Balance = styled.div`
  border: solid #333 0.15vw;
  border-radius: 0.6vw 0 0.6vw 0.6vw;
  padding: 0.3vw;
  width: 42%;

  display: flex;
  flex-flow: row nowrap;
  justify-content: flex-end;
  align-items: center;

  color: black;
  font-size: 0.9vw;
  line-height: 1.2vw;
`;
