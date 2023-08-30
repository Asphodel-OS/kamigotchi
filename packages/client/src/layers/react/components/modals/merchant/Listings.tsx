import styled from 'styled-components';

import { Listing } from 'layers/react/shapes/Listing';
import { ItemRow } from './ItemRow';


export interface Props {
  listings: Listing[];
  handleBuy: (listing: Listing, amt: number) => void;
}

export const Listings = (props: Props) => {
  return (
    <List>
      {props.listings &&
        props.listings.map((l) => (
          <ItemRow listing={l} handleBuy={props.handleBuy} />
        ))}
    </List>
  );
}

const List = styled.div`
  overflow-y: scroll;
  max-height: 100%;
  height: 100%;
  flex-grow: 1;

  border-color: black;
  border-radius: 5px;
  border-style: solid;
  border-width: 2px 2px 0px 2px;

  display: flex;
  flex-flow: column nowrap;
`;