import styled from 'styled-components';
import { playClick } from 'utils/sounds';

// just a pair of simple control buttons to adjust a value
export const Stepper = ({
  value,
  set,
  scale = 1,
  max,
  min,

  disableInc,
  disableDec,
  isHidden,
}: {
  value: number;
  set: (value: number) => void;
  scale?: number;
  max?: number;
  min?: number;

  disableInc?: boolean;
  disableDec?: boolean;
  isHidden?: boolean;
}) => {
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
    <Container scale={scale} isHidden={!!isHidden}>
      <Button scale={scale} disabled={!!disableInc || (!!max && value >= max)} onClick={handleInc}>
        +
      </Button>
      <Button scale={scale} disabled={!!disableDec || (!!min && value <= min)} onClick={handleDec}>
        -
      </Button>
    </Container>
  );
};

const Container = styled.div<{ scale: number; isHidden: boolean }>`
  border-right: 0.15em solid black;
  background-color: black;
  height: 100%;
  width: ${({ scale }) => scale}em;
  gap: 0.12em;

  display: ${({ isHidden }) => (isHidden ? 'none' : 'flex')};
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
  font-size: ${({ scale }) => 0.6 * scale ** 0.5}em;
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
