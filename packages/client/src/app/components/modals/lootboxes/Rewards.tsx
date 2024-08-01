import { ItemIcon } from 'app/components/library';
import { getRarities } from 'constants/rarities';
import styled from 'styled-components';

import { Account } from 'network/shapes/Account';
import { DTResult } from 'network/shapes/Droptable';
import { LootboxLog } from 'network/shapes/Lootbox';

interface Props {
  account: Account;
  log: LootboxLog;
}

export const Rewards = (props: Props) => {
  ///////////////
  // DISPLAY

  const parseItem = (entry: DTResult) => {
    const item = entry.object;
    return (
      <ItemBox key={item.name.toString()}>
        <ItemIcon
          item={item}
          size='small'
          glow={getRarities(entry.rarity).color}
          hoverText={true}
        />
        <ItemText>x{Number(entry.amount)}</ItemText>
      </ItemBox>
    );
  };

  return (
    <Bound>
      <SubText>You received:</SubText>
      <ResultBox>{props.log.results.map(parseItem)}</ResultBox>
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
