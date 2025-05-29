import { Dispatch, useEffect, useMemo, useState } from 'react';
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

  const [limit, setLimit] = useState(35); // Default to 35

  const canAdd = (kami: Kami) => canHarvest(kami) && passesNodeReqs(kami);

  const DeployOptions = displayedKamis
    .filter((kami) => canAdd(kami))
    .map((kami) => ({
      text: kami.name,
      object: kami,
    }));

  const SortOptions = useMemo(
    () =>
      Object.entries(SortIcons).map(([key, image]) => ({
        text: key,
        image,
        onClick: () => setSort(key as Sort),
      })),
    []
  );

  useEffect(() => {
    if (!modals.party) return;

    let sorted = kamis;
    if (sort === 'name') {
      sorted = kamis.sort((a, b) => a.name.localeCompare(b.name));
    } else if (sort === 'state') {
      sorted = kamis.sort((a, b) => {
        const stateDiff = a.state.localeCompare(b.state);
        if (stateDiff !== 0) return stateDiff;
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
      <div>
        <LimitButtons>
          {[35, 30, 25, 20, 15].map((val) => (
            <LimitButton key={val} onClick={() => setLimit(val)} selected={limit === val}>
              {val}
            </LimitButton>
          ))}
        </LimitButtons>
        <DropDownToggle
          limit={limit}
          img={HarvestIcon}
          disabled={DeployOptions.length === 0}
          onClick={(selectedKamis: Kami[]) => addKamis(selectedKamis)}
          options={DeployOptions}
          radius={0.6}
        />
      </div>
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

const LimitButtons = styled.div`
  display: flex;
  flex-direction: row;
  gap: 0.3vw;
`;

const LimitButton = styled.button<{ selected: boolean }>`
  background-color: ${({ selected }) => (selected ? '#333' : '#ccc')};
  color: ${({ selected }) => (selected ? 'white' : 'black')};
  border: none;
  border-radius: 0.3vw;
  padding: 0.2vw 0.5vw;
  font-size: 0.75vw;
  cursor: pointer;

  &:hover {
    background-color: ${({ selected }) => (selected ? '#444' : '#ddd')};
  }
`;
