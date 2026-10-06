import styled from 'styled-components';

import { KamiIcon, OperatorIcon } from 'assets/images/icons/menu';
import { Room } from 'network/shapes/Room';
import { getAffinityImage } from 'network/shapes/utils';

export const GridTooltip = ({
  room,
  rolls,
  yourKamiIconsMap,
  getNode,
  parseAllos,
  playerEntitiesLength,
  kamiEntitiesLength,
  friendsCount,
}: {
  room: Room;
  rolls: Map<number, number>;
  yourKamiIconsMap: Map<number, string[]>;
  getNode: (index: number) => any;
  parseAllos: (scavAllo: any[]) => any[];
  playerEntitiesLength: number;
  kamiEntitiesLength: number;
  friendsCount: number;
}) => {
  if (!room.index) return null;

  const node = getNode(room.index);
  const drops = node.drops ?? [];
  const rewards = parseAllos(node.scavenge?.rewards ?? []);
  const rollsCount = rolls.get(room.index) ?? 0;

  const icons = yourKamiIconsMap.get(room.index) ?? [];
  const owned = icons.length;

  return (
    <Card>
      <TopSection>
        <Pill>
          Type:
          {node.affinity.map((aff: string) => (
            <Icon key={aff} src={getAffinityImage(aff)} />
          ))}
        </Pill>
        {drops[0] && (
          <Pill>
            Drop:
            <Icon key={drops[0].name} src={drops[0].image} />
          </Pill>
        )}
      </TopSection>
      {room.description && <Description>{room.description}</Description>}
      <BottomSection>
        <Pill>
          {rewards.length > 0 && 'Scavenge:'}
          {rewards.map((reward) => (
            <Icon key={reward.name} src={reward.image} />
          ))}
          <Muted>Rolls: {rollsCount}</Muted>
        </Pill>
        <Pill>
          <Icon src={OperatorIcon} />
          Players here: {playerEntitiesLength} Friends: {friendsCount}
        </Pill>
        <Pill>
          <Icon src={KamiIcon} />
          Kami here: {kamiEntitiesLength} Yours: {owned}
          {owned > 0 && (
            <OwnedIcons>
              {icons.slice(0, 11).map((icon) => (
                <OwnedIcon key={icon} src={icon} />
              ))}
              {owned > 10 && <Ellipsis>...</Ellipsis>}
            </OwnedIcons>
          )}
        </Pill>
      </BottomSection>
    </Card>
  );
};

// own layout: the tooltip text block sets an absolute vw line-height and pre-line wrapping
const Card = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.6vw;
  margin-top: 0.4vw;
  line-height: 1.4;
  white-space: normal;
`;

const TopSection = styled.div`
  display: flex;
  justify-content: center;
  gap: 0.6vw;
`;

const BottomSection = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.35vw;
`;

const Description = styled.div`
  padding: 0 0.3vw;
  font-size: 0.88em;
  line-height: 1.5;
  color: #444;
  white-space: pre-line;
`;

const Pill = styled.div`
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: center;
  gap: 0.3vw;
  padding: 0.2vw 0.5vw;
  border-radius: 0.4vw;
  background: #f0f0f0;
  color: #666;
`;

const Muted = styled.span`
  margin-left: 0.3vw;
  color: #999;
`;

const OwnedIcons = styled.div`
  flex-basis: 100%;
  display: flex;
  flex-flow: row wrap;
  justify-content: center;
  margin-top: 0.2vw;
`;

const OwnedIcon = styled.img`
  width: 3vw;
  border-radius: 0.6vw;
  border: solid rgb(129, 128, 128) 0.15vw;
  margin: 0.05vw;
`;

const Icon = styled.img`
  width: 1.4vw;
`;

const Ellipsis = styled.span`
  display: flex;
  align-items: center;
  font-weight: bold;
  padding-left: 0.6vw;
`;
