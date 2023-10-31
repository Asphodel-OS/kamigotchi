import styled from "styled-components";
import { EntityIndex } from "@latticexyz/recs";

import { LootboxLog } from "layers/react/shapes/Lootbox";
import { Item } from "layers/react/shapes/Item";
import { Account } from "layers/react/shapes/Account";

interface Props {
  account: Account;
  utils: {
    getItem: (index: number) => Item;
    getLog: (index: EntityIndex) => LootboxLog;
  }
}

export const Rewards = (props: Props) => {

  ///////////////
  // DISPLAY

  const parseItem = (index: number, amount: number) => {
    const item = props.utils.getItem(Number(index));

    return (
      <tr>
        <TableData><Image src={item!.uri} /></TableData>
        <TableData>{item!.name}</TableData>
        <TableData>x{Number(amount)}</TableData>
      </tr>
    )
  }

  const ItemsList = () => {
    let list = [];
    // display the latest log for account
    // TODO: display all logs
    const logs = props.account.lootboxLogs?.revealed;
    if (logs && logs.length > 0) {
      // console.log(logs)
      const log = props.utils.getLog(logs[logs.length - 1].entityIndex);
      // console.log(log);
      const items = log.droptable.keys;
      const amounts = log.droptable.results!;

      for (let i = 0; i < items.length; i++) {
        if (amounts[i] > 0) list.push(parseItem(items[i], amounts[i]));
      }
    }

    return (
      <ResultTable>
        <thead>
          <tr>
            <TableTitle></TableTitle>
            <TableTitle>Item</TableTitle>
            <TableTitle>Quantity</TableTitle>
          </tr>
        </thead>
        <tbody>
          {list}
        </tbody >
      </ResultTable >
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
