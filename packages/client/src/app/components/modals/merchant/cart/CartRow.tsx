import styled from 'styled-components';

import { calcBuyPrice } from 'app/cache/npc/functions';
import { Tooltip } from 'app/components/library';
import { ItemImages } from 'assets/images/items';
import { Listing } from 'network/shapes/Listing';
import { playClick } from 'utils/sounds';

export interface Props {
  listing: Listing;
  quantity: number;
  setQuantity: (quantity: number) => void;
  remove: () => void;
}

// TODO: support multiple buys
export const CartRow = (props: Props) => {
  const { listing, quantity, setQuantity, remove } = props;
  const max = 100;
  const min = 0;

  const handleRemove = () => {
    playClick();
    remove();
  };

  const handleInc = () => {
    playClick();
    setQuantity(Math.min(max, quantity + 1));
  };

  const handleDec = () => {
    playClick();
    setQuantity(Math.max(min, quantity - 1));
  };

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const quantityStr = event.target.value.replaceAll('[^\\d.]', '');
    const rawQuantity = parseInt(quantityStr || '0');
    const quantity = Math.max(min, Math.min(max, rawQuantity));
    setQuantity(quantity);
  };

  return (
    <Container key={listing.item.index}>
      <ExitButton onClick={handleRemove}> x </ExitButton>
      <Tooltip text={[listing.item.description ?? '']}>
        <Image src={listing.item.image} />
      </Tooltip>
      <Quantity type='string' value={quantity.toString()} onChange={(e) => handleChange(e)} />
      <Stepper>
        <StepperButton onClick={handleInc} style={{ borderBottom: '0.15vw solid black' }}>
          +
        </StepperButton>
        <StepperButton onClick={handleDec}>-</StepperButton>
      </Stepper>
      <TotalPrice>
        <Icon src={ItemImages.musu} />
        <Text>{calcBuyPrice(listing, quantity)}</Text>
      </TotalPrice>
    </Container>
  );
};

const Container = styled.div`
  position: relative;
  border: 0.15vw solid black;
  border-radius: 0.4vw;
  width: 100%;

  display: flex;
  flex-direction: row nowrap;
  align-items: center;
`;

// circular exit button on the top right of the Container
const ExitButton = styled.div`
  position: absolute;
  border: 0.15vw solid black;
  border-radius: 0.6vw;
  background-color: #fff;
  cursor: pointer;

  width: 1.2vw;
  height: 1.2vw;
  top: -0.4vw;
  right: -0.4vw;

  color: black;
  font-family: Pixel;
  font-size: 0.9vw;
  text-align: center;

  &:hover {
    background-color: #ddd;
  }
  &:active {
    background-color: #bbb;
  }
`;

const Image = styled.img`
  width: 3vw;
  padding: 0.3vw;
  font-family: Pixel;
  image-rendering: pixelated;
`;

const Quantity = styled.input`
  border: none;
  background-color: #eee;
  border-right: 0.15vw solid black;
  border-left: 0.15vw solid black;
  width: 4.5vw;
  height: 100%;
  padding: 0.3vw;
  margin: 0w;
  cursor: text;

  color: black;
  font-family: Pixel;
  font-size: 1.2vw;
  text-align: center;
`;

const Stepper = styled.div`
  border-right: 0.15vw solid black;
  height: 100%;
  width: 3vw;
  display: flex;
  flex-flow: column nowrap;
`;

const StepperButton = styled.div`
  background-color: #fff;
  height: 100%;
  width: 100%;

  cursor: pointer;
  pointer-events: auto;
  user-select: none;

  color: black;
  font-family: Pixel;
  font-size: 1.2vw;
  line-height: 1.5vw;
  text-align: center;

  &:hover {
    background-color: #ddd;
  }
  &:active {
    background-color: #bbb;
  }
`;

const TotalPrice = styled.div`
  height: 100%;
  padding: 0 0.6vw;
  display: flex;
  flex-flow: row nowrap;
  justify-content: space-between;
  align-items: center;
  flex-grow: 1;
`;

const Icon = styled.img`
  width: 1.5vw;
  height: 1.5vw;
  margin-right: 0.3vw;
`;

const Text = styled.div`
  color: black;
  font-family: Pixel;
  font-size: 0.9vw;

  display: flex;
  flex-flow: row nowrap;
  align-items: center;
`;
