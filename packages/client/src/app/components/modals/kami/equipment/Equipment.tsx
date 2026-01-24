import styled from 'styled-components';

import { filterInventories, Inventory } from 'app/cache/inventory';
import { IconListButton, IconListButtonOption, TextTooltip } from 'app/components/library';
import { BonusInstance, parseBonusText } from 'network/shapes/Bonus';
import { getItemImage } from 'network/shapes/utils/images';
import { playClick } from 'utils/sounds';

type SlotKey =
  | 'Kami_Head_Slot'
  | 'Kami_Body_Slot'
  | 'Kami_Hands_Slot'
  | 'Kami_Passport_Slot'
  | 'Kami_Pet_Slot';

const SLOT_LABELS: Record<SlotKey, string> = {
  Kami_Head_Slot: 'Head',
  Kami_Body_Slot: 'Body',
  Kami_Hands_Slot: 'Hands',
  Kami_Passport_Slot: 'Passport',
  Kami_Pet_Slot: 'Pet',
};

const EQUIPMENT_SLOTS: SlotKey[] = ['Kami_Head_Slot', 'Kami_Body_Slot', 'Kami_Hands_Slot'];
const ACCESSORY_SLOTS: SlotKey[] = ['Kami_Passport_Slot', 'Kami_Pet_Slot'];

export interface EquipmentActions {
  equip: (itemIndex: number) => void;
  unequip: (slot: string) => void;
}

export const Equipment = ({
  inventories,
  bonuses = [],
  equipped = {},
  capacity = 1,
  actions,
}: {
  inventories: Inventory[];
  bonuses?: BonusInstance[];
  equipped?: Record<string, Inventory | null>;
  capacity?: number;
  actions?: EquipmentActions;
}) => {
  const handleEquip = (inv: Inventory) => {
    playClick();
    actions?.equip(inv.item.index);
  };

  const handleUnequip = (slot: SlotKey) => {
    playClick();
    actions?.unequip(slot);
  };

  const getSlotOptions = (slot: SlotKey): IconListButtonOption[] => {
    const filtered = filterInventories(inventories, 'EQUIPMENT', slot);
    return filtered.map((inv) => ({
      text: inv.item.name,
      image: inv.item.image,
      onClick: () => handleEquip(inv),
    }));
  };

  const equippedCount = Object.values(equipped).filter(Boolean).length;
  const isAtCapacity = equippedCount >= capacity;

  const renderSlot = (slot: SlotKey) => {
    const equippedItem = equipped[slot] ?? null;
    const options = getSlotOptions(slot);

    if (equippedItem) {
      return (
        <FilledSlot>
          {equippedItem.item.image && <ItemImage src={equippedItem.item.image} />}
          <RemoveButton onClick={() => handleUnequip(slot)}>X</RemoveButton>
        </FilledSlot>
      );
    }
    return (
      <IconListButton
        text='+'
        options={options}
        scale={3}
        radius={0.5}
        disabled={options.length === 0 || !actions || isAtCapacity}
      />
    );
  };

  return (
    <Wrapper>
      <ColumnsContainer>
        <Column>
          <ColumnHeader>Equipment</ColumnHeader>
          {EQUIPMENT_SLOTS.map((slot) => (
            <SlotRow key={slot}>
              <SlotLabel>{SLOT_LABELS[slot]}</SlotLabel>
              {renderSlot(slot)}
            </SlotRow>
          ))}
        </Column>
        <Column>
          <ColumnHeader>Accessories</ColumnHeader>
          {ACCESSORY_SLOTS.map((slot) => (
            <SlotRow key={slot}>
              <SlotLabel>{SLOT_LABELS[slot]}</SlotLabel>
              {renderSlot(slot)}
            </SlotRow>
          ))}
          <SlotRow>
            <SlotLabel>Effects</SlotLabel>
            {bonuses.length > 0 ? (
              bonuses.map((bonus, i) => (
                <TextTooltip key={i} text={[parseBonusText(bonus)]}>
                  <BuffIcon src={getItemImage(bonus.source?.name ?? '')} />
                </TextTooltip>
              ))
            ) : (
              <EmptyEffects>No active effects</EmptyEffects>
            )}
          </SlotRow>
        </Column>
      </ColumnsContainer>
      <InventoryBar>
        <InventoryIcon>📦</InventoryIcon>
        <InventoryText>{equippedCount}/{capacity}</InventoryText>
      </InventoryBar>
    </Wrapper>
  );
};

const Wrapper = styled.div`
  display: flex;
  flex-direction: column;
  padding: 0.7vw;
  user-select: none;
`;

const ColumnsContainer = styled.div`
  display: flex;
  flex-direction: row;
  gap: 1.5vw;
`;

const Column = styled.div`
  display: flex;
  flex-direction: column;
  flex: 1;
`;

const ColumnHeader = styled.div`
  font-size: 1vw;
  font-weight: bold;
  color: black;
  padding: 0.5vw;
  margin-bottom: 0.5vw;
`;

const SlotRow = styled.div`
  display: flex;
  flex-direction: row;
  align-items: center;
  margin-bottom: 0.7vw;
  border: solid black 0.15vw;
  border-radius: 0.5vw;
  padding: 0.5vw;
  gap: 0.5vw;
  min-height: 5vw;
`;

const SlotLabel = styled.div`
  position: relative;
  font-size: 1.2vw;
  color: black;
  padding: 0.3vw;
`;

const FilledSlot = styled.div`
  position: relative;
  width: 3vw;
  height: 3vw;
  border: solid black 0.15vw;
  border-radius: 0.5vw;
  background-color: white;
  display: flex;
  align-items: center;
  justify-content: center;
`;

const ItemImage = styled.img`
  width: 2.5vw;
  height: 2.5vw;
  object-fit: contain;
`;

const RemoveButton = styled.div`
  position: absolute;
  top: -0.5vw;
  right: -0.5vw;
  width: 1.2vw;
  height: 1.2vw;
  border: solid black 0.1vw;
  border-radius: 50%;
  background-color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.8vw;
  cursor: pointer;
  &:hover {
    background-color: #ddd;
  }
  &:active {
    background-color: #bbb;
  }
`;

const BuffIcon = styled.img`
  width: 2.5vw;
  height: 2.5vw;
  border: solid black 0.15vw;
  border-radius: 0.5vw;
  object-fit: contain;
`;

const EmptyEffects = styled.div`
  font-size: 0.9vw;
  color: #888;
`;

const InventoryBar = styled.div`
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: center;
  margin-top: 1vw;
  padding: 0.5vw;
  border: solid black 0.15vw;
  border-radius: 0.5vw;
`;

const InventoryIcon = styled.span`
  font-size: 1.5vw;
  margin-right: 0.5vw;
`;

const InventoryText = styled.div`
  font-size: 1.2vw;
  color: black;
`;
