import { EntityID, EntityIndex } from '@mud-classic/recs';
import { baseURI } from 'constants/media';
import { Inventory } from '../Inventory';

// base shape of an entity with basic details
export interface DetailedEntity {
  ObjectType: string;
  image: string;
  image4x?: string;
  name: string;
  description?: string;
}

export const GachaTicket: DetailedEntity = {
  ObjectType: 'GACHA_TICKET',
  image: baseURI + 'images/items/gacha_ticket.png',
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
  },
};
