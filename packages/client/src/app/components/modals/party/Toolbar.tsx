import { Dispatch, useEffect, useMemo } from 'react';
import styled from 'styled-components';

import { calcHealthPercent, canHarvest } from 'app/cache/kami';
import { compareTraitAffinity, compareTraitName, compareTraitRarity } from 'app/cache/trait';
import { IconButton, IconListButton } from 'app/components/library';
import { DropDownToggle } from 'app/components/library/buttons/DropDownToggle';
import { useVisibility } from 'app/stores';
import { HarvestIcon } from 'assets/images/icons/actions';
import { Kami } from 'network/shapes/Kami';
import { SortIcons, ViewIcons } from './constants';

import { Sort, View } from './types';

interface Props {
  actions: {
    addKamis: (kamis: Kami[]) => void;
  };
  controls: {
    sort: Sort;
    view: View;
    setSort: Dispatch<Sort>;
    setView: Dispatch<View>;
  };
  data: {
    kamis: Kami[];
  };
  state: {
    displayedKamis: Kami[];
    setDisplayedKamis: Dispatch<Kami[]>;
    tick: number;
  };
  utils: { passesNodeReqs: (kami: Kami) => boolean };
}

export const Toolbar = (props: Props) => {
  const { actions, controls, data, state, utils } = props;
  const { addKamis } = actions;
  const { sort, setSort, view, setView } = controls;
  const { kamis } = data;
  const { displayedKamis, setDisplayedKamis } = state;
  const { passesNodeReqs } = utils;
  const { modals } = useVisibility();

  const canAdd = (kami: Kami) => {
    return canHarvest(kami) && passesNodeReqs(kami);
  };

  // TODO: be more explicit about when/how the deployOptions gets updated
  const DeployOptions = displayedKamis
    .filter((kami) => canAdd(kami))
    .map((kami) => ({
      text: kami.name,
      object: kami,
    }));

  // memoized sort options
  const SortOptions = useMemo(
    () =>
      Object.entries(SortIcons).map(([key, image]) => ({
        text: key,
        image,
        onClick: () => setSort(key as Sort),
      })),
    []
  );

  // sort kamis when changes are detected
  // TODO: trigger updates after successful state updates
  // NOTE: sorts in place (setDisplayedKamis is just used to trigger a rendering update)
  useEffect(() => {
    if (!modals.party) return;

    let sorted = kamis;
    if (sort === 'name') {
      sorted = kamis.sort((a, b) => a.name.localeCompare(b.name));
    } else if (sort === 'state') {
      sorted = kamis.sort((a, b) => {
        const stateDiff = a.state.localeCompare(b.state);
        if (stateDiff != 0) return stateDiff;
        return calcHealthPercent(a) - calcHealthPercent(b);
      });
    } else if (sort === 'traits') {
      sorted = kamis.sort((a, b) => {
        let diff = 0;
        if (diff === 0) diff = compareTraitAffinity(a.traits?.body!, b.traits?.body!);
        if (diff === 0) diff = compareTraitAffinity(a.traits?.hand!, b.traits?.hand!);
        if (diff === 0) diff = compareTraitRarity(a.traits?.body!, b.traits?.body!);
        if (diff === 0) diff = compareTraitName(a.traits?.body!, b.traits?.body!);
        if (diff === 0) diff = compareTraitRarity(a.traits?.hand!, b.traits?.hand!);
        if (diff === 0) diff = compareTraitName(a.traits?.hand!, b.traits?.hand!);
        return diff;
      });
    }

    setDisplayedKamis(kamis);
  }, [modals.party, kamis.length, sort, view]);

  return (
    <Container>
      <Section>
        <IconButton
          img={ViewIcons[view]}
          onClick={() => setView(view === 'collapsed' ? 'expanded' : 'collapsed')}
          radius={0.6}
        />
        <IconListButton img={SortIcons[sort]} text={sort} options={SortOptions} radius={0.6} />
      </Section>
      <DropDownToggle
        img={HarvestIcon}
        disabled={DeployOptions.length == 0}
        onClick={(selectedKamis: Kami[]) => addKamis(selectedKamis)}
        deployOptions={DeployOptions}
        radius={0.6}
      />
    </Container>
  );
};

const Container = styled.div`
  padding: 0.6vw;
  z-index: 1;
  position: sticky;
  top: 0;
  opacity: 0.9;
  width: 100%;
  display: flex;
  flex-flow: row nowrap;
  justify-content: space-between;
  align-items: center;
  user-select: none;
  background-color: rgb(238, 238, 238);
`;

const Section = styled.div`
  gap: 0.3vw;
  display: flex;
  flex-flow: row nowrap;
  justify-content: flex-end;
  align-items: center;
`;
