import styled from 'styled-components';
import { playClick } from 'utils/sounds';

interface Props {
  value: number;
  set: (value: number) => void;
  scale?: number;
  max?: number;
  min?: number;
}

// just a pair of simple control buttons to adjust a value
export const Stepper = (props: Props) => {
  const { value, set, max, min, scale = 1 } = props;

  const handleInc = () => {
    let newValue = value + 1;
    if (max) newValue = Math.min(max, newValue);
    set(newValue);
    playClick();
  };

  const handleDec = () => {
    let newValue = value - 1;
    if (min) newValue = Math.max(min, newValue);
    set(newValue);
    playClick();
  };

  return (
    <Container scale={scale}>
      <Button
        scale={scale}
        disabled={!!max && value >= max}
        onClick={handleInc}
        style={{ borderBottom: `0.15vw solid black` }}
      >
        +
      </Button>
      <Button scale={scale} disabled={!!min && value <= min} onClick={handleDec}>
        -
      </Button>
    </Container>
  );
};

const Container = styled.div<{ scale: number }>`
  border-right: 0.15vw solid black;
  height: 100%;
  width: ${({ scale }) => scale}vw;

  display: flex;
  flex-flow: column nowrap;
`;

const Button = styled.div<{ scale: number; disabled?: boolean }>`
  background-color: #fff;
  height: 100%;
  width: 100%;

  display: flex;
  flex-flow: column nowrap;
  justify-content: center;
  align-items: center;

  cursor: pointer;
  pointer-events: auto;
  user-select: none;

  color: black;
  font-size: ${({ scale }) => scale * 0.4}vw;
  line-height: ${({ scale }) => scale * 0.5}vw;
  text-align: center;

  &:hover {
    background-color: #ddd;
  }
  &:active {
    background-color: #bbb;
  }

  ${({ disabled }) =>
    disabled &&
    `
  background-color: #bbb; 
  cursor: default; 
  pointer-events: none;`}
`;
