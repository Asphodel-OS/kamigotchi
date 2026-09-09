import { useState } from 'react';
import styled from 'styled-components';

import { StepButton } from 'app/components/library';

export const UseAmountOption = ({
  max,
  onSubmit,
}: {
  max: number;
  onSubmit: (amount: number) => void;
}) => {
  const [raw, setRaw] = useState('1');

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
    const digits = value.replace(/\D/g, '').replace(/^0+/, '');
    setRaw(digits === '' ? '' : clamp(parseInt(digits, 10)).toString());
  };

  const handleSubmit = () => {
    if (isValid) onSubmit(amount);
  };

  return (
    <Row>
      <Label>Use</Label>
      <StepButton label='-' onStep={() => nudge(-1)} />
      <Input
        type='text'
        inputMode='numeric'
        autoComplete='off'
        value={raw}
        onChange={(e) => handleChange(e.target.value)}
        onBlur={() => raw === '' && setRaw('1')}
        onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
      />
      <StepButton label='+' onStep={() => nudge(1)} />
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
`;

const Label = styled.div`
  font-size: 0.9vw;
  line-height: 1.5vw;
  padding-right: 0.15vw;
`;

const Input = styled.input`
  border: 0.1vw solid #ccc;
  border-radius: 0.4vw;
  background-color: #fff;

  width: 3.6vw;
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
