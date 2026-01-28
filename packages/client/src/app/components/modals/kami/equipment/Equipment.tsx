import { useMemo } from 'react';
import styled from 'styled-components';

import { filterInventories, Inventory } from 'app/cache/inventory';
import {
  IconListButton,
  IconListButtonOption,
  ItemTooltip,
  TextTooltip,
} from 'app/components/library';
import { Allo } from 'network/shapes/Allo';
import { Item } from 'network/shapes/Item';
import { DetailedEntity } from 'network/shapes/utils';
import { getItemImage } from 'network/shapes/utils/images';
import { playClick } from 'utils/sounds';

type SlotKey = 'Head_Slot' | 'Body_Slot' | 'Hands_Slot' | 'Passport_slot' | 'Kami_Pet_Slot';
const SLOT_LABELS: Record<SlotKey, string> = {
  Head_Slot: 'Head',
  Body_Slot: 'Body',
  Hands_Slot: 'Hands',
  Passport_slot: 'Passport',
  Kami_Pet_Slot: 'Pet',
};
const EQUIPMENT_SLOTS: SlotKey[] = ['Head_Slot', 'Body_Slot', 'Hands_Slot'];
const ACCESSORY_SLOTS: SlotKey[] = ['Passport_slot', 'Kami_Pet_Slot'];
const AVAILABLE_SLOTS: SlotKey[] = ['Kami_Pet_Slot'];

export interface EquipmentActions {
  equip: (itemIndex: number, itemName: string) => void;
  unequip: (slot: string, itemName: string) => void;
}

export interface EquipmentUtils {
  displayRequirements: (item: Item) => string;
  parseAllos: (allo: Allo[]) => DetailedEntity[];
}

export const Equipment = ({
  inventories,
  equipped = {},
  capacity = 1,
  actions,
  isResting = true,
  utils,
}: {
  inventories: Inventory[];
  equipped?: Record<string, Inventory | null>;
  capacity?: number;
  actions?: EquipmentActions;
  isResting?: boolean;
  utils?: EquipmentUtils;
}) => {
  ////////////////////
  // INTERPRETATION

  const equippedCount = Object.values(equipped).filter(Boolean).length;
  const isAtCapacity = equippedCount >= capacity;
  const restingTooltip = { text: ['Kami must be resting.'] };

  const equipmentBonuses = useMemo(() => {
    if (!utils) return [];
    return Object.values(equipped)
      .filter(Boolean)
      .flatMap((inv) =>
        utils.parseAllos(inv!.item.effects?.use ?? []).map((entity) => ({
          source: inv!.item.name,
          text: entity.description ?? '',
        }))
      );
  }, [equipped, utils]);

  ////////////////////
  // INTERACTION

  const handleEquip = (inv: Inventory) => {
    playClick();
    actions?.equip(inv.item.index, inv.item.name);
  };

  const handleUnequip = (slot: SlotKey) => {
    playClick();
    actions?.unequip(slot, equipped[slot]?.item.name ?? slot);
  };

  ////////////////////
  // DISPLAY

  const getSlotOptions = (slot: SlotKey): IconListButtonOption[] =>
    filterInventories(inventories, 'EQUIPMENT', slot).map((inv) => ({
      text: inv.item.name,
      image: inv.item.image,
      onClick: () => handleEquip(inv),
    }));

  const renderSlot = (slot: SlotKey) => {
    const equippedItem = equipped[slot];
    const options = getSlotOptions(slot);
    const isAvailable = AVAILABLE_SLOTS.includes(slot);

    if (equippedItem) {
      const itemTooltip = utils
        ? {
            text: [<ItemTooltip key={slot} item={equippedItem.item} utils={utils} />],
            maxWidth: 25,
          }
        : undefined;

      return (
        <FilledSlotWrapper>
          <IconListButton
            img={equippedItem.item.image}
            options={options}
            scale={3}
            radius={0.5}
            disabled={!isResting}
            tooltip={isResting ? itemTooltip : restingTooltip}
          />
          {isResting && <RemoveButton onClick={() => handleUnequip(slot)}>X</RemoveButton>}
        </FilledSlotWrapper>
      );
    }

    const getTooltip = () => {
      if (!isAvailable) return { text: ['This slot is not available yet.'] };
      if (!isResting) return restingTooltip;
      if (!options.length) return { text: ['No items compatible with this slot.'] };
      return undefined;
    };

    return (
      <IconListButton
        text='+'
        options={options}
        scale={3}
        radius={0.5}
        disabled={!isAvailable || !options.length || !actions || isAtCapacity || !isResting}
        tooltip={getTooltip()}
      />
    );
  };

  ////////////////////
  // RENDER

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
            {equipmentBonuses.length > 0 ? (
              equipmentBonuses.map((bonus, i) => (
                <TextTooltip key={i} text={[bonus.text]}>
                  <BuffIcon src={getItemImage(bonus.source)} />
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
        <InventoryText>
          {equippedCount}/{capacity}
        </InventoryText>
      </InventoryBar>
    </Wrapper>
  );
};

const Wrapper = styled.div`
  display: flex;
  flex-direction: column;
  padding: 0.7vw;
  user-select: none;
  align-items: center;
`;

const ColumnsContainer = styled.div`
  display: flex;
  flex-direction: row;
  gap: 1.5vw;
  width: 100%;
`;

const Column = styled.div`
  display: flex;
  flex-direction: column;
  flex: 1;
  width: 100%;
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

const FilledSlotWrapper = styled.div`
  position: relative;
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
  z-index: 2;
  &:hover {
    background-color: #ddd;
    scale: 1.1;
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
  padding: 0.5vw;
  border: solid black 0.15vw;
  border-radius: 0.5vw;
  width: 100%;
`;

const InventoryIcon = styled.span`
  font-size: 1.5vw;
  margin-right: 0.5vw;
`;

const InventoryText = styled.div`
  font-size: 1.2vw;
  color: black;
`;
