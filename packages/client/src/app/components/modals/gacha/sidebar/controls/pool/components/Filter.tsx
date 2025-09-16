import styled from 'styled-components';

import { CircleExitButton, Overlay } from 'app/components/library';
import { useEffect, useState } from 'react';

// TODO (jb): fire these filter updates off on a debounce
export const Filter = ({
  name,
  icon,
  min,
  max,
  actions,
}: {
  name: string;
  icon: string;
  min: number;
  max: number;
  actions: {
    remove: () => void;
    setMin: (min: number) => void;
    setMax: (max: number) => void;
  };
}) => {
  const { setMin, setMax, remove } = actions;
  const [stepSize, setStepSize] = useState(1);

  // set step size on mount
  useEffect(() => {
    if (name === 'HEALTH') setStepSize(10);
  }, []);

  const handleMinChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const valStr = e.target.value.replace(/[^\d]/g, '');
    const rawVal = parseInt(valStr || '0');
    const val = Math.min(max, rawVal);
    setMin(val);
  };

  const handleMaxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const valStr = e.target.value.replace(/[^\d]/g, '');
    const rawVal = parseInt(valStr || '0');
    const val = Math.max(min, rawVal);
    setMax(val);
  };

  const handleMinKey = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'ArrowUp') setMin(Math.min(max, min + stepSize));
    else if (e.key === 'ArrowDown') setMin(Math.max(0, min - stepSize));
  };

  const handleMaxKey = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'ArrowUp') setMax(max + stepSize);
    else if (e.key === 'ArrowDown') setMax(Math.max(min, max - stepSize));
  };

  return (
    <Container>
      <Row>
        <Overlay top={-0.4} right={-0.4}>
          <CircleExitButton onClick={remove} circle />
        </Overlay>
        <Grouping>
          <Icon src={icon} />
          <Text size={0.9}>{name}</Text>
        </Grouping>
        <Grouping>
          <Quantity
            type='string'
            value={min}
            onChange={(e) => handleMinChange(e)}
            onKeyDown={(e) => handleMinKey(e)}
          />
          <Text size={0.9}>to</Text>
          <Quantity
            type='string'
            value={max}
            onChange={(e) => handleMaxChange(e)}
            onKeyDown={(e) => handleMaxKey(e)}
          />
        </Grouping>
      </Row>
    </Container>
  );
};

const Container = styled.div`
  background-color: #eee;
  position: relative;
  border: solid black 0.15rem;
  border-radius: 0.6rem;
  padding: 0.6rem;
  margin: 0.3rem;
  filter: drop-shadow(0.1rem 0.1rem 0.05rem black);

  display: flex;
  flex-flow: column nowrap;
  justify-content: space-between;
  align-items: flex-start;
`;

const Row = styled.div`
  width: 100%;
  gap: 0.6rem;

  display: flex;
  flex-flow: row nowrap;
  justify-content: space-between;
  align-items: center;
`;

const Grouping = styled.div`
  display: flex;
  flex-flow: row nowrap;
  align-items: center;
  gap: 0.6rem;
`;

const Icon = styled.img`
  height: 1.8rem;
  width: 1.8rem;
`;

const Text = styled.div<{ size: number }>`
  font-size: ${({ size }) => size}rem;
  color: #333;
`;

const Quantity = styled.input`
  border: solid black 0.15rem;
  border-radius: 0.4rem;
  background-color: #fff;

  width: 3rem;
  padding: 0.45rem 0.3rem;

  color: black;
  font-size: 0.75rem;
  text-align: center;

  cursor: text;
  box-shadow: inset 0.1rem 0.1rem 0.2rem rgba(0, 0, 0, 0.5);
`;
