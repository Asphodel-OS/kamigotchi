import { AccountInventories } from "layers/react/shapes/Account";
import { getInventoryByFamilyIndex } from "layers/react/shapes/Inventory";
import { Tooltip } from "../../library/Tooltip";
import styled from "styled-components";
import { FoodImages, ReviveImages } from 'constants/food';
import { Item } from "layers/react/shapes/Item";

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
        <CellGrid key={slot.id}>
          <Icon src={slot.image} />
          <ItemNumber>{slot.inventory?.balance ?? 0}</ItemNumber>
        </CellGrid>
      </Tooltip>
    );
  });

  return <TopGrid>{cells}</TopGrid>;
};


const TopGrid = styled.div`
  border-color: black;
  border-style: solid;
  border-radius: 5px;
  border-width: 2px 0px 2px 2px;
  margin: 5px 2px 5px 2px;

  display: flex;
  flex-direction: row;
`;

const CellGrid = styled.div`
  border-style: solid;
  border-width: 0px 2px 0px 0px;
  border-color: black;
  display: flex;
  flex-direction: row;
`;

const Icon = styled.img`
height: 40px;
padding: 3px;
border-style: solid;
border-width: 0px 2px 0px 0px;
border-color: black;
`;

const ItemNumber = styled.p`
  font-size: 14px;
  font-family: Pixel;

  flex-grow: 1;
  color: #333;
  align-self: center;
  text-align: center;
`;
