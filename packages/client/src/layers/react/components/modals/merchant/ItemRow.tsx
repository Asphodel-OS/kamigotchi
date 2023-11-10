import styled from 'styled-components';
import { ActionButton } from 'layers/react/components/library/ActionButton';
import { Listing } from 'layers/react/shapes/Listing';
import { dataStore } from 'layers/react/store/createStore';
import { useSelectedEntities } from 'layers/react/store/selectedEntities';
import { Tooltip } from '../../library/Tooltip';


export interface Props {
  listing: Listing;
}

// TODO: support multiple buys
export const ItemRow = (props: Props) => {
  const { visibleModals, setVisibleModals } = dataStore();
  const { setListing } = useSelectedEntities();

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
    <Row key={props.listing.item!.index}>
      <Tooltip text={[props.listing.item!.description]}>
        <Image src={props.listing.item!.image.default} />
      </Tooltip>
      <Name>{props.listing.item!.name}</Name>
      <Price>{props.listing!.buyPrice}</Price>
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
  width: 3.5vw;
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