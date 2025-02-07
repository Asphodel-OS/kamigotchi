import { Tooltip } from 'app/components/library';
import { BigNumberish } from 'ethers';
import { Dispatch, SetStateAction } from 'react';
import styled from 'styled-components';
import { playClick } from 'utils/sounds';
interface Props {
  item: any;
  offer: boolean;
  sellAmts: BigNumberish;
  setSellAmts: Dispatch<SetStateAction<BigNumberish>>;
  buyAmts: BigNumberish;
  setBuyAmts: Dispatch<SetStateAction<BigNumberish>>;
  buyIndices: number;
  setBuyIndices: Dispatch<SetStateAction<number>>;
  sellIndices: number;
  setSellIndices: Dispatch<SetStateAction<number>>;
  setBuyItem: Dispatch<SetStateAction<any>>;
  reset: () => void;
}

export const CreateOfferCards = (props: Props) => {
  const {
    item,
    offer,
    sellAmts,
    setSellAmts,
    buyAmts,
    setBuyAmts,
    buyIndices,
    setBuyIndices,
    sellIndices,
    setSellIndices,
    setBuyItem,
    reset,
  } = props;

  let name = item.name;
  let image = item.image;
  let index = item.index;
  let min = 0;
  let max = Infinity;

  if (offer) {
    name = item.item.name;
    image = item.item.image;
    index = item.item.index;
    max = item.balance;
  }

  const handleChange = (e: any, offer: boolean, item: any) => {
    const quantityStr = e.target.value.replaceAll('[^\\d.]', '');
    const rawQuantity = parseInt(quantityStr || '0');
    const quantity = Math.max(min, Math.min(max, rawQuantity));

    if (offer) {
      setSellIndices(index);
      setSellAmts(quantity);
    } else {
      setBuyItem(item);
      setBuyIndices(index);
      setBuyAmts(quantity);
    }
  };

  const handleInc = () => {
    playClick();
    if (offer) {
      const amt = Math.min(max, Number(sellAmts) + 1);
      if (amt === 1) setSellIndices(index);
      setSellAmts(amt);
    } else {
      const amt = Math.min(max, Number(buyAmts) + 1);
      if (amt === 1) setBuyIndices(index);
      setBuyAmts(amt);
    }
  };
  // BigNumber.from(1).add(buyAmts).toNumber())

  const handleDec = () => {
    playClick();
    if (offer) {
      const amt = Math.max(min, Number(sellAmts) - 1);
      if (amt === 0) setSellIndices(0);
      setSellAmts(amt);
    } else {
      const amt = Math.max(min, Number(buyAmts) - 1);
      if (amt === 0) setBuyIndices(0);
      setBuyAmts(amt);
    }
  };
  console.log(`sellAmts ${sellAmts} buyAmts ${buyAmts}`);
  const isDisabled = () => {
    if (offer) return sellIndices !== 0 && sellIndices !== index;
    else return buyIndices !== 0 && buyIndices !== index;
  };

  return (
    <Container>
      <Tooltip text={[name ?? '']}>
        <Image src={image} />
      </Tooltip>
      <Quantity
        type='string'
        value={
          offer
            ? sellIndices === index
              ? sellAmts.toString()
              : '0'
            : buyIndices === index
              ? buyAmts.toString()
              : '0'
        }
        onChange={(e) => handleChange(e, offer, item)}
        disabled={isDisabled()}
      />
      <Stepper>
        <StepperButton
          onClick={() => handleInc()}
          style={{ borderBottom: '0.15vw solid black' }}
          disabled={isDisabled()}
        >
          +
        </StepperButton>
        <StepperButton onClick={() => handleDec()} disabled={isDisabled()}>
          -
        </StepperButton>
      </Stepper>
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
  margin-top: 0.2vw;
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

const StepperButton = styled.button`
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
