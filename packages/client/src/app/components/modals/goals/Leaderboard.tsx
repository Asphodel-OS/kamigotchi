import { EntityID } from 'engine/recs';
import styled from 'styled-components';

import { formatFull, getTierColors, Palette } from 'app/components/library/pastel';
import { useSelected, useVisibility } from 'app/stores';
import { Account } from 'network/shapes/Account';
import { Score } from 'network/shapes/Score';
import { playClick } from 'utils/sounds';

const PODIUM = ['gold', 'silver', 'bronze'];

export const Leaderboard = ({
  scores,
  myID,
  unit,
  utils,
}: {
  scores: Score[];
  myID?: EntityID;
  unit: string;
  utils: {
    getAccountByID: (id: EntityID) => Account;
  };
}) => {
  const { getAccountByID } = utils;
  const accountModalOpen = useVisibility((s) => s.modals.account);
  const setModals = useVisibility((s) => s.setModals);
  const setAccount = useSelected((s) => s.setAccount);

  const sorted = [...scores].sort((a, b) => Number(b.value) - Number(a.value));
  const total = sorted.reduce((sum, s) => sum + Number(s.value), 0);

  // open the contributor's account modal
  const handleClick = (account: Account) => {
    setAccount(account.index);
    if (!accountModalOpen) setModals({ account: true });
    playClick();
  };

  if (sorted.length === 0) return <Empty>No contributions yet. Be the first.</Empty>;

  return (
    <Container>
      <HeadRow>
        <span>Rank</span>
        <span>Operator</span>
        <span style={{ textAlign: 'right' }}>Contributed</span>
      </HeadRow>
      {sorted.map((score, i) => {
        const account = getAccountByID(score.holderID);
        const podium = PODIUM[i] ? getTierColors(PODIUM[i]) : undefined;
        const mine = myID !== undefined && score.holderID === myID;
        const share = total > 0 ? ((Number(score.value) / total) * 100).toFixed(1) : '0';
        return (
          <Row key={`${score.holderID}-${i}`} mine={mine} onClick={() => handleClick(account)}>
            <Rank style={podium ? { background: podium.bg, borderColor: podium.edge } : undefined}>
              {i + 1}
            </Rank>
            <Name>
              {account.name}
              {mine && <You>you</You>}
            </Name>
            <Value>
              {formatFull(Number(score.value))} {unit}
              <Share>{share}%</Share>
            </Value>
          </Row>
        );
      })}
    </Container>
  );
};

const Container = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.35vw;
  padding: 0 1.4vw 1vw;
`;

const grid = `
  display: grid;
  grid-template-columns: 3vw minmax(0, 1fr) auto;
  align-items: center;
  gap: 0.8vw;
`;

const HeadRow = styled.div`
  ${grid}
  padding: 0 0.8vw 0.2vw;
  font-family: Pixel;
  font-size: 0.55vw;
  text-transform: uppercase;
  letter-spacing: 0.05vw;
  color: ${Palette.faint};
`;

const Row = styled.div<{ mine: boolean }>`
  ${grid}
  padding: 0.55vw 0.8vw;
  cursor: pointer;
  background: ${({ mine }) => (mine ? Palette.community.bg : Palette.paper)};
  border: solid ${({ mine }) => (mine ? Palette.community.edge : Palette.line)} 0.12vw;
  border-radius: 0.6vw;

  &:hover {
    border-color: ${Palette.ink};
  }
`;

const Rank = styled.span`
  width: 1.9vw;
  height: 1.9vw;
  display: flex;
  align-items: center;
  justify-content: center;
  font-family: Pixel;
  font-size: 0.7vw;
  color: ${Palette.ink};
  background: ${Palette.soft};
  border: solid ${Palette.line} 0.12vw;
  border-radius: 99vw;
`;

const Name = styled.span`
  display: flex;
  align-items: center;
  gap: 0.5vw;
  min-width: 0;
  font-family: Pixel;
  font-size: 0.8vw;
  color: ${Palette.ink};
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

const You = styled.span`
  font-size: 0.5vw;
  color: ${Palette.community.edge};
  border: solid ${Palette.community.edge} 0.1vw;
  border-radius: 99vw;
  padding: 0.1vw 0.35vw;
`;

const Value = styled.span`
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 0.15vw;
  font-family: Pixel;
  font-size: 0.72vw;
  color: ${Palette.ink};
  font-variant-numeric: tabular-nums;
`;

const Share = styled.span`
  font-size: 0.55vw;
  color: ${Palette.faint};
`;

const Empty = styled.div`
  padding: 3vw 1.4vw;
  text-align: center;
  font-family: Pixel;
  font-size: 0.75vw;
  color: ${Palette.muted};
`;
