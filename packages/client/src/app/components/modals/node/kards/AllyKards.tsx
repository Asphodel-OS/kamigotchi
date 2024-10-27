import { EntityIndex } from '@mud-classic/recs';
import styled from 'styled-components';

import { KamiCard } from 'app/components/library';
import { CollectButton, FeedButton, StopButton } from 'app/components/library/actions';
import { Account } from 'network/shapes/Account';
import { Kami, KamiOptions, calcHealth, calcOutput } from 'network/shapes/Kami';

interface Props {
  account: Account;
  entities: EntityIndex[]; // ally kami entities
  actions: {
    collect: (kami: Kami) => void;
    feed: (kami: Kami, itemIndex: number) => void;
    stop: (kami: Kami) => void;
  };
  utils: {
    getKami: (entity: EntityIndex, options?: KamiOptions) => Kami;
  };
}

// rendering of an ally kami on this node
export const AllyKards = (props: Props) => {
  const { actions, utils, entities, account } = props;
  const { collect, feed, stop } = actions;

  // get the description on the card
  const getDescription = (kami: Kami): string[] => {
    const health = calcHealth(kami);
    const description = [
      '',
      `Health: ${health.toFixed()}/${kami.stats.health.total}`,
      `Harmony: ${kami.stats.harmony.total}`,
      `Violence: ${kami.stats.violence.total}`,
    ];
    return description;
  };

  return (
    <Container style={{ display: entities.length > 0 ? 'flex' : 'none' }}>
      <Title>Allies</Title>
      {entities.map((entity: EntityIndex) => {
        // TODO: optimize this. dont recompute all kami data indiscriminately
        const kami = utils.getKami(entity, { harvest: true, traits: true });
        return (
          <KamiCard
            key={kami.index}
            kami={kami}
            description={getDescription(kami)}
            subtext={`yours (\$${calcOutput(kami)})`}
            actions={[
              FeedButton(kami, account, feed),
              CollectButton(kami, account, collect),
              StopButton(kami, account, stop),
            ]}
            showBattery
            showCooldown
          />
        );
      })}
    </Container>
  );
};

const Container = styled.div`
  padding: 0.6vw;
  gap: 0.45vw;
  display: flex;
  flex-flow: column nowrap;
`;

const Title = styled.div`
  font-size: 1.2vw;
  color: #333;
  text-align: left;
  padding: 0.2vw;
  padding-top: 0.8vw;
`;
