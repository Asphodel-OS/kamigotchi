import { useState } from 'react';
import styled from 'styled-components';

import { filterOngoingQuests, Quest, sortOngoingQuests } from 'network/shapes/Quest';
import { DetailedEntity } from 'network/shapes/utils/EntityTypes';
import { QuestCard } from './QuestCard';

interface Props {
  quests: {
    available: Quest[];
    ongoing: Quest[];
    completed: Quest[];
  };
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
  const { quests, mode, actions, utils } = props;
  const { acceptQuest, completeQuest } = actions;
  const { getDescribedEntity } = utils;
  const [showCompleted, setShowCompleted] = useState(false);
  const [imageCache, _] = useState(new Map<string, JSX.Element>());

  ///////////////////
  // DISPLAY

  const cleanOngoing = (quests: Quest[]) => {
    const ongoing = [...quests];
    return sortOngoingQuests(filterOngoingQuests(ongoing));
  };
  // TODO: format this more elegantly
  const EmptyText = () => {
    if (mode === 'AVAILABLE') {
      return quests.available.length > 0 ? (
        <div />
      ) : (
        <BigText>
          No available available.
          <br /> Do something else?
        </BigText>
      );
    } else {
      return quests.ongoing.length > 0 ? (
        <div />
      ) : (
        <BigText>
          No ongoing quests.
          <br /> Get a job?
        </BigText>
      );
    }
  };

  const CompletedToggle = () => {
    return (
      <CollapseText onClick={() => setShowCompleted(!showCompleted)}>
        {showCompleted ? '- Completed -' : '- Completed (collapsed) -'}
      </CollapseText>
    );
  };

  return (
    <Container>
      <EmptyText />
      {mode === 'AVAILABLE' &&
        quests.available.map((q: Quest) => (
          <QuestCard
            key={q.id}
            quest={q}
            status={'AVAILABLE'}
            utils={{ getDescribedEntity }}
            actions={{ accept: acceptQuest, complete: completeQuest }}
            imageCache={imageCache}
          />
        ))}
      {mode === 'ONGOING' &&
        cleanOngoing(quests.ongoing).map((q: Quest) => (
          <QuestCard
            key={q.id}
            quest={q}
            status={'ONGOING'}
            utils={{ getDescribedEntity }}
            actions={{ accept: acceptQuest, complete: completeQuest }}
            imageCache={imageCache}
          />
        ))}
      {mode === 'ONGOING' && <CompletedToggle />}
      {mode === 'ONGOING' &&
        showCompleted &&
        quests.completed.map((q: Quest) => (
          <QuestCard
            key={q.id}
            quest={q}
            status={'COMPLETED'}
            utils={{ getDescribedEntity }}
            actions={{ accept: acceptQuest, complete: completeQuest }}
            imageCache={imageCache}
          />
        ))}
    </Container>
  );
};

const Container = styled.div`
  overflow-y: scroll;
  height: 100%;
  padding: 0.6vw;
`;

const BigText = styled.div`
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
