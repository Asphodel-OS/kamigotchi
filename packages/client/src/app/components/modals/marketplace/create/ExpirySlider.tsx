import styled from 'styled-components';

import { MenuIcons } from 'assets/images/icons/menu';

const EXPIRY_STEPS = [2, 6, 24, 72, 168, 720] as const;
const EXPIRY_LABELS = ['2h', '6h', '24h', '3d', '7d', '30d'] as const;
const SLIDER_COLOR = '#FFF3C4';

export const ExpirySlider = ({
  expirationHours,
  setExpirationHours,
}: {
  expirationHours: number;
  setExpirationHours: (hours: number) => void;
}) => {
  const isNoExpiry = expirationHours === 0;
  const stepIndex = isNoExpiry ? 0 : EXPIRY_STEPS.indexOf(expirationHours as any);
  const currentIndex = stepIndex === -1 ? 0 : stepIndex;
  const ratio = currentIndex / (EXPIRY_STEPS.length - 1);

  const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const idx = Number(e.target.value);
    setExpirationHours(EXPIRY_STEPS[idx]); // overrides No Expiry if active
  };

  const handleNoExpiryToggle = () => {
    if (isNoExpiry) {
      setExpirationHours(EXPIRY_STEPS[0]);
    } else {
      setExpirationHours(0);
    }
  };

  return (
    <Wrapper>
      <NoExpiryCard $active={isNoExpiry} onClick={handleNoExpiryToggle}>
        <NoExpiryText $active={isNoExpiry}>No Expiry</NoExpiryText>
      </NoExpiryCard>
      <ExpiryCard $ratio={isNoExpiry ? 0 : ratio} $dimmed={isNoExpiry}>
        <ClockIcon src={MenuIcons.clock} alt='Expiry' />
        <SliderInput
          type='range'
          min={0}
          max={EXPIRY_STEPS.length - 1}
          step={1}
          value={currentIndex}
          onChange={handleSliderChange}
          $dimmed={isNoExpiry}
        />
        <ExpiryLabel $active={!isNoExpiry}>
          {EXPIRY_LABELS[currentIndex]}
        </ExpiryLabel>
      </ExpiryCard>
    </Wrapper>
  );
};

const Wrapper = styled.div`
  display: flex;
  gap: 0.4vw;
  align-items: stretch;
`;

const NoExpiryCard = styled.div<{ $active: boolean }>`
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0 0.5vw;
  border-radius: 0.4vw;
  background: ${({ $active }) => ($active ? SLIDER_COLOR : '#f0f0f0')};
  border: 0.1vw solid ${({ $active }) => ($active ? '#d4c56a' : '#ddd')};
  cursor: pointer;
  transition: all 0.15s;
  flex-shrink: 0;

  &:hover {
    background: ${({ $active }) => ($active ? SLIDER_COLOR : '#e4e4e4')};
  }
`;

const NoExpiryText = styled.span<{ $active: boolean }>`
  font-size: 0.65vw;
  font-weight: ${({ $active }) => ($active ? 'bold' : '600')};
  color: #555;
  white-space: nowrap;
  display: inline-flex;
  flex-direction: column;
  align-items: center;

  &::after {
    content: 'No Expiry';
    font-weight: bold;
    height: 0;
    overflow: hidden;
    visibility: hidden;
    display: block;
  }
`;

const ExpiryCard = styled.div<{ $ratio: number; $dimmed: boolean }>`
  display: flex;
  align-items: center;
  gap: 0.5vw;
  padding: 0.35vw 0.5vw;
  border-radius: 0.4vw;
  flex: 1;
  background: ${({ $dimmed, $ratio }) =>
    $dimmed
      ? '#f5f5f5'
      : `color-mix(in srgb, ${SLIDER_COLOR} ${Math.round(30 + $ratio * 70)}%, white)`};
  border: 0.1vw solid
    rgba(0, 0, 0, ${({ $dimmed, $ratio }) => ($dimmed ? '0.06' : (0.08 + 0.12 * $ratio).toFixed(2))});
  transition: background 0.15s, border-color 0.15s;
`;

const ClockIcon = styled.img`
  width: 1.3vw;
  height: 1.3vw;
  flex-shrink: 0;
`;

const SliderInput = styled.input<{ $dimmed: boolean }>`
  flex: 1;
  height: 0.35vw;
  cursor: pointer;
  -webkit-appearance: none;
  appearance: none;
  background: transparent;
  opacity: ${({ $dimmed }) => ($dimmed ? 0.5 : 1)};
  transition: opacity 0.15s;

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

const ExpiryLabel = styled.span<{ $active: boolean }>`
  font-size: 0.75vw;
  font-weight: ${({ $active }) => ($active ? 'bold' : 'normal')};
  min-width: 1.5vw;
  text-align: right;
`;
