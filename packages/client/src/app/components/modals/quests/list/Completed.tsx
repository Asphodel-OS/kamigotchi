import { Quest, sortCompletedQuests } from 'network/shapes/Quest';
import { DetailedEntity } from 'network/shapes/utils';
import { useEffect, useState } from 'react';
import { QuestCard } from '../QuestCard';

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

export const CompletedQuests = (props: Props) => {
  const { quests, actions, utils, imageCache, isVisible } = props;
  const { getDescribedEntity } = utils;
  const [cleaned, setCleaned] = useState<Quest[]>([]);

  useEffect(() => {
    console.log('updating completed quests');
    setCleaned(sortCompletedQuests(quests));
  }, [quests.length]);

  return (
    <div style={{ display: isVisible ? 'block' : 'none' }}>
      {cleaned.map((q: Quest) => (
        <QuestCard
          key={q.id}
          quest={q}
          status={'COMPLETED'}
          utils={{ getDescribedEntity }}
          actions={actions}
          imageCache={imageCache}
        />
      ))}
    </div>
  );
};
