import styled from 'styled-components';

import { IconListButton, KamiCard } from 'app/components/library';
import { LiquidateButton } from 'app/components/library/actions';
import { useSelected, useVisibility } from 'app/stores';
import { ActionIcons } from 'assets/images/icons/actions';
import { kamiIcon } from 'assets/images/icons/menu';
import { healthIcon } from 'assets/images/icons/stats';
import { BaseAccount } from 'network/shapes/Account';
import { Kami, calcHealth, calcOutput } from 'network/shapes/Kami';
import { calcHealthPercent } from 'network/shapes/Kami/functions';
import { useEffect, useMemo, useState } from 'react';
import { playClick } from 'utils/sounds';

type KamiSort = 'name' | 'health' | 'health %' | 'output' | 'cooldown';

const SortMap: Record<KamiSort, string> = {
  name: kamiIcon,
  health: healthIcon,
  'health %': ActionIcons.liquidate,
  output: ActionIcons.collect,
  cooldown: ActionIcons.harvest,
};

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
  const [sort, setSort] = useState<KamiSort>('cooldown');
  const [sorted, setSorted] = useState<Kami[]>([]);
  const display = kamis.length > 0 ? 'flex' : 'none';

  // memoized sort options
  const sortOptions = useMemo(
    () =>
      Object.entries(SortMap).map(([key, image]) => ({
        text: key,
        image,
        onClick: () => setSort(key as KamiSort),
      })),
    []
  );

  // sort whenever the list of kamis changes or the sort changes
  useEffect(() => {
    const sorted = [...kamis].sort((a, b) => {
      if (sort === 'name') return a.name.localeCompare(b.name);
      else if (sort === 'health') return calcHealth(a) - calcHealth(b);
      else if (sort === 'health %') return calcHealthPercent(a) - calcHealthPercent(b);
      else if (sort === 'output') return calcOutput(b) - calcOutput(a);
      else if (sort === 'cooldown') {
        const aCooldown = a.time.cooldown.requirement + a.time.cooldown.last;
        const bCooldown = b.time.cooldown.requirement + b.time.cooldown.last;
        return bCooldown - aCooldown;
      }
      return 0;
    });
    setSorted(sorted);
  }, [kamis, sort]);

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
    if (!modals.account) setModals({ account: true, party: false, map: false });
    if (accountIndex !== index) setAccount(index);
    playClick();
  };

  return (
    <Container style={{ display }}>
      <Row>
        <Title>Enemies</Title>
        <Sort>
          <IconListButton img={SortMap[sort]} text={sort} options={sortOptions} />
        </Sort>
      </Row>
      {sorted.map((kami: Kami) => {
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
  padding: 0.6vw;
  gap: 0.45vw;
  display: flex;
  flex-flow: column nowrap;
`;

const Row = styled.div`
  position: sticky;
  z-index: 1;
  top: 0;

  background-color: white;
  opacity: 0.9;
  width: 100%;

  padding: 0.3vw;
  padding-bottom: 0.15vw;

  display: flex;
  flex-flow: row nowrap;
  justify-content: space-between;
  align-items: flex-end;
`;

const Sort = styled.div`
  display: flex;
  flex-flow: row nowrap;
`;

const Title = styled.div`
  font-size: 1.2vw;
  color: #333;
  padding-bottom: 0.2vw;
`;
