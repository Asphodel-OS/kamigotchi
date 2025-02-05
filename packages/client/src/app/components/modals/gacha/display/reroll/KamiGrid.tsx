import styled from 'styled-components';

import { Tooltip } from 'app/components/library';
import { useSelected, useVisibility } from 'app/stores';
import { Kami } from 'network/shapes/Kami';
import { playClick } from 'utils/sounds';

interface Props {
  kamis: Kami[];
  amtShown: number;
  grossShowable: number;
  incAmtShown: () => void;
  getKamiText?: (kami: Kami) => string[];
  select?: {
    arr: Kami[];
    set: (arr: Kami[]) => void;
  };
}

const selectedStyle: any = {
  border: 'solid .15vw #FFF',
  backgroundColor: '#3498DB',
};

export const KamiGrid = (props: Props) => {
  const { modals, setModals } = useVisibility();
  const { kamiIndex, setKami } = useSelected();

  const Cell = (kami: Kami) => {
    let selectedIndex =
      props.select && props.select.arr.length > 0
        ? props.select.arr.findIndex((k) => k.id === kami.id)
        : -1;
    let isSelected = selectedIndex !== -1;

    const selectFunc = () => {
      if (!props.select) return;

      if (isSelected) {
        const newArr = [...props.select.arr];
        newArr.splice(selectedIndex, 1);
        props.select.set(newArr);
      } else {
        const newArr = [...props.select.arr, kami];
        props.select.set(newArr);
      }
    };

    const imageOnClick = () => {
      const sameKami = kamiIndex === kami.index;
      setKami(kami.index);

      if (modals.kami && sameKami) setModals({ kami: false });
      else setModals({ kami: true });
      playClick();
    };

    return (
      <Tooltip key={kami.index} text={props.getKamiText ? props.getKamiText(kami) : []}>
        <CellContainer key={kami.index} id={`grid-${kami.id}`}>
          <Image key='image' onClick={() => imageOnClick()} src={kami.image} />
          {props.select && (
            <SelectButton onClick={selectFunc} style={isSelected ? selectedStyle : {}} />
          )}
        </CellContainer>
      </Tooltip>
    );
  };

  const ShowMoreIcon = props.amtShown < props.grossShowable && (
    <ShowMoreButton key='showMore' onClick={props.incAmtShown}>
      See more
    </ShowMoreButton>
  );

  // finish the list with null items to justify elements in grid
  // because of vw units, always 5 items per row
  const NullItems = () => {
    // total items, add 1 if show more is displayed
    const gross = props.amtShown + (props.amtShown < props.grossShowable ? 1 : 0);
    const remainder = gross % 5 == 0 ? 0 : 5 - (gross % 5);

    return Array(remainder).map((_, i) => <EmptyEntry key={`null-${i}`} />);
  };

  return (
    <Container key='grid'>
      <InnerBox>
        {props.kamis.map((kami) => Cell(kami))}
        {ShowMoreIcon}
        {NullItems()}
      </InnerBox>
    </Container>
  );
};

const Container = styled.div`
  border: solid 0.15vw black;
  border-radius: 0.75vw;
  padding: 2vh 1vw;
  margin: 1vh 2vw;

  height: 100%;
  overflow-y: scroll;
`;

const InnerBox = styled.div`
  display: flex;
  flex-flow: wrap;
  justify-content: center;
  align-items: flex-start;
  overflow-y: scroll;
  height: 100%;
`;

const CellContainer = styled.div`
  border: solid 0.15vw black;
  border-radius: 0.25vw;

  margin: 0.3vh 0.4vw;
  position: relative;
`;

const EmptyEntry = styled.div`
  height: 9vw;
  width: 9.4vw;
  margin: 0.3vh 0.4vw;
`;

const Image = styled.img`
  border-radius: 0.1vw;
  height: 9vw;
  cursor: pointer;

  &:hover {
    opacity: 0.75;
  }
`;

const ShowMoreButton = styled.button`
  background-color: transparent;
  border: dashed 0.15vw #333;
  border-radius: 0.25vw;
  align-self: center;

  margin: 0.3vh 0.4vw;
  padding: 0.3vh 1vw;
  height: 9vw;
  width: 9vw;

  font-family: Pixel;
  font-size: 1.2vw;
  color: black;

  &:hover {
    background-color: #ddd;
  }
`;

const SelectButton = styled.button`
  position: absolute;
  bottom: 0.5vw;
  right: 0.5vw;
  width: 2vw;
  height: 2vw;

  border: solid 0.15vw #333;
  border-radius: 0.4vw;
  opacity: 0.9;

  &:hover {
    background-color: #aaa;
  }
`;
