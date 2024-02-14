import { Listing } from 'layers/network/shapes/Listing';
import { ActionButton } from 'layers/react/components/library/ActionButton';
import { useSelected } from 'layers/react/store/selected';
import { useVisibility } from 'layers/react/store/visibility';
import styled from 'styled-components';
import { Tooltip } from '../../library/Tooltip';

export interface Props {
  listing: Listing;
}

// TODO: support multiple buys
export const ItemRow = (props: Props) => {
  const { modals, setModals } = useVisibility();
  const { setListing } = useSelected();

  const openBuyModal = () => {
    setListing(props.listing.entityIndex);
    setModals({ ...modals, buy: true });
  };

  const BuyButton = (listing: Listing) => (
    <ActionButton id={`button-buy-${listing.item.index}`} onClick={openBuyModal} text='Buy' />
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
};

const Row = styled.div`
  border-bottom: 0.15vw solid black;

  display: flex;
  flex-direction: row nowrap;
  justify-content: space-between;
  align-items: center;
`;

const Image = styled.img`
  border-right: 0.15vw solid black;
  width: 3.5vw;
  padding: 0.3vw;
  font-family: Pixel;
`;

const Name = styled.div`
  padding-left: 1vw;

  color: black;
  font-family: Pixel;
  font-size: 0.9vw;

  text-align: left;
  flex-grow: 1;
`;

const Price = styled.div`
  padding-right: 0.5vw;

  color: black;
  font-family: Pixel;
  font-size: 0.9vw;
`;

const ButtonWrapper = styled.div`
  padding: 0.5vw;
  display: flex;
`;
