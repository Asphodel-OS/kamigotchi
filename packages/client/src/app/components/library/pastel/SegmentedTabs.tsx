import styled from 'styled-components';
import { playClick } from 'utils/sounds';

import { Palette } from './palette';

export type TabOption = { key: string; label: string; disabled?: boolean };

// pastel segmented control used for modal tabs
export const SegmentedTabs = ({
  tab,
  setTab,
  options,
}: {
  tab: string;
  setTab: (tab: string) => void;
  options: TabOption[];
}) => {
  const select = (key: string) => {
    if (key === tab || options.find((o) => o.key === key)?.disabled) return;
    playClick();
    setTab(key);
  };

  return (
    <Segmented role='tablist'>
      {options.map(({ key, label, disabled }) => (
        <Segment
          key={key}
          role='tab'
          aria-selected={tab === key}
          active={tab === key}
          disabled={disabled}
          onClick={() => select(key)}
        >
          {label}
        </Segment>
      ))}
    </Segmented>
  );
};

const Segmented = styled.div`
  flex: none;
  display: flex;
  padding: 0.2vw;
  gap: 0.2vw;
  background: ${Palette.soft};
  border: solid ${Palette.ink} 0.15vw;
  border-radius: 0.7vw;
`;

const Segment = styled.button<{ active: boolean }>`
  padding: 0.4vw 0.9vw;
  white-space: nowrap;
  font-family: Pixel;
  font-size: 0.65vw;
  color: ${({ active }) => (active ? Palette.ink : Palette.muted)};
  background: ${({ active }) => (active ? Palette.button.bg : 'transparent')};
  border: solid ${({ active }) => (active ? Palette.ink : 'transparent')} 0.12vw;
  border-radius: 0.5vw;
  cursor: ${({ active }) => (active ? 'default' : 'pointer')};

  &:hover:not(:disabled) {
    background: ${({ active }) => (active ? Palette.button.bg : Palette.paper)};
  }
  &:disabled {
    color: ${Palette.faint};
    cursor: default;
  }
`;
