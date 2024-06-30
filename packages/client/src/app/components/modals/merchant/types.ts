import { Listing } from 'network/shapes/Listing';

export interface CartItem {
  listing: Listing;
  quantity: number;
}
