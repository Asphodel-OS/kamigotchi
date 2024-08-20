import styled from 'styled-components';

import { KamiCard } from 'app/components/library';
import { LiquidateButton } from 'app/components/library/actions';
import { useSelected, useVisibility } from 'app/stores';
import { BaseAccount } from 'network/shapes/Account';
import { Kami, calcHealth, calcOutput } from 'network/shapes/Kami';
import { playClick } from 'utils/sounds';

interface Props {
  kamis: Kami[];
  myKamis: Kami[];
  ownerCache: Map<number, BaseAccount>;
  actions: {
    liquidate: (allyKami: Kami, enemyKami: Kami) => void;
  };
}

// rendering of an ally kami on this node
export const EnemyCards = (props: Props) => {
  const { kamis, myKamis, ownerCache, actions } = props;
  const { modals, setModals } = useVisibility();
  const { accountIndex, setAccount } = useSelected();
  const display = kamis.length > 0 ? 'flex' : 'none';

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

  // toggle the node modal to the selected one
  const selectAccount = (index: number) => {
    if (!modals.account) setModals({ ...modals, account: true, party: false, map: false });
    if (accountIndex !== index) setAccount(index);
    playClick();
  };

  return (
    <Container style={{ display }}>
      <Title>Enemies</Title>
      {kamis.map((kami: Kami) => {
        const owner = ownerCache.get(kami.index)!;
        return (
          <KamiCard
            key={kami.index}
            kami={kami}
            subtext={`${owner.name} (\$${calcOutput(kami)})`}
            subtextOnClick={() => selectAccount(owner.index)}
            actions={LiquidateButton(kami, myKamis, actions.liquidate)}
            description={getDescription(kami)}
            showBattery
            showCooldown
          />
        );
      })}
    </Container>
  );
};

const Container = styled.div`
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
