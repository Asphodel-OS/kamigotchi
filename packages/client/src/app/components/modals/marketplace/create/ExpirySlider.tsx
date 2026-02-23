import styled from 'styled-components';

import { MenuIcons } from 'assets/images/icons/menu';

const EXPIRY_STEPS = [1, 2, 3, 6, 12, 24, 48, 72, 168] as const;
const EXPIRY_LABELS = ['1h', '2h', '3h', '6h', '12h', '1d', '2d', '3d', '7d'] as const;
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
    setExpirationHours(EXPIRY_STEPS[idx]);
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
        <NoExpiryText>No Expiry</NoExpiryText>
      </NoExpiryCard>
      <ExpiryCard $ratio={isNoExpiry ? 0 : ratio} $disabled={isNoExpiry}>
        <ClockIcon src={MenuIcons.clock} alt='Expiry' />
        <SliderInput
          type='range'
          min={0}
          max={EXPIRY_STEPS.length - 1}
          step={1}
          value={currentIndex}
          onChange={handleSliderChange}
          disabled={isNoExpiry}
        />
        <ExpiryLabel $active={!isNoExpiry}>
          {isNoExpiry ? '—' : EXPIRY_LABELS[currentIndex]}
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

const NoExpiryText = styled.span`
  font-size: 0.65vw;
  font-weight: 600;
  color: #555;
  white-space: nowrap;
`;

const ExpiryCard = styled.div<{ $ratio: number; $disabled: boolean }>`
  display: flex;
  align-items: center;
  gap: 0.5vw;
  padding: 0.35vw 0.5vw;
  border-radius: 0.4vw;
  flex: 1;
  background: ${({ $disabled, $ratio }) =>
    $disabled
      ? '#f0f0f0'
      : `color-mix(in srgb, ${SLIDER_COLOR} ${Math.round(30 + $ratio * 70)}%, white)`};
  border: 0.1vw solid
    rgba(0, 0, 0, ${({ $disabled, $ratio }) => ($disabled ? '0.06' : (0.08 + 0.12 * $ratio).toFixed(2))});
  transition: background 0.15s, border-color 0.15s;
`;

const ClockIcon = styled.img`
  width: 1.3vw;
  height: 1.3vw;
  flex-shrink: 0;
`;

const SliderInput = styled.input`
  flex: 1;
  height: 0.35vw;
  cursor: ${({ disabled }) => (disabled ? 'not-allowed' : 'pointer')};
  -webkit-appearance: none;
  appearance: none;
  background: transparent;
  opacity: ${({ disabled }) => (disabled ? 0.4 : 1)};

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
    cursor: ${({ disabled }) => (disabled ? 'not-allowed' : 'pointer')};
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
    cursor: ${({ disabled }) => (disabled ? 'not-allowed' : 'pointer')};
  }
`;

const ExpiryLabel = styled.span<{ $active: boolean }>`
  font-size: 0.75vw;
  font-weight: ${({ $active }) => ($active ? 'bold' : 'normal')};
  min-width: 1.5vw;
  text-align: right;
`;
