import styled from 'styled-components';

import { ItemIcon } from 'app/components/library';
import { useVisibility } from 'app/stores';
import { Inventory } from 'network/shapes/Inventory';

interface Props {
  inventories: Inventory[];
}

// get the row of consumable items to display in the player inventory
export const ItemGrid = (props: Props) => {
  const { inventories } = props;
  const { modals, setModals } = useVisibility();

  const openLootbox = () => {
    setModals({ ...modals, lootboxes: true, inventory: false });
  };

  /////////////////
  // DISPLAY

  const Cell = (inv: Inventory) => {
    return (
      <ItemIcon
        key={`${inv.item.index}`}
        item={inv.item}
        size='fixed'
        balance={inv.balance}
        onClick={inv.item.type === 'LOOTBOX' ? openLootbox : undefined}
        hoverText={true}
      />
    );
  };

  if (inventories.length === 0) {
    return <EmptyText>Inventory is empty. Go get something.</EmptyText>;
  }
  return <Container key='grid'>{inventories.map((inv) => Cell(inv))}</Container>;
};

const Container = styled.div`
  display: flex;
  flex-flow: row wrap;
  justify-content: flex-start;
`;

const EmptyText = styled.div`
  color: #333;
  padding: 0.7vh 0vw;
  margin: 1.5vh;
  height: 100%;

  font-family: Pixel;
  font-size: 1vw;
  text-align: center;
`;
