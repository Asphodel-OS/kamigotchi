import styled from 'styled-components';

import { Listing } from 'layers/network/shapes/Listing';
import { ItemRow } from './ItemRow';

export interface Props {
  listings: Listing[];
}

export const Listings = (props: Props) => {
  return (
    <List>
      {props.listings &&
        props.listings.map((l) => <ItemRow key={l.entityIndex} listing={l} />)}
    </List>
  );
};

const List = styled.div`
  flex-grow: 1;
  overflow-y: scroll;
  border: 0.15vw solid black;
  display: flex;
  flex-flow: column nowrap;
`;
