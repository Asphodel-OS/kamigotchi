import { Dispatch, useEffect, useMemo, useState } from 'react';
import styled from 'styled-components';

import { calcHealthPercent, canHarvest, isHarvesting, onCooldown } from 'app/cache/kami';
import { compareTraitAffinity, compareTraitName, compareTraitRarity } from 'app/cache/trait';
import { IconButton, IconListButton, TextTooltip } from 'app/components/library';
import { DropdownToggle } from 'app/components/library/buttons/DropdownToggle';
import { useVisibility } from 'app/stores';
import { CollectIcon, HarvestIcon, StopIcon } from 'assets/images/icons/actions';
import { Kami } from 'network/shapes/Kami';
import { SortIcons, ViewIcons } from './constants';
import { Sort, View } from './types';

interface DropdownOption {
  text: string;
  object?: any;
}

interface Props {
  actions: {
    addKami: (kamis: Kami[]) => void;
    collect: (kamis: Kami[]) => void;
    stopKami: (kamis: Kami[]) => void;
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
  const { addKami, stopKami, collect } = actions;
  const { sort, setSort, view, setView } = controls;
  const { kamis } = data;
  const { passesNodeReqs } = utils;
  const { displayedKamis, setDisplayedKamis, tick } = state;
  const { modals } = useVisibility();

  const [addOptions, setAddOptions] = useState<DropdownOption[]>([]);
  const [collectOptions, setCollectOptions] = useState<DropdownOption[]>([]);
  const [stopOptions, setStopOptions] = useState<DropdownOption[]>([]);

  /////////////////
  // SUBSCRIPTIONS

  useEffect(() => {
    if (!modals.party) return;
    if (view === 'external') return;

    const addOptions = displayedKamis
      .filter((kami) => canHarvest(kami) && passesNodeReqs(kami))
      .map((kami) => ({ text: kami.name, object: kami }));

    const collectOptions = displayedKamis
      .filter((kami) => isHarvesting(kami) && !onCooldown(kami))
      .map((kami) => ({ text: kami.name, object: kami }));

    const stopOptions = displayedKamis
      .filter((kami) => isHarvesting(kami) && !onCooldown(kami))
      .map((kami) => ({ text: kami.name, object: kami }));

    setAddOptions(addOptions);
    setCollectOptions(collectOptions);
    setStopOptions(stopOptions);
  }, [displayedKamis, tick, modals.party]);

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

  /////////////////
  // INTERACTION

  // toggle between views
  const toggleView = () => {
    if (view === 'external') setView('expanded');
    if (view === 'expanded') setView('collapsed');
    if (view === 'collapsed') setView('external');
  };

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

  return (
    <Container>
      <Section>
        <TextTooltip text={[`${view}`]}>
          <IconButton img={ViewIcons[view]} onClick={() => toggleView()} radius={0.6} />
        </TextTooltip>
        <IconListButton img={SortIcons[sort]} text={sort} options={SortOptions} radius={0.6} />
      </Section>
      {view !== 'external' && (
        <DropdownToggle
          limit={33}
          button={{
            images: [HarvestIcon, CollectIcon, StopIcon],
            tooltips: ['Add Kami to Node', 'Collect Harvest', 'Stop Harvest'],
          }}
          disabled={[addOptions.length == 0, collectOptions.length == 0, stopOptions.length == 0]}
          onClick={[addKami, collect, stopKami]}
          options={[addOptions, collectOptions, stopOptions]}
          radius={0.6}
        />
      )}
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
