import styled from 'styled-components';

import { ItemIcon } from 'app/components/library';
import { useVisibility } from 'app/stores';
import { Inventory } from 'layers/network/shapes/Inventory';

interface Props {
  inventories: Inventory[];
}

// get the row of consumable items to display in the player inventory
export const ItemGrid = (props: Props) => {
  const { modals, setModals } = useVisibility();

  const openLootbox = () => {
    setModals({ ...modals, lootboxes: true, inventory: false });
  };

  if (props.inventories.length === 0) {
    return <EmptyText>Inventory is empty. Go get something.</EmptyText>;
  }

  const Cell = (inventory: Inventory) => {
    return (
      <ItemIcon
        key={`${inventory.id}`}
        item={inventory.item}
        size='fixed'
        balance={inventory.balance}
        onClick={inventory.item.type === 'LOOTBOX' ? openLootbox : undefined}
        hoverText={true}
      />
    );
  };

  return <Container key='grid'>{props.inventories.map((inv) => Cell(inv))}</Container>;
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
