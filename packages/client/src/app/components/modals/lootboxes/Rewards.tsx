import { EntityIndex } from '@mud-classic/recs';
import { ItemIcon } from 'app/components/library';
import { getRarities } from 'constants/rarities';
import styled from 'styled-components';

import { Account } from 'layers/network/shapes/Account';
import { Item } from 'layers/network/shapes/Item';
import { LootboxLog } from 'layers/network/shapes/Lootbox';

interface Props {
  account: Account;
  utils: {
    getItem: (index: number) => Item;
    getLog: (index: EntityIndex) => LootboxLog;
  };
}

export const Rewards = (props: Props) => {
  ///////////////
  // DISPLAY

  const parseItem = (index: number, rarity: number, amount: number) => {
    const item = props.utils.getItem(Number(index));
    return (
      <ItemBox key={index.toString()}>
        <ItemIcon item={item} size='small' glow={getRarities(rarity).color} hoverText={true} />
        <ItemText>x{Number(amount)}</ItemText>
      </ItemBox>
    );
  };

  const ItemsList = () => {
    let list = [];
    // display the latest log for account
    // TODO: display all logs
    const logs = props.account.lootboxLogs?.revealed;
    if (logs && logs.length > 0) {
      const log = props.utils.getLog(logs[logs.length - 1].entityIndex);
      const items = log.droptable.keys;
      const rarities = log.droptable.weights;
      const amounts = log.droptable.results!;

      for (let i = 0; i < items.length; i++) {
        if (amounts[i] > 0) list.push(parseItem(items[i], rarities[i], amounts[i]));
      }
    }

    return <ResultBox>{list}</ResultBox>;
  };

  return (
    <Bound>
      <SubText>You received:</SubText>
      {ItemsList()}
    </Bound>
  );
};

const Bound = styled.div`
  display: flex;
  flex-direction: column;
  justify-content: center;

  height: 90%;
  padding: 2vh 1vw;
`;

const SubText = styled.div`
  font-size: 1vw;
  color: #000;
  text-align: center;
  padding: 0.3vw 0.6vw 0 0.6vw;
  font-family: Pixel;
`;

const ResultBox = styled.div`
  display: flex;
  flex-wrap: wrap;
  flex-direction: row;
  justify-content: center;
  align-items: center;

  margin: 1vw;
`;

const ItemBox = styled.div`
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;

  margin: 1vw;
`;

const ItemText = styled.div`
  font-family: Pixel;
  font-size: 0.8vw;
  color: black;
`;
