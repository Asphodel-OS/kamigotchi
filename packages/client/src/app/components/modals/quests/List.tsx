import { useState } from 'react';
import styled from 'styled-components';

import { Account } from 'network/shapes/Account';
import { filterAvailableQuests, meetsObjectives, Quest } from 'network/shapes/Quest';
import { DetailedEntity } from 'network/shapes/utils/EntityTypes';
import { QuestCard } from './QuestCard';

interface Props {
  account: Account;
  registry: Quest[];
  mode: TabType;
  actions: {
    acceptQuest: (quest: Quest) => void;
    completeQuest: (quest: Quest) => void;
  };
  utils: {
    getDescribedEntity: (type: string, index: number) => DetailedEntity;
  };
}

export const List = (props: Props) => {
  const { account, registry, mode, actions, utils } = props;
  const { acceptQuest, completeQuest } = actions;
  const { getDescribedEntity } = utils;

  const [isCollapsed, setIsCollapsed] = useState(true);

  ///////////////////
  // DISPLAY

  const getQuestsToDisplay = () => {
    const quests = filterAvailableQuests(registry, account);
    return quests.filter((q: Quest) => !q.complete);
  };

  const AvailableQuests = () => {
    const quests = filterAvailableQuests(registry, account);

    if (quests.length == 0)
      return (
        <EmptyText>
          No available quests.
          <br /> Do something else?
        </EmptyText>
      );

    return quests.map((q: Quest) => (
      <QuestCard
        key={q.id}
        account={account}
        quest={q}
        actions={{ accept: acceptQuest, complete: completeQuest }}
        utils={{ getDescribedEntity }}
      />
    ));
  };

  const CompletedQuests = () => {
    let quests = [...(account.quests?.completed ?? [])];

    const line =
      quests.length > 0 ? (
        <CollapseText onClick={() => setIsCollapsed(!isCollapsed)}>
          {isCollapsed ? '- Completed (collapsed) -' : '- Completed -'}
        </CollapseText>
      ) : (
        <div />
      );

    const dones = quests.map((q: Quest) => (
      <QuestCard
        key={q.id}
        account={account}
        quest={q}
        actions={{ accept: acceptQuest, complete: completeQuest }}
        utils={{ getDescribedEntity }}
      />
    ));

    return (
      <div>
        {line}
        {isCollapsed ? <div /> : dones}
      </div>
    );
  };

  const OngoingQuests = () => {
    filterAvailableQuests(registry, account);
    const rawQuests = [...(account.quests?.ongoing ?? [])];

    if (rawQuests.length == 0)
      return (
        <EmptyText>
          No ongoing quests.
          <br /> Get a job?
        </EmptyText>
      );

    rawQuests.reverse();

    const completable: Quest[] = [];
    const uncompletable: Quest[] = [];
    rawQuests.forEach((q: Quest) => {
      if (meetsObjectives(q)) completable.push(q);
      else uncompletable.push(q);
    });
    const quests = completable.concat(uncompletable);

    return (
      <div>
        {quests.map((q: Quest) => (
          <QuestCard
            key={q.id}
            account={account}
            quest={q}
            actions={{ accept: acceptQuest, complete: completeQuest }}
            utils={{ getDescribedEntity }}
          />
        ))}
        {CompletedQuests()}
      </div>
    );
  };

  const QuestsDisplay = () => {
    if (mode == 'AVAILABLE') return AvailableQuests();
    else if (mode == 'ONGOING') return OngoingQuests();
    else return <div />;
  };

  return <Container>{QuestsDisplay()}</Container>;
};

const Container = styled.div`
  overflow-y: scroll;
  height: 100%;
`;

const EmptyText = styled.div`
  height: 100%;
  margin: 1.5vh;
  padding: 1.2vh 0vw;

  color: #333;
  font-family: Pixel;
  font-size: 1.8vh;
  line-height: 4.5vh;
  text-align: center;
`;

const CollapseText = styled.button`
  border: none;
  background-color: transparent;

  width: 100%;
  textalign: center;
  padding: 0.5vw;

  color: #bbb;
  font-family: Pixel;
  font-size: 0.85vw;
  text-align: center;

  &:hover {
    color: #666;
    cursor: pointer;
  }
`;
const QuestContainer = styled.div`
  border-color: black;
  border-radius: 10px;
  border-style: solid;
  border-width: 2px;
  display: flex;
  justify-content: start;
  align-items: start;
  flex-direction: column;
  padding: 1vw;
  margin: 0.8vw;

  color: #333;
`;

const QuestName = styled.div`
  font-family: Pixel;
  font-size: 1vw;
  text-align: left;
  justify-content: flex-start;
  padding: 0.7vh 0vw;
`;

const QuestDescription = styled.div`
  font-family: Pixel;
  text-align: left;
  line-height: 1.2vw;
  font-size: 0.7vw;
  padding: 0.4vh 0.5vw;
`;

const DoneContainer = styled(QuestContainer)`
  border-color: #999;
  border-width: 1.5px;
  color: #bbb;
`;
