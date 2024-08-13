import { useState } from 'react';
import styled from 'styled-components';

import { Quest } from 'network/shapes/Quest';
import { BaseQuest } from 'network/shapes/Quest/quest';
import { DetailedEntity } from 'network/shapes/utils';
import { AcceptedTab } from './AcceptedTab';
import { AvailableTab } from './AvailableTab';

interface Props {
  quests: {
    available: Quest[];
    ongoing: BaseQuest[];
    completed: BaseQuest[];
  };
  mode: TabType;
  actions: {
    acceptQuest: (quest: Quest) => void;
    completeQuest: (quest: Quest) => void;
  };
  utils: {
    populate: (quest: BaseQuest) => Quest;
    parseStatus: (quest: Quest) => Quest;
    parseObjectives: (quest: Quest) => Quest;
    parseRequirements: (quest: Quest) => Quest;
    describeEntity: (type: string, index: number) => DetailedEntity;
    filterOutBattlePass: (quests: Quest[]) => Quest[];
  };
}

export const List = (props: Props) => {
  const { quests, mode, actions, utils } = props;
  const { available, ongoing, completed } = quests;
  const { acceptQuest, completeQuest } = actions;
  const [imageCache, _] = useState(new Map<string, JSX.Element>());

  return (
    <Container>
      <AvailableTab
        quests={available}
        actions={{ accept: acceptQuest, complete: completeQuest }}
        utils={utils}
        imageCache={imageCache}
        isVisible={mode === 'AVAILABLE'}
      />
      <AcceptedTab
        quests={{ ongoing, completed }}
        actions={{ accept: acceptQuest, complete: completeQuest }}
        utils={utils}
        imageCache={imageCache}
        isVisible={mode === 'ONGOING'}
      />
    </Container>
  );
};

const Container = styled.div`
  overflow-y: scroll;
  height: 100%;
  padding: 0.6vw;
`;
