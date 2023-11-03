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
          <IconClickable src={inv.item.image.default} onClick={foo} />
        );
      } else {
        return (
          <Icon src={inv.item.image.default} />
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
  border: solid black 1.5px;
  border-radius: 4px;

  margin: 5px;

  align-items: center;
  justify-content: center;
  overflow: hidden;
`;

const Icon = styled.img`
  height: 50px;
  width: 50px;
  padding: 5px;
`;

const IconClickable = styled.img`
  height: 50px;
  width: 50px;
  padding: .5vw;

    &:hover {
    background-color: #BBB;
  }
`;

const Balance = styled.div` 
  border-top: solid black 1.25px;
  border-left: solid black 1.25px;
  border-radius: 2.5px 0 0 0;
  background-color: #FFF;

  position: absolute;
  color: black;
  right: 0;
  bottom: 0;
  padding: 2px;

  font-family: Pixel;
  font-size: 8px;
`;
