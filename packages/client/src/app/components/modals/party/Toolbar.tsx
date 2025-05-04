import { Dispatch, useEffect, useMemo } from 'react';
import styled from 'styled-components';

import { calcCooldown, calcHealthPercent } from 'app/cache/kami';
import { compareTraits } from 'app/cache/trait';
import { IconButton, IconListButton, Text } from 'app/components/library';
import { useVisibility } from 'app/stores';
import { TriggerIcons } from 'assets/images/icons/triggers';
import { Account } from 'network/shapes/Account';
import { Kami } from 'network/shapes/Kami';
import { Node } from 'network/shapes/Node';
import { SortIcons } from './constants';
import { WHALE_LIMIT } from './KamiList';
import { Sort } from './types';

interface Props {
  data: {
    account: Account;
    kamis: Kami[];
    node: Node;
  };
  state: {
    sort: Sort;
    setSort: Dispatch<Sort>;
    collapsed: boolean;
    setCollapsed: Dispatch<boolean>;
    setDisplayedKamis: Dispatch<Kami[]>;
  };
}

export const Toolbar = (props: Props) => {
  const { data, state } = props;
  const { kamis } = data;
  const { sort, setSort, collapsed, setCollapsed, setDisplayedKamis } = state;
  const { modals } = useVisibility();

  // memoized sort options
  const sortOptions = useMemo(
    () =>
      Object.entries(SortIcons).map(([key, image]) => ({
        text: key,
        image,
        onClick: () => setSort(key as Sort),
      })),
    []
  );

  // sort kamis when sort is changed
  // sorts in place so the seDisplayedKamis is just to triggere an update
  useEffect(() => {
    if (kamis.length <= WHALE_LIMIT) return; // only shown for whales
    let sorted = kamis;
    if (sort === 'index') {
      sorted = kamis.sort((a, b) => a.index - b.index);
    } else if (sort === 'name') {
      sorted = kamis.sort((a, b) => a.name.localeCompare(b.name));
    } else if (sort === 'health') {
      sorted = kamis.sort((a, b) => calcHealthPercent(a) - calcHealthPercent(b));
    } else if (sort === 'cooldown') {
      sorted = kamis.sort((a, b) => calcCooldown(a) - calcCooldown(b));
    } else if (sort === 'body') {
      sorted = kamis.sort((a, b) => compareTraits(a.traits?.body!, b.traits?.body!));
    } else if (sort === 'hands') {
      sorted = kamis.sort((a, b) => compareTraits(a.traits?.hand!, b.traits?.hand!));
    }

    setDisplayedKamis(kamis);
  }, [modals.party, sort]);

  return (
    <Container>
      <Text size={1.2}>Whale Tools</Text>
      <ButtonSection>
        <IconButton
          img={collapsed ? TriggerIcons.eyeHalf : TriggerIcons.eyeOpen}
          onClick={() => setCollapsed(!collapsed)}
        />
        <IconListButton img={SortIcons[sort]} text={sort} options={sortOptions} radius={0.6} />
      </ButtonSection>
    </Container>
  );
};

const Container = styled.div`
  position: sticky;
  z-index: 1;
  top: 0;

  background-color: #eee;
  opacity: 0.9;
  width: 100%;

  padding: 0.6vw;

  display: flex;
  flex-flow: row nowrap;
  justify-content: space-between;
  align-items: center;
  user-select: none;
`;

const ButtonSection = styled.div`
  gap: 0.45vw;

  display: flex;
  flex-flow: row nowrap;
  justify-content: flex-end;
  align-items: center;
`;
