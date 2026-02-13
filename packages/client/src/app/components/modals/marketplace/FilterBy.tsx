import { useMemo, useState } from 'react';
import styled from 'styled-components';

import { IconButton, Popover, Slider } from 'app/components/library';
import { TraitIcons } from 'assets/images/icons/traits';
import { Trait, TraitType } from 'network/shapes/Trait';

const FilterDropdown = ({
  icon,
  options,
  selectedSet,
  onToggle,
}: {
  icon: string;
  options: string[];
  selectedSet: Set<string>;
  onToggle: (item: string) => void;
}) => {
  const count = selectedSet.size;
  return (
    <Popover
      closeOnClick={false}
      content={options.map((opt) => (
        <DropdownOption key={opt} onMouseDown={() => onToggle(opt)}>
          <DropdownCheckbox type='checkbox' checked={selectedSet.has(opt)} readOnly />
          <DropdownLabel>{opt}</DropdownLabel>
        </DropdownOption>
      ))}
    >
      <DropdownButton>
        <TraitIcon src={icon} />
        {count > 0 && ` (${count})`} ▾
      </DropdownButton>
    </Popover>
  );
};

export const FilterBy = ({
  isVisible,
  onClose,
  utils,
}: {
  isVisible: boolean;
  onClose: () => void;
  utils: { getRegistryTraits: (specificType?: TraitType[]) => Trait[] };
}) => {
  const [selected, setSelected] = useState<Record<string, Set<string>>>({
    Head: new Set(),
    Hand: new Set(),
    Body: new Set(),
    Background: new Set(),
    Color: new Set(),
  });

  const statTypes = ['Health', 'Power', 'Violence', 'Harmony', 'Slots'] as const;

  const [statValues, setStatValues] = useState<Record<string, number>>(() =>
    Object.fromEntries(statTypes.map((s) => [s, 10]))
  );

  const columns = useMemo(
    () => [
      { icon: TraitIcons.face, key: 'Head', traits: utils.getRegistryTraits(['Face']) },
      { icon: TraitIcons.hand, key: 'Hand', traits: utils.getRegistryTraits(['Hand']) },
      { icon: TraitIcons.body, key: 'Body', traits: utils.getRegistryTraits(['Body']) },
      { icon: TraitIcons.color, key: 'Color', traits: utils.getRegistryTraits(['Color']) },
      { icon: TraitIcons.background, key: 'Background', traits: utils.getRegistryTraits(['Background']) },
    ],
    []
  );

  const toggleTrait = (column: string, traitName: string) => {
    setSelected((prev) => {
      const next = new Set(prev[column]);
      if (next.has(traitName)) next.delete(traitName);
      else next.add(traitName);
      return { ...prev, [column]: next };
    });
  };

  const setStatValue = (stat: string, value: number) => {
    setStatValues((prev) => ({ ...prev, [stat]: value }));
  };

  const handleFilter = () => {};
  const handleClear = () => {
    setSelected({
      Head: new Set(),
      Hand: new Set(),
      Body: new Set(),
      Background: new Set(),
      Color: new Set(),
    });
    setStatValues(Object.fromEntries(statTypes.map((s) => [s, 10])));
  };

  return (
    <Container isVisible={isVisible}>
      <Header>
        <HeaderTitle>Filter By</HeaderTitle>
        <IconButton text='X' onClick={onClose} scale={1.5} />
      </Header>
      <Body>
        <SectionLabel>Traits</SectionLabel>
        <DropdownRow>
          {columns.map((col) => (
            <FilterDropdown
              key={col.key}
              icon={col.icon}
              options={col.traits.map((t) => t.name)}
              selectedSet={selected[col.key]}
              onToggle={(name) => toggleTrait(col.key, name)}
            />
          ))}
        </DropdownRow>
        <SectionLabel>Stats</SectionLabel>
        <SlidersRow>
          {statTypes.map((stat) => (
            <Slider
              key={stat}
              label={stat}
              value={statValues[stat]}
              onChange={(v) => setStatValue(stat, v)}
              min={10}
              max={50}
            />
          ))}
        </SlidersRow>
      </Body>
      <Actions>
        <IconButton text='Filter' onClick={handleFilter} />
        <IconButton text='Clear' onClick={handleClear} />
      </Actions>
    </Container>
  );
};

const Container = styled.div<{ isVisible: boolean }>`
  ${({ isVisible }) => (isVisible ? `display: flex;` : `display: none;`)}
  flex-direction: column;
  flex: 0 0 45%;
  overflow: auto;
  border-top: 0.15vw solid black;
  width: 100%;
`;

const Header = styled.div`
  display: flex;
  align-items: center;
  background-color: rgb(221, 221, 221);
  padding: 0.8vw;
  font-size: 1.2vw;
`;

const HeaderTitle = styled.span`
  flex: 1;
  text-align: center;
  font-size: 1.1vw;
`;

const Body = styled.div`
  padding: 0.3vw 0 0 0.3vw;
  gap: 0.6vw;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  flex: 1;
  overflow-y: auto;
`;

const SectionLabel = styled.div`
  font-weight: bold;
  font-size: 0.9vw;
  text-align: left;
`;

const DropdownRow = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 0.4vw;
`;

const DropdownButton = styled.div`
  display: flex;
  align-items: center;
  gap: 0.3vw;
  font-size: 0.75vw;
  border: 0.15vw solid black;
  border-radius: 0.4vw;
  padding: 0.3vw 0.6vw;
  cursor: pointer;
  background: white;
  white-space: nowrap;
`;

const TraitIcon = styled.img`
  width: 1.3vw;
  height: 1.3vw;
`;

const DropdownOption = styled.div`
  display: flex;
  align-items: center;
  gap: 0.3vw;
  padding: 0.3vw 0.5vw;
  cursor: pointer;
`;

const DropdownCheckbox = styled.input`
  width: 0.65vw;
  height: 0.65vw;
  cursor: pointer;
  accent-color: rgb(203, 186, 61);
  pointer-events: none;
`;

const DropdownLabel = styled.span`
  font-size: 0.65vw;
`;

const SlidersRow = styled.div`
  display: flex;
  gap: 2vw;
`;


const Actions = styled.div`
  display: flex;
  flex-flow: row nowrap;
  justify-content: center;
  gap: 0.6vw;
  padding: 0.6vw;
  position: sticky;
  bottom: 0;
  background-color: rgb(255, 255, 255);
`;
