import { useVisibility } from 'app/stores';
import { filterOngoingQuests, Quest } from 'network/shapes/Quest';
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
    parseStatus: (quest: Quest) => Quest;
    getDescribedEntity: (type: string, index: number) => DetailedEntity;
  };
  imageCache: Map<string, JSX.Element>;
  isVisible: boolean;
}

export const OngoingQuests = (props: Props) => {
  const { quests, utils, actions, imageCache, isVisible } = props;
  const { getDescribedEntity, parseStatus } = utils;
  const { modals } = useVisibility();
  const [cleaned, setCleaned] = useState<Quest[]>([]);
  console.log('ongoing quests', quests);

  useEffect(() => {
    // Set up the interval when modals.quests is true
    const timerId = setInterval(() => {
      console.log(`refreshing List. modal is..`);
      if (modals.quests) {
        const filtered = filterOngoingQuests(quests);
        console.log('filtered', filtered);

        const parsed = filtered.map((q: Quest) => parseStatus(q));
        console.log('parsed', parsed);
        setCleaned(parsed);
        console.log('open');
      } else {
        console.log('closed');
      }
    }, 2000);

    return () => clearInterval(timerId);
  }, [modals.quests, quests]); // Include all dependencies

  return (
    <div style={{ display: isVisible ? 'block' : 'none' }}>
      {quests.map((q: Quest) => (
        <QuestCard
          key={q.id}
          quest={q}
          status={'ONGOING'}
          utils={{ getDescribedEntity }}
          actions={actions}
          imageCache={imageCache}
        />
      ))}
    </div>
  );
};
