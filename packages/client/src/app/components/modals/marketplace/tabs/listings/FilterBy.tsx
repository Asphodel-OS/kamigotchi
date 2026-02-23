import { useMemo } from 'react';
import styled from 'styled-components';

import { IconButton, Tooltip } from 'app/components/library';
import { DropdownToggle } from 'app/components/library/buttons/DropdownToggle';
import { TraitIcons } from 'assets/images/icons/traits';
import { StatColors, StatIcons } from 'constants/stats';
import { Trait, TraitType } from 'network/shapes/Trait';

const STAT_DEFS = [
  { key: 'Health', icon: StatIcons.health, color: StatColors.health, min: 10, max: 300, step: 10 },
  { key: 'Power', icon: StatIcons.power, color: StatColors.power, min: 10, max: 50, step: 1 },
  { key: 'Violence', icon: StatIcons.violence, color: StatColors.violence, min: 10, max: 50, step: 1 },
  { key: 'Harmony', icon: StatIcons.harmony, color: StatColors.harmony, min: 10, max: 50, step: 1 },
  { key: 'Slots', icon: StatIcons.slots, color: '#c8c8c8', min: 0, max: 3, step: 1 },
];

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

  return (
    <Container isVisible={isVisible}>
      <Header>
        <HeaderTitle>Filter By</HeaderTitle>
        <IconButton text='X' onClick={onClose} scale={1.5} />
      </Header>
      <Body>
        <HalfSection>
          <SectionLabel>Traits</SectionLabel>
          <TraitsGrid>
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
                maxHeight={40}
                trigger={
                  <Tooltip content={`${col.key}.`} isDisabled={false}>
                    <DropdownButton>
                      <TraitIcon src={col.icon} />
                      <TraitLabel>
                        {col.key}
                        {selected[col.key].size > 0 && (
                          <TraitCount>({selected[col.key].size})</TraitCount>
                        )}
                      </TraitLabel>
                      <Chevron>▾</Chevron>
                    </DropdownButton>
                  </Tooltip>
                }
              />
            ))}
          </TraitsGrid>
        </HalfSection>

        <Divider />

        <HalfSection>
          <SectionLabel>Min. Stats</SectionLabel>
          <StatsGrid>
            {STAT_DEFS.map((stat) => {
              const val = statValues[stat.key] ?? stat.min;
              const isActive = stat.key === 'Slots' ? val > 0 : val > 10;
              const ratio = (val - stat.min) / (stat.max - stat.min);
              return (
                <StatCard key={stat.key} $color={stat.color} $ratio={ratio}>
                  <StatIconImg src={stat.icon} />
                  <StatSlider
                    type='range'
                    min={stat.min}
                    max={stat.max}
                    step={stat.step}
                    value={val}
                    onChange={(e) => setStatValue(stat.key, Number(e.target.value))}
                  />
                  <StatValue $active={isActive}>{val}</StatValue>
                </StatCard>
              );
            })}
          </StatsGrid>
        </HalfSection>
      </Body>
      <Footer>
        <IconButton text='Clear Filters' onClick={onClear} color='#FDECEC' />
      </Footer>
    </Container>
  );
};

const Container = styled.div<{ isVisible: boolean }>`
  ${({ isVisible }) => (isVisible ? `display: flex;` : `display: none;`)}
  flex-direction: column;
  border-top: 0.15vw solid black;
  width: 100%;
`;

const Header = styled.div`
  display: flex;
  align-items: center;
  background-color: rgb(221, 221, 221);
  padding: 0.5vw 0.8vw;
  font-size: 1.2vw;
`;

const HeaderTitle = styled.span`
  flex: 1;
  text-align: center;
  font-size: 1.1vw;
`;

const Body = styled.div`
  display: flex;
  padding: 0.8vw;
  gap: 0.8vw;
`;

const Divider = styled.div`
  width: 0.1vw;
  background: #ccc;
  align-self: stretch;
`;

const HalfSection = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 0.5vw;
`;

const SectionLabel = styled.div`
  font-weight: bold;
  font-size: 0.8vw;
  padding-bottom: 0.2vw;
  border-bottom: 0.08vw solid #ddd;
`;

const TraitsGrid = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.35vw;
`;

const DropdownButton = styled.div`
  display: flex;
  align-items: center;
  gap: 0.4vw;
  font-size: 0.75vw;
  border: 0.12vw solid #999;
  border-radius: 0.4vw;
  padding: 0.35vw 0.6vw;
  cursor: pointer;
  background: white;
  white-space: nowrap;
  width: 100%;

  &:hover {
    border-color: #555;
    background: #fafafa;
  }
`;

const TraitIcon = styled.img`
  width: 1.3vw;
  height: 1.3vw;
  flex-shrink: 0;
`;

const TraitLabel = styled.span`
  flex: 1;
  display: flex;
  align-items: center;
  gap: 0.3vw;
`;

const TraitCount = styled.span`
  color: #888;
  font-size: 0.65vw;
`;

const Chevron = styled.span`
  color: #999;
  font-size: 0.6vw;
`;

const StatsGrid = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.35vw;
`;

const StatCard = styled.div<{ $color: string; $ratio: number }>`
  display: flex;
  align-items: center;
  gap: 0.5vw;
  padding: 0.35vw 0.5vw;
  border-radius: 0.4vw;
  background: color-mix(in srgb, ${({ $color }) => $color} ${({ $ratio }) => Math.round(30 + $ratio * 70)}%, white);
  border: 0.1vw solid rgba(0, 0, 0, ${({ $ratio }) => (0.08 + 0.12 * $ratio).toFixed(2)});
  transition: background 0.15s, border-color 0.15s;
`;

const StatIconImg = styled.img`
  width: 1.3vw;
  height: 1.3vw;
  flex-shrink: 0;
`;

const StatSlider = styled.input`
  flex: 1;
  height: 0.35vw;
  cursor: pointer;
  -webkit-appearance: none;
  appearance: none;
  background: transparent;

  &::-webkit-slider-runnable-track {
    height: 0.35vw;
    border-radius: 0.2vw;
    background: rgba(0, 0, 0, 0.2);
  }
  &::-webkit-slider-thumb {
    -webkit-appearance: none;
    width: 0.8vw;
    height: 0.8vw;
    border-radius: 50%;
    background: #222;
    border: none;
    margin-top: -0.22vw;
    cursor: pointer;
  }
  &::-moz-range-track {
    height: 0.35vw;
    border-radius: 0.2vw;
    background: rgba(0, 0, 0, 0.2);
  }
  &::-moz-range-thumb {
    width: 0.8vw;
    height: 0.8vw;
    border-radius: 50%;
    background: #222;
    border: none;
    cursor: pointer;
  }
`;

const StatValue = styled.span<{ $active: boolean }>`
  font-size: 0.75vw;
  font-weight: ${({ $active }) => ($active ? 'bold' : 'normal')};
  min-width: 1.5vw;
  text-align: right;
`;

const Footer = styled.div`
  display: flex;
  justify-content: flex-end;
  padding: 0.4vw 0.8vw 0.6vw;
`;
