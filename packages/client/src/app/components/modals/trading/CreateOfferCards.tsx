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
    price,
  } = props;

  let index = item?.index ?? 0;
  let min = 0;
  let max = Infinity;
  let image = item?.image ?? '';

  if (sellToggle) {
    index = item?.item.index ?? 0;
    max = item?.balance ?? 0;
    image = item?.item.image ?? '';
  }

  const handleChange = (e: any, sellToggle: boolean, item: any) => {
    const quantityStr = e.target.value.replaceAll('[^\\d.]', '');
    const rawQuantity = parseInt(quantityStr || '0');
    const quantity = Math.max(min, Math.min(max, rawQuantity));
    if (sellToggle) {
      setItem(item);
      setSellIndices(index);
      setSellAmts(quantity);
    } else {
      setItem(item);
      setBuyIndices(index);
      setBuyAmts(quantity);
    }
  };

  const handlePrice = (e: any, sellToggle: boolean) => {
    let min = 0;
    let max = Infinity;
    const quantityStr = e.target.value.replaceAll('[^\\d.]', '');
    const rawQuantity = parseInt(quantityStr || '0');
    const quantity = Math.max(min, Math.min(max, rawQuantity));
    if (sellToggle) {
      setBuyIndices(MUSU_INDEX);
      setBuyAmts(quantity);
    } else {
      setSellIndices(MUSU_INDEX);
      setSellAmts(quantity);
    }
  };

  return (
    <Content>
      {!price ? (
        <>
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
          X{item ? <Icon src={image} /> : <EmptyIcon />}
        </>
      ) : (
        <>
          <Quantity
            type='string'
            value={sellToggle ? buyAmts.toString() : sellAmts.toString()}
            onChange={(e) => handlePrice(e, sellToggle)}
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
