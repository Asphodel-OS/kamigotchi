import styled from "styled-components";

import { FoodImages, ReviveImages } from 'constants/food';
import { Tooltip } from "layers/react/components/library/Tooltip";
import { AccountInventories } from "layers/react/shapes/Account";
import { getInventoryByFamilyIndex } from "layers/react/shapes/Inventory";

interface Props {
  inventories: AccountInventories;
};

// get the row of consumable items to display in the player inventory
export const Items = (props: Props) => {
  const inventorySlots = [
    {
      id: 1,
      image: FoodImages.get(1),
      text: ['Gum', 'Restores 25 health.'],
      inventory: getInventoryByFamilyIndex(props.inventories?.food, 1),
    },
    {
      id: 2,
      image: FoodImages.get(2),
      text: ['PomPom', 'Restores 100 health.'],
      inventory: getInventoryByFamilyIndex(props.inventories?.food, 2),
    },
    {
      id: 3,
      image: FoodImages.get(3),
      text: ['Gakki', 'Restores 200 health.'],
      inventory: getInventoryByFamilyIndex(props.inventories?.food, 3),
    },
    {
      id: 4,
      image: ReviveImages.get(1),
      text: ['Ribbon', 'Revives a fallen Kami.'],
      inventory: getInventoryByFamilyIndex(props.inventories?.revives, 1),
    },
  ];

  const cells = inventorySlots.map((slot, i) => {
    return (
      <Tooltip key={slot.id} text={slot.text} grow>
        <CellGrid>
          <Icon src={slot.image} />
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
