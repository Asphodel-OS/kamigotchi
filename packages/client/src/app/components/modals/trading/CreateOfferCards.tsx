import { ItemImages } from 'assets/images/items';
import { MUSU_INDEX } from 'constants/items';
import { BigNumberish } from 'ethers';
import { Dispatch, SetStateAction } from 'react';
import styled from 'styled-components';
interface Props {
  item: any;
  sellAmts: BigNumberish;
  setSellAmts: Dispatch<SetStateAction<BigNumberish>>;
  buyAmts: BigNumberish;
  setBuyAmts: Dispatch<SetStateAction<BigNumberish>>;
  buyIndices: number;
  setBuyIndices: Dispatch<SetStateAction<number>>;
  sellIndices: number;
  setSellIndices: Dispatch<SetStateAction<number>>;
  setItem: Dispatch<SetStateAction<any>>;
  sellToggle: boolean;
  price: boolean;
  max: any;
}

export const CreateOfferCards = (props: Props) => {
  const {
    item,
    sellAmts,
    setSellAmts,
    buyAmts,
    setBuyAmts,
    buyIndices,
    setBuyIndices,
    sellIndices,
    setSellIndices,
    sellToggle,
    price,
    max,
  } = props;

  let index = item?.index ?? 0;
  let min = 0;
  let image = item?.image ?? '';

  const handleChange = (e: any, sellToggle: boolean, price: boolean) => {
    const quantity = Math.max(
      min,
      Math.min(max, parseInt(e.target.value.replaceAll('[^\\d.]', '') || '0'))
    );
    if (price) {
      const targetIndices = sellToggle ? setBuyIndices : setSellIndices;
      const targetAmts = sellToggle ? setBuyAmts : setSellAmts;
      targetIndices(MUSU_INDEX);
      targetAmts(quantity);
    } else {
      const targetIndices = sellToggle ? setSellIndices : setBuyIndices;
      const targetAmts = sellToggle ? setSellAmts : setBuyAmts;
      targetIndices(index);
      targetAmts(quantity);
    }
  };

  return (
    <Content>
      {!price ? (
        <>
          <Quantity
            type='string'
            value={
              sellToggle
                ? sellIndices === index
                  ? sellAmts.toString()
                  : '0'
                : buyIndices === index
                  ? buyAmts.toString()
                  : '0'
            }
            disabled={!item}
            onChange={(e) => item && handleChange(e, sellToggle, false)}
          />
          X{item ? <Icon src={image} /> : <EmptyIcon />}
        </>
      ) : (
        <>
          <Quantity
            type='string'
            value={sellToggle ? buyAmts.toString() : sellAmts.toString()}
            onChange={(e) => handleChange(e, sellToggle, true)}
            disabled={!item}
          />
          X<Icon src={ItemImages.musu} />
        </>
      )}
    </Content>
  );
};

const Content = styled.div`
  display: flex;
  align-items: center;
  gap: 0.3vw;
  margin-top: 0.3vw;
`;

const Quantity = styled.input`
  border: 0.15vw solid black;
  border-radius: 0.4vw;
  width: 4.5vw;
  height: 2.5vw;
  padding: 0.3vw;
  margin: 0w;
  cursor: text;
  color: black;
  font-size: 1.2vw;
  text-align: center;
  &:disabled {
    filter: brightness(0.8);
  }
`;

const Icon = styled.img`
  width: 2.5vw;
  height: 2.5vw;
  padding: 0.3vw;
  image-rendering: pixelated;
  border: 0.15vw solid black;
  border-radius: 0.4vw;
`;

const EmptyIcon = styled.div`
  width: 2.5vw;
  height: 2.5vw;
  padding: 0.3vw;
  border: 0.15vw solid black;
  border-radius: 0.4vw;
`;
