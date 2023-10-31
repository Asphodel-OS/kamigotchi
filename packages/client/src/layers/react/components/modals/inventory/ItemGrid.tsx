import styled from "styled-components";

import { Tooltip } from "layers/react/components/library/Tooltip";
import { Inventory } from "layers/react/shapes/Inventory";
import { dataStore } from "layers/react/store/createStore";

interface Props {
  inventories: Inventory[];
};

// get the row of consumable items to display in the player inventory
export const ItemGrid = (props: Props) => {

  const { visibleModals, setVisibleModals } = dataStore();

  const openLootbox = () => {
    setVisibleModals({ ...visibleModals, lootboxes: true, inventory: false });
  }

  const Cell = (inventory: Inventory) => {
    const ImgButton = (inv: Inventory) => {
      let foo = () => { };
      let clickable = false;
      switch (inv.item.type) {
        case 'LOOTBOX':
          foo = openLootbox;
          clickable = true;
          break;
        default:
          clickable = false;
          break;
      }

      if (clickable) {
        return (
          <IconClickable src={inv.item.uri} onClick={foo} />
        );
      } else {
        return (
          <Icon src={inv.item.uri} />
        );
      }
    }


    return (
      <Tooltip key={inventory.id} text={[inventory.item.name]}>
        <Slot>
          {ImgButton(inventory)}
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

const IconClickable = styled.img`
  height: 100%;
  width: 100%;
  padding: .5vw;

    &:hover {
    background-color: #BBB;
  }
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
