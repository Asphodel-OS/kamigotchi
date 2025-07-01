import styled from 'styled-components';

import { IconButton, TextTooltip } from 'app/components/library';
import { useVisibility } from 'app/stores';
import { ItemImages } from 'assets/images/items';

interface Props {
  balance: number;
}

// get the row of consumable items to display in the player inventory
export const MusuRow = (props: Props) => {
  const { balance } = props;
  const { modals, setModals } = useVisibility();

  return (
    <Container key='musu'>
      <TextTooltip
        text={[
          'View the Kamigtochi World Orderbook\n\n',
          'You must be in a designated Trade room',
          'to interact with outstanding Orders.',
        ]}
        direction='row'
      >
        <IconButton
          img={ItemImages.musu}
          text='Trades'
          onClick={() => setModals({ ...modals, trading: !modals.trading })}
          radius={0.9}
        />
      </TextTooltip>
      <TextTooltip text={['MUSU']} direction='row' fullWidth>
        <MusuSection>
          <Icon src={ItemImages.musu} onClick={() => null} />
          <Balance>{balance.toLocaleString()}</Balance>
        </MusuSection>
      </TextTooltip>
    </Container>
  );
};

const Container = styled.div`
  width: 100%;
  padding: 0.45vw;
  gap: 0.45vw;

  user-select: none;
  display: flex;
  flex-flow: row no-wrap;
  justify-content: space-between;
  align-items: center;
`;

const MusuSection = styled.div`
  position: relative;
  width: 100%;
  display: flex;
  flex-flow: row nowrap;
  justify-content: flex-end;
  align-items: center;
  gap: 0.3vw;
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
  width: 50%;

  display: flex;
  flex-flow: row nowrap;
  justify-content: flex-end;
  align-items: center;

  color: black;
  font-size: 0.9vw;
  line-height: 1.2vw;
`;
