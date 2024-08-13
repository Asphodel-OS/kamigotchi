import styled from 'styled-components';

import { Quest } from 'network/shapes/Quest';
import { DetailedEntity } from 'network/shapes/utils';
import { QuestCard } from '../QuestCard';
import { EmptyText } from './EmptyText';

interface Props {
  quests: Quest[];
  actions: {
    accept: (quest: Quest) => void;
    complete: (quest: Quest) => void;
  };
  utils: {
    getDescribedEntity: (type: string, index: number) => DetailedEntity;
  };
  imageCache: Map<string, JSX.Element>;
  isVisible: boolean;
}

export const AvailableTab = (props: Props) => {
  const { quests, actions, utils, imageCache, isVisible } = props;
  const emptyText = ['No quests available.', 'Do something else?'];
  const display = isVisible ? 'block' : 'none';

  return (
    <Container style={{ display }}>
      {quests.length === 0 && <EmptyText text={emptyText} />}
      {quests.map((q: Quest) => (
        <QuestCard
          key={q.id}
          quest={q}
          status={'AVAILABLE'}
          utils={utils}
          actions={actions}
          imageCache={imageCache}
        />
      ))}
    </Container>
  );
};

const Container = styled.div`
  overflow-y: scroll;
  height: 100%;
`;
