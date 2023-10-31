import styled from "styled-components";

import { FoodImages, ReviveImages } from 'constants/food';
import { Tooltip } from "layers/react/components/library/Tooltip";
import { Inventory } from "layers/react/shapes/Inventory";

interface Props {
  inventories: Inventory[];
};

// get the row of consumable items to display in the player inventory
export const ItemGrid = (props: Props) => {

  const Cell = (inventory: Inventory) => {
    let image: any;

    if (inventory.item.type === 'FOOD') {
      image = FoodImages.get(inventory.item.familyIndex ?? 1);
    } else if (inventory.item.type === 'REVIVE') {
      image = ReviveImages.get(inventory.item.familyIndex ?? 1);
    }

    return (
      <Tooltip key={inventory.id} text={[inventory.item.name]}>
        <Slot>
          <Icon src={image} />
          <Balance>{inventory.balance}</Balance>
        </Slot>
      </Tooltip>
    );
  }

  return (
    <Container key='grid'>
      {props.inventories.map((inv) => Cell(inv))}
    </Container>
  );
};


const Container = styled.div`
  display: flex;
  flex-flow: row wrap;
  justify-content: flex-start;
`;

const Slot = styled.div`
  position: relative;
  border: solid black .15vw;
  border-radius: .5vw;

  width: 5vw;
  height: 5vw;
  margin: .7vw;

  align-items: center;
  justify-content: center;
`;

const Icon = styled.img`
  height: 100%;
  width: 100%;
  padding: .5vw;
`;

const Balance = styled.div` 
  border-top: solid black .15vw;
  border-left: solid black .15vw;
  border-radius: .3vw 0 0 0;

  position: absolute;
  color: black;
  right: 0;
  bottom: 0;
  padding: .2vw;

  font-family: Pixel;
  font-size: .5vw;
`;
