import styled from "styled-components";

import { ItemIcon } from "layers/react/components/library/ItemIcon";
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
    let onClick = () => { };
    let clickable = false;
    switch (inventory.item.type) {
      case 'LOOTBOX':
        onClick = openLootbox;
        clickable = true;
        break;
      default:
        clickable = false;
        break;
    }

    return (
      <ItemIcon
        key={`inventory-${inventory.item.index}`}
        id={`inventory-${inventory.item.index}`}
        item={inventory.item}
        balance={inventory.balance}
        size='fixed'
        onClick={clickable ? onClick : undefined}
        named
      />
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