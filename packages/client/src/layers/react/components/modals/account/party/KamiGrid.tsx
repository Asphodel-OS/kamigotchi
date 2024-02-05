import styled from 'styled-components';

import { Tooltip } from 'layers/react/components/library/Tooltip';
import { useVisibility } from 'layers/react/store/visibility';
import { useSelected } from 'layers/react/store/selected';
import { playClick } from 'utils/sounds';

import { Kami } from 'layers/network/shapes/Kami';


interface Props {
  kamis: Kami[];
  getKamiText?: (kami: Kami) => string[];
}


export const KamiGrid = (props: Props) => {

  const { modals, setModals } = useVisibility();
  const { kamiIndex, setKami } = useSelected();

  const Cell = (kami: Kami) => {
    const imageOnClick = () => {
      const sameKami = (kamiIndex === kami.index);
      setKami(kami.index);

      if (modals.kami && sameKami) setModals({ ...modals, kami: false });
      else setModals({ ...modals, kami: true });
      playClick();
    }

    return (
      <Tooltip text={props.getKamiText ? props.getKamiText(kami) : []}>
        <CellContainer id={`grid-${kami.id}`}>
          <Image onClick={() => imageOnClick()} src={kami.uri} />
        </CellContainer>
      </Tooltip>
    );
  }

  return (
    <Container key='grid'>
      {props.kamis.map((kami) => Cell(kami))}
    </Container>
  );
}

const Container = styled.div`
  display: flex;
  flex-flow: wrap;
  justify-content: center;
  align-items: flex-start;
`;

const CellContainer = styled.div`
  border: solid .15vw black;
  border-radius: .25vw;

  margin: 0.3vh 0.4vw;
  position: relative;
`;


const Image = styled.img`
  border-radius: .1vw;
  height: 6vw;
  cursor: pointer;

  &:hover {
    opacity: 0.75;
  }
`;