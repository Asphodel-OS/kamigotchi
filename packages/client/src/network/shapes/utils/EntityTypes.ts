import { EntityID, EntityIndex } from '@mud-classic/recs';
import { ItemImages } from 'assets/images/items';
import { Inventory } from '../Item';

// base shape of an entity with basic details
export interface DetailedEntity {
  ObjectType: string;
  image: string;
  name: string;
  description?: string;
}

// TODO: move Gacha ticket shapes to Item/
export const GachaTicket: DetailedEntity = {
  ObjectType: 'GACHA_TICKET',
  image: ItemImages['gacha_ticket'],
  name: 'Gacha Ticket',
  description: 'Redeemable for one Kami. You should take this to the vending machine…',
};

export const GachaTicketInventory: Inventory = {
  id: '0x00' as EntityID,
  entityIndex: 0 as EntityIndex,
  item: {
    ...GachaTicket,
    id: '0x00' as EntityID,
    entityIndex: 0 as EntityIndex,
    index: 0,
    type: 'GACHA_TICKET',
    is: { consumable: false, lootbox: false },
    for: 'ACCOUNT',
  },
  balance: 0,
};
