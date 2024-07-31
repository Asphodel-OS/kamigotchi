import { useEffect, useState } from 'react';
import styled from 'styled-components';

import { KamiCard } from 'app/components/library';
import {
  CollectButton,
  FeedButton,
  LiquidateButton,
  StopButton,
} from 'app/components/library/actions';
import { useSelected, useVisibility } from 'app/stores';
import { Account } from 'network/shapes/Account';
import { Kami, calcHealth, calcOutput } from 'network/shapes/Kami';
import { playClick } from 'utils/sounds';

interface Props {
  account: Account;
  actions: {
    collect: (kami: Kami) => void;
    feed: (kami: Kami, itemIndex: number) => void;
    liquidate: (allyKami: Kami, enemyKami: Kami) => void;
    stop: (kami: Kami) => void;
  };
  allies: Kami[];
  enemies: Kami[];
}

export const Kards = (props: Props) => {
  const { actions, account, allies, enemies } = props;
  const { modals, setModals } = useVisibility();
  const { accountIndex, setAccount } = useSelected();

  // ticking
  const [_, setLastRefresh] = useState(Date.now());
  useEffect(() => {
    const refreshClock = () => {
      setLastRefresh(Date.now());
    };
    const timerId = setInterval(refreshClock, 1000);
    return function cleanup() {
      clearInterval(timerId);
    };
  }, []);

  /////////////////
  // INTERPRETATION

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

  /////////////////
  // INTERACTION

  // toggle the node modal to the selected one
  const selectAccount = (index: number) => {
    if (!modals.account) setModals({ ...modals, account: true, party: false, map: false });
    if (accountIndex !== index) setAccount(index);
    playClick();
  };

  // returns the onClick function for the description
  const getSubtextOnClick = (kami: Kami) => {
    return () => selectAccount(kami.account?.index ?? accountIndex);
  };

  ///////////////////
  // DISPLAY

  // rendering of an ally kami on this node
  const MyKard = (kami: Kami) => {
    const output = calcOutput(kami);

    return (
      <KamiCard
        key={kami.index}
        kami={kami}
        description={getDescription(kami)}
        subtext={`yours (\$${output})`}
        actions={[
          FeedButton(kami, account, actions.feed),
          CollectButton(kami, account, actions.collect),
          StopButton(kami, account, actions.stop),
        ]}
        showBattery
        showCooldown
      />
    );
  };

  // rendering of an enemy kami on this node
  const EnemyKard = (kami: Kami, myKamis: Kami[]) => {
    return (
      <KamiCard
        key={kami.index}
        kami={kami}
        subtext={`${kami.account?.name} (\$${calcOutput(kami)})`}
        subtextOnClick={getSubtextOnClick(kami)}
        actions={LiquidateButton(kami, myKamis, actions.liquidate)}
        description={getDescription(kami)}
        showBattery
        showCooldown
      />
    );
  };

  return (
    <Container>
      {allies && allies.length > 0 && <Label>Allies</Label>}
      {allies.map((ally: Kami) => MyKard(ally))}
      {enemies && enemies.length > 0 && <Label>Enemies</Label>}
      {enemies.map((enemy: Kami) => EnemyKard(enemy, allies))}
    </Container>
  );
};

const Container = styled.div`
  gap: 0.45vw;
  display: flex;
  flex-flow: column nowrap;
`;

const Label = styled.div`
  font-size: 1.2vw;
  color: #333;
  text-align: left;
  padding: 0.2vw;
  padding-top: 0.8vw;
`;
