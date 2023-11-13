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

  if (props.inventories.length === 0) {
    return (
      <EmptyText>
        Inventory is empty
      </EmptyText>
    );
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

const EmptyText = styled.div`
  font-family: Pixel;
  font-size: 1vw;
  text-align: center;
  color: #333;
  padding: 0.7vh 0vw;

  margin: 1.5vh;

  height: 100%;
`;