import { Listing } from 'layers/network/shapes/Listing';
import { ActionButton } from 'layers/react/components/library';
import { useSelected, useVisibility } from 'layers/react/store';
import styled from 'styled-components';
import { Tooltip } from '../../library';

export interface Props {
  listing: Listing;
}

// TODO: support multiple buys
export const ItemRow = (props: Props) => {
  const { listing } = props;
  const { modals, setModals } = useVisibility();
  const { setListing } = useSelected();

  const openBuyModal = () => {
    setListing(props.listing.entityIndex);
    setModals({ ...modals, buy: true });
  };

  return (
    <Row key={listing.item!.index}>
      <Tooltip text={[listing.item.description ?? '']}>
        <Image src={listing.item!.image} />
      </Tooltip>
      <Name>{listing.item!.name}</Name>
      <Price>{listing!.buyPrice}</Price>
      <ButtonWrapper>
        <ActionButton onClick={openBuyModal} text='Buy' />
      </ButtonWrapper>
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
