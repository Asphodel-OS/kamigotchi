import { useState } from 'react';
import styled from 'styled-components';

import { Quest } from 'network/shapes/Quest';
import { DetailedEntity } from 'network/shapes/utils';
import { AcceptedTab } from './AcceptedTab';
import { AvailableTab } from './AvailableTab';

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
    parseStatus: (quest: Quest) => Quest;
    getDescribedEntity: (type: string, index: number) => DetailedEntity;
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
