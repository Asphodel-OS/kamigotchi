import styled from 'styled-components';

import { Listing } from 'layers/react/shapes/Listing';
import { ItemRow } from './ItemRow';


export interface Props {
  listings: Listing[];
}

export const Listings = (props: Props) => {
  return (
    <List>
      {props.listings &&
        props.listings.map((l) => (
          <ItemRow key={l.entityIndex} listing={l} />
        ))}
    </List>
  );
}

const List = styled.div`
  flex-grow: 1;

  border-color: black;
  border-radius: 5px;
  border-style: solid;
  border-width: .15vw .15vw 0px .15vw;

  display: flex;
  flex-flow: column nowrap;
`;