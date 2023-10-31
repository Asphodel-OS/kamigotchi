import styled from "styled-components";

import { Tooltip } from "layers/react/components/library/Tooltip";
import { getInventoryByFamilyIndex } from "layers/react/shapes/Inventory";
import { Inventories } from "layers/react/shapes/Account";
import { Item } from "layers/react/shapes/Item";

interface Props {
  inventories: Inventories;
  getItem: (index: number) => Item;
};

// get the row of consumable items to display in the player inventory
export const Items = (props: Props) => {
  const inventorySlots = [
    {
      item: props.getItem(1),
      inventory: getInventoryByFamilyIndex(props.inventories?.food, 1),
    },
    {
      item: props.getItem(2),
      inventory: getInventoryByFamilyIndex(props.inventories?.food, 2),
    },
    {
      item: props.getItem(3),
      inventory: getInventoryByFamilyIndex(props.inventories?.food, 3),
    },
    {
      item: props.getItem(1001),
      inventory: getInventoryByFamilyIndex(props.inventories?.revives, 1),
    },
  ];

  const cells = inventorySlots.map((slot, i) => {
    return (
      <Tooltip text={[slot.item.name!, slot.item.description!]} grow>
        <CellGrid>
          <Icon src={slot.item.uri!} />
          <ItemNumber>{slot.inventory?.balance ?? 0}</ItemNumber>
        </CellGrid>
      </Tooltip>
    );
  });

  return <TopGrid key='top-grid'>{cells}</TopGrid>;
};


const TopGrid = styled.div`
  border: solid black .15vw;
  border-right: 0;
  border-radius: 5px;
  
  width: 86.5%;
  margin: .7vw;

  display: flex;
  flex-flow: row nowrap;
`;

const CellGrid = styled.div`
  border-right: solid black .15vw;
  display: flex;
  flex-flow: row nowrap;
`;

const Icon = styled.img`
  border-right: solid black .15vw;
  height: 2.5vw;
  padding: .2vw;
`;

const ItemNumber = styled.p`
  font-size: 1vw;
  font-family: Pixel;

  flex-grow: 1;
  color: #333;
  align-self: center;
  text-align: center;
`;
