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
    setItem,
    sellToggle,
  } = props;

  let index = item?.index ?? 0;
  let min = 0;
  let max = Infinity;

  if (sellToggle) {
    index = item?.item.index ?? 0;
    max = item?.balance ?? 0;
  }

  const handleChange = (e: any, sellToggle: boolean, item: any) => {
    const quantityStr = e.target.value.replaceAll('[^\\d.]', '');
    const rawQuantity = parseInt(quantityStr || '0');
    const quantity = Math.max(min, Math.min(max, rawQuantity));
    if (sellToggle) {
      //setItem(item);
      setSellIndices(index);
      setSellAmts(quantity);
    } else {
      //setItem(item);
      setBuyIndices(index);
      setBuyAmts(quantity);
    }
  };

  return (
    <Quantity
      type='string'
      value={
        item
          ? sellToggle
            ? sellIndices === index
              ? sellAmts.toString()
              : '0'
            : buyIndices === index
              ? buyAmts.toString()
              : '0'
          : '0'
      }
      disabled={!item}
      onChange={(e) => item && handleChange(e, sellToggle, item)}
    />
  );
};

const Quantity = styled.input`
  border: 0.15vw solid black;
  border-radius: 0.4vw;
  width: 4.5vw;
  height: 100%;
  padding: 0.3vw;
  margin: 0w;
  cursor: text;
  color: black;
  font-size: 1.2vw;
  text-align: center;
`;
