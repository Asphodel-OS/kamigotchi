import styled from "styled-components";

import { ItemIcon } from "layers/react/components/library/ItemIcon";
import { Inventory } from "layers/react/shapes/Inventory";
import { dataStore } from "layers/react/store/createStore";

interface Props {
  accountId: string;
  inventories: Inventory[];
};

// get the row of consumable items to display in the player inventory
export const ItemGrid = (props: Props) => {
  const { visibleModals, setVisibleModals } = dataStore();

  const openLootbox = () => {
    setVisibleModals({ ...visibleModals, lootboxes: true, inventory: false });
  }

  const Cell = (inventory: Inventory) => {
    return (
      <ItemIcon
        key={`${inventory.item.index}-${props.accountId}`}
        id={`item-${inventory.item.index}`}
        item={inventory.item}
        size='fixed'
        balance={inventory.balance}
        onClick={inventory.item.type === "LOOTBOX" ? openLootbox : undefined}
        description
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
