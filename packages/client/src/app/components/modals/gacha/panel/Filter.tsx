import styled from 'styled-components';

import { CircleExitButton } from 'app/components/library/base';
import { Overlay } from 'app/components/library/styles';

interface Props {
  name: string;
  icon: string;
  min: number;
  max: number;
  actions: {
    remove: () => void;
    setMin: (min: number) => void;
    setMax: (max: number) => void;
  };
}

export const Filter = (props: Props) => {
  const { name, icon, min, max, actions } = props;
  const { setMin, setMax, remove } = actions;

  const handleMinChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const min = Number(e.target.value);
    setMin(min);
  };

  const handleMaxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const max = Number(e.target.value);
    setMax(max);
  };

  const handleMinKey = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'ArrowUp') setMin(min + 1);
    else if (e.key === 'ArrowDown') setMin(min - 1);
  };

  const handleMaxKey = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'ArrowUp') setMax(max + 1);
    else if (e.key === 'ArrowDown') setMax(max - 1);
  };

  return (
    <Container>
      <Row>
        <Overlay top={-0.4} right={-0.4}>
          <CircleExitButton onClick={remove} />
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
  position: relative;
  border: solid black 0.15vw;
  border-radius: 0.6vw;
  padding: 0.6vw;
  margin: 0.3vw;

  display: flex;
  flex-flow: column nowrap;
  justify-content: space-between;
  align-items: flex-start;
`;

const Row = styled.div`
  width: 100%;
  gap: 0.6vw;

  display: flex;
  flex-flow: row nowrap;
  justify-content: space-between;
  align-items: center;
`;

const Grouping = styled.div`
  display: flex;
  flex-flow: row nowrap;
  align-items: center;
  gap: 0.6vw;
`;

const Icon = styled.img`
  height: 1.8vw;
  width: 1.8vw;
`;

const Text = styled.div<{ size: number }>`
  font-size: ${({ size }) => size}vw;
  color: #333;
`;

const Quantity = styled.input`
  border: solid black 0.15vw;
  border-radius: 0.4vw;
  background-color: #eee;

  width: 3vw;
  padding: 0.45vw 0.3vw;

  color: black;
  font-size: 0.75vw;
  text-align: center;

  cursor: text;
`;
