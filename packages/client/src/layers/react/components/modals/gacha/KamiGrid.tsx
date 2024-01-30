import styled from 'styled-components';

import { Tooltip } from 'layers/react/components/library/Tooltip';
import { useVisibility } from 'layers/react/store/visibility';
import { useSelected } from 'layers/react/store/selected';
import { playClick } from 'utils/sounds';

import { Kami } from 'layers/network/shapes/Kami';


interface Props {
  kamis: Kami[];
  kamiText?: (kami: Kami) => string[];
  select?: {
    arr: Kami[];
    set: (arr: Kami[]) => void;
  }
}

export const KamiGrid = (props: Props) => {

  const { modals, setModals } = useVisibility();
  const { kamiIndex, setKami } = useSelected();

  const Cell = (kami: Kami) => {
    let selectedIndex = props.select
      ? (props.select.arr.findIndex(k => k.id === kami.id))
      : -1;
    let isSelected = selectedIndex !== -1;

    const selectFunc = () => {
      // if (!props.select) return;

      // if (isSelected) {
      //   const newArr = [...props.select.arr].splice(selectedIndex, 1);
      //   props.select.set(newArr);
      // } else {
      //   const newArr = [...props.select.arr, kami];
      //   props.select.set(newArr);
      // }
    }

    const imageOnClick = () => {
      const sameKami = (kamiIndex === kami.index);
      setKami(kami.index);

      if (modals.kami && sameKami) setModals({ ...modals, kami: false });
      else setModals({ ...modals, kami: true });
      playClick();
    }

    return (
      <Tooltip text={props.kamiText ? props.kamiText(kami) : []}>
        <CellContainer id={`grid-${kami.id}`}>
          <Image onClick={() => imageOnClick()} src={kami.uri} />
          {props.select &&
            <SelectButton onClick={selectFunc}>
              Select
            </SelectButton>
          }
          <p>
            {props.select && (isSelected ? 'Selected' : '')}
          </p>

        </CellContainer>
      </Tooltip>
    );
  }




  return (
    <Container key='grid'>
      {props.kamis.map((inv) => Cell(inv))}
    </Container>
  );
}

const Container = styled.div`
  background-color: white;
  display: flex;
  flex-flow: row wrap;
  justify-content: center;
  align-items: flex-start;

  overflow-y: scroll;
`;

const CellContainer = styled.div`
  border: solid .15vw black;
  border-radius: .25vw;

  margin: 0.3vh 0.4vw;
  position: relative;
`;

const Image = styled.img`
  border-radius: .1vw;
  height: 9vw;
  cursor: pointer;

  &:hover {
    opacity: 0.75;
  }
`;

const SelectButton = styled.button`
  position: absolute;
  bottom: 0.5vw;
  right: 0.5vw;
`;