import styled from 'styled-components';

import { Tooltip } from 'app/components/library';
import { Account } from 'network/shapes/Account';
import { Quest } from 'network/shapes/Quest';
import { BaseQuest } from 'network/shapes/Quest/quest';
import { DetailedEntity } from 'network/shapes/utils';
import { getFactionImage } from 'network/shapes/utils/images';
import { Battlepass } from './battlepass/Battlepass';

interface Props {
  account: Account;
  quests: {
    registry: BaseQuest[];
    ongoing: BaseQuest[];
    completed: BaseQuest[];
  };
  actions: QuestModalActions;
  utils: {
    describeEntity: (type: string, index: number) => DetailedEntity;
    filterForBattlePass: (quests: Quest[]) => Quest[];
    populate: (base: BaseQuest) => Quest;
    parseObjectives: (quest: Quest) => Quest;
    parseRequirements: (quest: Quest) => Quest;
  };
}

export const Footer = (props: Props) => {
  const { account, quests, actions, utils } = props;

  return (
    <Container>
      <Tooltip
        text={[
          `REPUTATION represents your relationship with the Kamigotchi Tourism Agency.`,
          '',
          `This is what you'll need for more, uh, permanent rewards....`,
        ]}
      >
        <Icon src={getFactionImage('agency')} />
      </Tooltip>
      <Battlepass account={account} quests={quests} actions={actions} utils={utils} />
    </Container>
  );
};

const Container = styled.div`
  padding: 0.9vw;
  gap: 0.6vw;

  display: flex;
  flex-flow: column no-wrap;
  justify-content: space-between;
  align-items: center;
`;

const Icon = styled.img`
  height: 2.4vw;
  width: auto;
  image-rendering: pixelated;
`;
