import styled from 'styled-components';

import { IconButton, TextTooltip } from 'app/components/library';
import { useVisibility } from 'app/stores';
import { ArrowIcons } from 'assets/images/icons/arrows';
import { ItemImages } from 'assets/images/items';

// get the row of consumable items to display in the player inventory
export const MusuRow = ({
  data: { musu, obols, showSend },
  utils: { setShowSend },
}: {
  data: {
    musu: number;
    obols: number;
    showSend: boolean;
  };
  utils: { setShowSend: (show: boolean) => void };
}) => {
  const { modals, setModals } = useVisibility();

  return (
    <Container key='musu'>
      <Icons>
        <TextTooltip
          text={[
            'View the Kamigotchi World Orderbook\n\n',
            'You must be in a designated Trade room',
            'to interact with outstanding Orders.',
          ]}
          direction='row'
        >
          <IconButton
            img={ItemImages.musu}
            onClick={() => setModals({ ...modals, trading: !modals.trading })}
            radius={0.9}
          />
        </TextTooltip>{' '}
        {obols > 1 && (
          <IconButton
            img={ItemImages.obol}
            onClick={() => setModals({ ...modals, lootBox: !modals.lootBox })}
            radius={0.9}
          />
        )}
        <IconButton img={ArrowIcons.right} onClick={() => setShowSend(!showSend)} radius={0.9} />
      </Icons>
      <TextTooltip text={['MUSU']} direction='row' fullWidth>
        <MusuSection>
          <Icon src={ItemImages.musu} onClick={() => null} />
          <Balance>{musu.toLocaleString()}</Balance>
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

const Icons = styled.div`
  display: flex;
  flex-flow: row nowrap;
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
