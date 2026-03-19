import { useCallback, useEffect, useRef } from 'react';
import styled from 'styled-components';

const INITIAL_DELAY_MS = 400;
const REPEAT_INTERVAL_MS = 80;

type StepButtonProps = {
  label: '+' | '-';
  onStep: () => void;
};

export const StepButton = ({ label, onStep }: StepButtonProps) => {
  const onStepRef = useRef(onStep);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    onStepRef.current = onStep;
  });

  const stop = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  const start = useCallback(() => {
    stop();
    onStepRef.current();
    timerRef.current = setTimeout(() => {
      intervalRef.current = setInterval(() => onStepRef.current(), REPEAT_INTERVAL_MS);
    }, INITIAL_DELAY_MS);
  }, [stop]);

  useEffect(() => stop, [stop]);

  return (
    <Button
      onMouseDown={start}
      onMouseUp={stop}
      onMouseLeave={stop}
      onTouchStart={start}
      onTouchEnd={stop}
      onTouchCancel={stop}
    >
      {label}
    </Button>
  );
};

const Button = styled.button`
  width: 1.8vw;
  height: 1.8vw;
  flex-shrink: 0;
  border: 0.1vw solid #ccc;
  border-radius: 0.4vw;
  background: #fafafa;
  color: #555;
  font-size: 0.9vw;
  font-weight: 600;
  cursor: pointer;
  pointer-events: auto;
  user-select: none;

  display: flex;
  align-items: center;
  justify-content: center;

  transition: background 0.12s, border-color 0.12s;

  &:hover {
    background: #e8f0fe;
    border-color: #a0c0e8;
  }

  &:active {
    background: #dce8fa;
  }
`;
