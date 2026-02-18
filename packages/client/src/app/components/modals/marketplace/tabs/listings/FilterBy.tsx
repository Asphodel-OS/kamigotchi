import { useMemo } from 'react';
import styled from 'styled-components';

import { IconButton, Slider, Tooltip } from 'app/components/library';
import { DropdownToggle } from 'app/components/library/buttons/DropdownToggle';
import { TraitIcons } from 'assets/images/icons/traits';
import { Trait, TraitType } from 'network/shapes/Trait';

export const FilterBy = ({
  isVisible,
  onClose,
  selected,
  statValues,
  onSelectedChange,
  onStatValuesChange,
  onClear,
  utils,
}: {
  isVisible: boolean;
  onClose: () => void;
  selected: Record<string, Set<string>>;
  statValues: Record<string, number>;
  onSelectedChange: (next: Record<string, Set<string>>) => void;
  onStatValuesChange: (next: Record<string, number>) => void;
  onClear: () => void;
  utils: { getRegistryTraits: (specificType?: TraitType[]) => Trait[] };
}) => {
  const statTypes = ['Health', 'Power', 'Violence', 'Harmony', 'Slots'] as const;

  const columns = useMemo(
    () => [
      { icon: TraitIcons.face, key: 'Face', traits: utils.getRegistryTraits(['Face']) },
      { icon: TraitIcons.hand, key: 'Hands', traits: utils.getRegistryTraits(['Hand']) },
      { icon: TraitIcons.body, key: 'Body Type', traits: utils.getRegistryTraits(['Body']) },
      { icon: TraitIcons.color, key: 'Body Color', traits: utils.getRegistryTraits(['Color']) },
      {
        icon: TraitIcons.background,
        key: 'Background',
        traits: utils.getRegistryTraits(['Background']),
      },
    ],
    [utils]
  );

  const setStatValue = (stat: string, value: number) => {
    onStatValuesChange({ ...statValues, [stat]: value });
  };

  const handleClear = () => onClear();

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
            <DropdownToggle
              key={col.key}
              options={[
                col.traits.map((t) => ({
                  text: t.name,
                  object: t.name,
                })),
              ]}
              selected={[Array.from(selected[col.key])]}
              onClick={[
                (values) => {
                  onSelectedChange({ ...selected, [col.key]: new Set(values) });
                },
              ]}
              button={{ images: [col.icon] }}
              radius={0.4}
              hideActionButton
              trigger={
                <Tooltip content={col.key} isDisabled={false}>
                  <DropdownButton>
                    <TraitIcon src={col.icon} />
                    {selected[col.key].size > 0 && ` (${selected[col.key].size})`} ▾
                  </DropdownButton>
                </Tooltip>
              }
            />
          ))}
        </DropdownRow>
        <SectionLabel>Stats</SectionLabel>
        <SlidersRow>
          {statTypes.map((stat) => {
            const min = stat === 'Slots' ? 1 : 10;
            const max = stat === 'Health' ? 300 : stat === 'Slots' ? 5 : 50;
            return (
              <Slider
                key={stat}
                label={stat}
                value={statValues[stat]}
                onChange={(v) => setStatValue(stat, v)}
                min={min}
                max={max}
              />
            );
          })}
        </SlidersRow>
      </Body>
      <Actions>
        <IconButton text='Clear' onClick={handleClear} />
      </Actions>
    </Container>
  );
};

const Container = styled.div<{ isVisible: boolean }>`
  ${({ isVisible }) => (isVisible ? `display: flex;` : `display: none;`)}
  flex-direction: column;
  flex: 0 0 50%;
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
  position: sticky;
  top: 0;
  z-index: 1;
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
