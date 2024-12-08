import styled from 'styled-components';

import { ActionButton, Tooltip } from 'app/components/library';
import { useVisibility } from 'app/stores';
import { ItemImages } from 'assets/images/items';

interface Props {
  balance: number;
}

// get the row of consumable items to display in the player inventory
export const MusuRow = (props: Props) => {
  const { setModals } = useVisibility();

  return (
    <Container key='musu'>
      <ActionButton text='Crafting' onClick={() => setModals({ crafting: true })} />
      <div style={{ display: 'flex', flexFlow: 'row', width: '50%', justifyContent: 'flex-end' }}>
        <Tooltip text={['MUSU']}>
          <Icon src={ItemImages.musu} />
        </Tooltip>
        <Balance>{props.balance}</Balance>
      </div>
    </Container>
  );
};

const Container = styled.div`
  padding: 0.5vw;

  display: flex;
  flex-flow: column no-wrap;
  justify-content: space-between;
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
