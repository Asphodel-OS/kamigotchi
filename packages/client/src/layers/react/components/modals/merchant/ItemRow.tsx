import styled from 'styled-components';

import { FoodImages, ReviveImages } from 'constants/food';
import { ActionButton } from 'layers/react/components/library/ActionButton';
import { Listing } from 'layers/react/shapes/Listing';
import { Item } from 'layers/react/shapes/Item';
import { dataStore } from 'layers/react/store/createStore';
import { useSelectedEntities } from 'layers/react/store/selectedEntities';


export interface Props {
  listing: Listing;
}

// TODO: support multiple buys
export const ItemRow = (props: Props) => {
  const { visibleModals, setVisibleModals } = dataStore();
  const { setListing } = useSelectedEntities();

  const getImage = (item: Item) => {
    if (item.type == 'FOOD') {
      return FoodImages.get(item.familyIndex);
    } else if (item.type == 'REVIVE') {
      return ReviveImages.get(item.familyIndex);
    }
  }

  const openBuyModal = () => {
    setListing(props.listing.entityIndex);
    setVisibleModals({ ...visibleModals, buy: true });
  }

  const BuyButton = (listing: Listing) => (
    <ActionButton
      id={`button-buy-${listing.item.index}`}
      onClick={openBuyModal}
      text='Buy'
    />
  );

  return (
    <Row key={props.listing.item.index}>
      <Image src={getImage(props.listing.item)} />
      <Name>{props.listing.item.name}</Name>
      <Price>{props.listing.buyPrice}</Price>
      <ButtonWrapper>{BuyButton(props.listing)}</ButtonWrapper>
    </Row>
  );
}

const Row = styled.div`
  border-bottom: .15vw solid black;

  display: flex;
  flex-direction: row nowrap;
  justify-content: space-between;
  align-items: center;
`;

const Image = styled.img`
  border-right: .15vw solid black;
  width: 3vw;
  padding: .3vw;
  font-family: Pixel;
`;

const Name = styled.div`
  padding-left: 1vw;

  color: black;
  font-family: Pixel;
  font-size: .9vw;
  
  text-align: left;
  flex-grow: 1;
`;

const Price = styled.div`
  padding-right: .5vw;

  color: black;
  font-family: Pixel;
  font-size: .9vw;
`;

const ButtonWrapper = styled.div`
  padding: .5vw;
  display: flex;
`;