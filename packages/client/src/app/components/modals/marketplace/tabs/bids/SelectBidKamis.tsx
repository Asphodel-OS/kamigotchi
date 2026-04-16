import { useMemo } from 'react';
import styled from 'styled-components';

import { EmptyText, IconButton, TextTooltip } from 'app/components/library';
import { Kami } from 'network/shapes/Kami';

const STATE_ORDER: Record<string, number> = {
  HARVESTING: 0,
  LISTED: 1,
  DEAD: 2,
  '721_EXTERNAL': 3,
};

const getOverlayLabel = (state: string): string[] => {
  if (state === 'DEAD') return ['NEEDS', 'REVIVAL'];
  if (state === 'HARVESTING') return ['NEEDS', 'REST'];
  if (state === 'LISTED') return ['CURRENTLY', 'LISTED'];
  if (state === '721_EXTERNAL') return ['CURRENTLY', 'OFF WORLD'];
  return ['UNAVAILABLE'];
};

export const SelectBidKamis = ({
  isVisible,
  restingKamis,
  unavailableKamis,
  selectedCount,
  canSelectKami,
  isSelected,
  onToggleKami,
  onClose,
  onClear,
  onSelectMax,
  onSell,
  sellLabel,
  sellDisabled,
}: {
  isVisible: boolean;
  restingKamis: Kami[];
  unavailableKamis: Kami[];
  selectedCount: number;
  canSelectKami: (index: number) => boolean;
  isSelected: (index: number) => boolean;
  onToggleKami: (index: number) => void;
  onClose: () => void;
  onClear: () => void;
  onSelectMax: () => void;
  onSell: () => void;
  sellLabel: string;
  sellDisabled: boolean;
}) => {
  const sortedUnavailable = useMemo(
    () =>
      [...unavailableKamis].sort(
        (a, b) => (STATE_ORDER[a.state] ?? 99) - (STATE_ORDER[b.state] ?? 99)
      ),
    [unavailableKamis]
  );

  return (
    <BottomSection isVisible={isVisible}>
      <Header>
        <HeaderTitle>Select Your Kami</HeaderTitle>
        <IconButton text='X' onClick={onClose} scale={1.5} />
      </Header>
      {restingKamis.length === 0 && unavailableKamis.length === 0 ? (
        <EmptyGridCenter>
          <EmptyText text={[`You don't have any Kami!`]} size={0.9} />
        </EmptyGridCenter>
      ) : (
      <KamiGrid>
        {restingKamis.map((kami) => (
          <KamiSlot
            key={kami.index}
            onClick={() => onToggleKami(kami.index)}
            isDisabled={!canSelectKami(kami.index)}
            $selected={isSelected(kami.index)}
          >
            <KamiSlotImage src={kami.image} alt={kami.name} />
            <Checkbox
              type='checkbox'
              checked={isSelected(kami.index)}
              onChange={() => onToggleKami(kami.index)}
              onClick={(e) => e.stopPropagation()}
              disabled={!canSelectKami(kami.index)}
            />
          </KamiSlot>
        ))}
        {sortedUnavailable.map((kami) => {
          const lines = getOverlayLabel(kami.state);
          return (
            <LockedKamiSlot key={kami.index}>
              <KamiSlotImage src={kami.image} alt={kami.name} />
              <LockedOverlay>
                {lines.map((line, i) => (
                  <LockedLabel key={i}>{line}</LockedLabel>
                ))}
              </LockedOverlay>
            </LockedKamiSlot>
          );
        })}
      </KamiGrid>
      )}
      <Footer>
        <FooterLeft>
          <SelectedLabel>{selectedCount} Selected</SelectedLabel>
        </FooterLeft>
        <FooterButtons>
          {selectedCount > 0 && (
            <IconButton text='Clear' onClick={onClear} color='#F8D6D6' scale={3} />
          )}
          <TextTooltip text={['Select the maximum Kami for the best bid']}>
            <IconButton text='Max' onClick={onSelectMax} color='#DCEEFB' scale={3} />
          </TextTooltip>
          <IconButton
            text={sellLabel}
            onClick={onSell}
            disabled={sellDisabled}
            color='#C2F0C2'
            scale={3}
          />
        </FooterButtons>
      </Footer>
    </BottomSection>
  );
};

const BottomSection = styled.div<{ isVisible: boolean }>`
  ${({ isVisible }) => (isVisible ? `display: flex;` : `display: none;`)}
  flex-direction: column;
  flex: 0 0 50%;
  overflow: hidden;
  border-top: 0.15vw solid black;
  width: 100%;
  user-select: none;
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

const KamiGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(5vw, 1fr));
  align-content: start;
  gap: 0.4vw;
  padding: 0.6vw;
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  scrollbar-width: none;
  &::-webkit-scrollbar {
    display: none;
  }
`;

const EmptyGridCenter = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  flex: 1;
  width: 100%;
`;

const KamiSlot = styled.div<{ isDisabled: boolean; $selected?: boolean }>`
  position: relative;
  padding-bottom: 100%;
  border-radius: 0.3vw;
  background: #fafafa;
  cursor: ${({ isDisabled }) => (isDisabled ? 'not-allowed' : 'pointer')};
  opacity: ${({ isDisabled, $selected }) => (isDisabled && !$selected ? 0.4 : 1)};
  border: 0.18vw solid ${({ $selected }) => ($selected ? '#222' : 'transparent')};
  outline: ${({ $selected }) => ($selected ? 'none' : '0.06vw solid #ccc')};
  overflow: hidden;
`;

const LockedKamiSlot = styled.div`
  position: relative;
  padding-bottom: 100%;
  border: 0.06vw solid #ccc;
  border-radius: 0.3vw;
  background: #fafafa;
  cursor: not-allowed;
  overflow: hidden;
`;

const LockedOverlay = styled.div`
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background: rgba(0, 0, 0, 0.55);
  border-radius: 0.3vw;
  z-index: 1;
  padding: 0.2vw;
`;

const LockedLabel = styled.span`
  font-size: 0.55vw;
  font-weight: 700;
  color: #ffd54f;
  text-transform: uppercase;
  letter-spacing: -0.01vw;
  line-height: 1.15;
  text-align: center;
  text-shadow: 0 0.05vw 0.15vw rgba(0, 0, 0, 0.8);
`;

const KamiSlotImage = styled.img`
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
  image-rendering: pixelated;
`;

const Checkbox = styled.input`
  position: absolute;
  top: 0.1vw;
  right: 0.1vw;
  width: 0.9vw;
  height: 0.9vw;
  cursor: pointer;
  accent-color: rgb(203, 186, 61);
`;

const Footer = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.6vw;
  position: sticky;
  bottom: 0;
  background-color: rgb(240, 240, 240);
  border-top: 0.1vw solid #ccc;
  margin-top: auto;
`;

const FooterLeft = styled.div`
  display: flex;
  align-items: center;
  gap: 0.3vw;
`;

const SelectedLabel = styled.span`
  font-size: 0.95vw;
  font-weight: bold;
`;

const FooterButtons = styled.div`
  display: flex;
  gap: 0.4vw;
`;
