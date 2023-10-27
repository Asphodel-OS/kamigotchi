import { EntityID, EntityIndex } from "@latticexyz/recs";
import styled from "styled-components";
import { useEffect, useState } from "react";

import { ActionButton } from "layers/react/components/library/ActionButton";
import { Tooltip } from "layers/react/components/library/Tooltip";
import { Account } from "layers/react/shapes/Account";
import { Inventory } from "layers/react/shapes/Inventory";
import { Lootbox, LootboxLog, getLootboxLog } from "layers/react/shapes/Lootbox";
import { Item } from "layers/react/shapes/Item";
import { FoodImages, ReviveImages } from 'constants/food';

interface Props {
  log: LootboxLog;
  utils: {
    getItem: (index: number) => Item;
  }
}

export const Rewards = (props: Props) => {

  ///////////////
  // TEMP ITEM IMAGES

  // temporary till item images are dynamimcally stored in URI
  const getImage = (item: Item) => {
    switch (item.type) {
      case "FOOD":
        return FoodImages.get(item.familyIndex!);
      case "REVIVE":
        return ReviveImages.get(item.familyIndex!);
      default:
        return;
    }
  }


  ///////////////
  // DISPLAY

  const parseItem = (index: number, amount: number) => {
    const item = props.utils.getItem(Number(index));

    return (
      <tr>
        {/* <TableData><Image src={item.uri!} /></TableData> */}
        <TableData><Image src={getImage(item)} /></TableData>
        <TableData>{item.name!}</TableData>
        <TableData>x{Number(amount)}</TableData>
      </tr>
    )
  }

  const ItemsList = () => {
    const items = props.log?.droptable.keys;
    const amounts = props.log?.droptable.results!;
    let list = [];

    for (let i = 0; i < items.length; i++) {
      if (amounts[i] > 0) list.push(parseItem(items[i], amounts[i]));
    }

    return (
      <ResultTable>
        <tr>
          <TableTitle></TableTitle>
          <TableTitle>Item</TableTitle>
          <TableTitle>Quantity</TableTitle>
        </tr>
        {list}
      </ResultTable>
    )
  }

  return (
    <Bound>
      <SubText>
        You recieved:
      </SubText>
      {ItemsList()}
    </Bound>
  );
}

const Bound = styled.div`
  display: flex;
  flex-direction: column;
  justify-content: center;

  padding: 2vh 1vw;
`;

const Image = styled.img`
  border-style: solid;
  border-width: 0px;
  border-color: black;
  margin: 0px;
  padding: 0px;
`;

const ResultTable = styled.table`
  border-collapse: collapse;

  margin: 1vw;
`

const TableTitle = styled.th`
  font-family: Pixel;
  font-size: 1vw;

  border-style: solid;

  padding: 0.5vw;
`;

const TableData = styled.td`
  font-family: Pixel;
  font-size: 1vw;

  border-style: solid;
  
  padding: 0.5vw;
`;


const SubText = styled.div`
  font-size: 12px;
  color: #000;
  text-align: center;
  padding: 4px 6px 0px 6px;
  font-family: Pixel;
`;
