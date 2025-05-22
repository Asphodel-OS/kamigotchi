import styled from 'styled-components';

import { KamiIcon, OperatorIcon } from 'assets/images/icons/menu';
import { Room } from 'network/shapes/Room';
import { getAffinityImage } from 'network/shapes/utils';

interface Props {
  room: Room;
  rolls: Map<number, number>;
  kamiIconsMap: Map<number, string[]>;
  getNode: (index: number) => any;
  parseAllos: (scavAllo: any[]) => any[];
  playerEntitiesLength: number;
  kamiEntitiesLength: number;
  friendsCount: number;
}

export const GridTooltip = (props: Props) => {
  const {
    room,
    rolls,
    kamiIconsMap,
    getNode,
    parseAllos,
    playerEntitiesLength,
    kamiEntitiesLength,
    friendsCount,
  } = props;

  if (!room.index) return null;

  const node = getNode(room.index);
  const drops = node.drops ?? [];
  const rewards = parseAllos(node.scavenge?.rewards ?? []);
  const rollsCount = rolls.get(room.index) ?? 0;

  const icons = kamiIconsMap.get(room.index) ?? [];
  const owned = icons.length;

  return (
    <>
      <TopSection>
        <TextRow>
          Type: <Icon src={getAffinityImage(node.affinity)} />
        </TextRow>
        {drops[0] && (
          <TextRow>
            Drop: <Icon key={drops[0].name} src={drops[0].image} />
          </TextRow>
        )}
      </TopSection>
      <span>{room.description}</span>
      <BottomSection>
        <TextRow>
          {rewards.length > 0 && 'Scavenge: '}
          {rewards.map((reward) => (
            <Icon key={reward.name} src={reward.image} />
          ))}
          <TextRow>Rolls: {rollsCount}</TextRow>
        </TextRow>

        <TextRow>
          <Icon margin={'0 0.4vw 0 0'} src={OperatorIcon} />
          Friends: {friendsCount} Total: {playerEntitiesLength}
        </TextRow>
        <TextRow>
          <Icon margin={'0 0.4vw 0 0'} src={KamiIcon} />
          Yours: {owned} Total: {kamiEntitiesLength}
          {owned > 0 && (
            <OwnedIcons fullFirstRow={owned >= 6}>
              {icons.slice(0, 11).map((icon) => (
                <OwnedIcon key={icon} src={icon} />
              ))}
              {owned > 10 && <Ellipsis>...</Ellipsis>}
            </OwnedIcons>
          )}
        </TextRow>
      </BottomSection>
    </>
  );
};

const TopSection = styled.div`
  display: flex;
  justify-content: space-evenly;
  margin-bottom: 0.5vw;
`;

const BottomSection = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.5vw;
  padding: 0.5vw;
`;

const OwnedIcons = styled.div<{ fullFirstRow: boolean }>`
  display: flex;
  flex-flow: row wrap;

  margin-top: 0.3vw;
  margin-bottom: 0.66vw;
  ${({ fullFirstRow }) =>
    fullFirstRow ? ` justify-content:flex-start;  margin-left: 1.5vw; ` : `justify-content:center;`}
`;

const OwnedIcon = styled.img`
  height: 3vw;
  border-radius: 0.6vw;
  border: solid rgb(129, 128, 128) 0.15vw;
  margin: 0.05vw;
`;

const Icon = styled.img<{ margin?: string }>`
  margin: ${({ margin }) => margin ?? '0 0.1vw'};
`;

const TextRow = styled.span`
  color: #666;
  background: #f0f0f0;
  border-radius: 0.4vw;
  padding: 0 0.3vw;
`;

const Ellipsis = styled.span`
  display: flex;
  align-items: center;
  font-weight: bold;
  padding-left: 1.2vw;
  height: 3vw;
`;
