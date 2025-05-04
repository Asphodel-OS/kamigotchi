import styled from 'styled-components';

import { Quest } from 'network/shapes/Quest';
import { DetailedEntity } from 'network/shapes/utils';
import { EmptyText } from '../../../library/text/EmptyText';
import { QuestCard } from './QuestCard';

const emptyText = ['No quests available.', 'Do something else?'];

interface Props {
  quests: Quest[];
  actions: QuestModalActions;
  utils: {
    describeEntity: (type: string, index: number) => DetailedEntity;
    getItemBalance: (index: number) => number;
  };
  imageCache: Map<string, JSX.Element>;
  isVisible: boolean;
}

export const AvailableTab = (props: Props) => {
  const { quests, actions, utils, imageCache, isVisible } = props;
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
  height: 100%;
`;
