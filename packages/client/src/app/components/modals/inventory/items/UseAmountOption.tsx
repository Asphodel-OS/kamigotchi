import { useState } from 'react';
import styled from 'styled-components';

import { StepButton } from 'app/components/library';
import { playClick } from 'utils/sounds';

export const UseAmountOption = ({
  max,
  onSubmit,
}: {
  max: number;
  onSubmit: (amount: number) => void;
}) => {
  const [raw, setRaw] = useState('1');

  // input will match the width of number of digits of the item qwuantity
  // capped at 7 chars
  const digits = Math.min(max.toString().length, 7);

  const amount = parseInt(raw, 10);
  const isValid = !isNaN(amount) && amount >= 1 && amount <= max;

  const clamp = (value: number) => Math.min(Math.max(value, 1), max);

  const nudge = (direction: 1 | -1) => {
    setRaw((prev) => {
      const current = parseInt(prev, 10);
      return clamp((isNaN(current) ? 0 : current) + direction).toString();
    });
  };

  const handleChange = (value: string) => {
    const cleaned = value.replace(/\D/g, '').replace(/^0+/, '');
    setRaw(cleaned === '' ? '' : clamp(parseInt(cleaned, 10)).toString());
  };

  const handleSubmit = () => {
    if (!isValid) return;
    playClick();
    onSubmit(amount);
    setRaw('1');
  };

  return (
    <Row onBlur={(e) => !e.currentTarget.contains(e.relatedTarget) && setRaw('1')}>
      <Label>Use</Label>
      <Group onClick={(e) => e.stopPropagation()}>
        <StepButton label='-' onStep={() => nudge(-1)} />
        <Input
          $digits={digits}
          type='text'
          inputMode='numeric'
          autoComplete='off'
          value={raw}
          onChange={(e) => handleChange(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
        />
        <StepButton label='+' onStep={() => nudge(1)} />
      </Group>
      <Confirm disabled={!isValid} onClick={handleSubmit}>
        ✓
      </Confirm>
    </Row>
  );
};

const Row = styled.div`
  display: flex;
  align-items: center;
  gap: 0.3vw;

  width: 100%;
  padding: 0.45vw;
  box-sizing: border-box;
`;

const Group = styled.div`
  display: flex;
  align-items: center;
  gap: 0.3vw;
`;

const Label = styled.div`
  font-size: 0.9vw;
  line-height: 1.5vw;
  padding-right: 0.15vw;
`;

const Input = styled.input<{ $digits: number }>`
  border: 0.1vw solid #ccc;
  border-radius: 0.4vw;
  background-color: #fff;

  width: ${({ $digits }) => `calc(${$digits}ch + 1vw)`};
  height: 1.8vw;
  flex-shrink: 0;
  box-sizing: border-box;
  padding: 0 0.2vw;

  font-family: Pixel;
  font-size: 0.9vw;
  text-align: center;
  color: black;
  pointer-events: auto;
`;

const Confirm = styled.button<{ disabled?: boolean }>`
  width: 1.8vw;
  height: 1.8vw;
  flex-shrink: 0;
  margin-left: 0.15vw;

  border: 0.1vw solid ${({ disabled }) => (disabled ? '#ddd' : '#9AD89A')};
  border-radius: 0.4vw;
  background: ${({ disabled }) => (disabled ? '#f0f0f0' : '#C2F0C2')};
  color: ${({ disabled }) => (disabled ? '#bbb' : '#2E7D32')};

  font-size: 0.9vw;
  font-weight: 600;
  user-select: none;

  display: flex;
  align-items: center;
  justify-content: center;

  cursor: ${({ disabled }) => (disabled ? 'default' : 'pointer')};
  pointer-events: ${({ disabled }) => (disabled ? 'none' : 'auto')};

  transition:
    background 0.12s,
    border-color 0.12s;

  &:hover {
    background: #aeeaae;
    border-color: #7cc77c;
  }

  &:active {
    background: #98e098;
  }
`;
