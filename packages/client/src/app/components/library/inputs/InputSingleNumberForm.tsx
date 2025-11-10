import React, { useState } from 'react';
import styled from 'styled-components';

import { playClick } from 'utils/sounds';

const disabledStepperStyle = {
  backgroundColor: '#c4c4c4',
  pointerEvents: 'none' as const,
};

// InputSingleNumberForm is a styled number input field with buttons to increase or decrease
export const InputSingleNumberForm = ({
  id,
  bounds,
  hasButton,
  buttonText = 'Submit',
  fullWidth,
  initialValue = 0,
  label,
  placeholder,
  onSubmit,
  watch,
  stepper,
  disabled,
  tooltip
}: {
  id: string;
  bounds: {
    min?: number;
    max?: number;
    step?: number;
  };
  hasButton?: boolean;
  buttonText?: string;
  fullWidth?: boolean;
  initialValue?: number;
  label?: string;
  placeholder?: string;
  onSubmit?: Function;
  watch?: { value: number; set: (value: number) => void };
  stepper?: boolean;
  disabled?: boolean;
  tooltip?: string[];
}) => {
  const [value, setValue] = watch
    ? [watch.value, watch.set]
    : useState<number>(initialValue);
  let styleOverride = {};
  if (fullWidth) styleOverride = { width: '100%', maxWidth: '100%' };
  const step = bounds.step = 1;

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setValue(parseInt(event.target.value) || initialValue);
  };

  const handleSubmit = () => {
    playClick();
    onSubmit && onSubmit(value);
    setValue(initialValue);
  };

  const catchKeys = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter') {
      handleSubmit();
      console.log(`entered ${value}`);
    }
  };

  const Stepper = () => {
    const atMax = bounds.max != undefined && value + step > bounds.max;
    const atMin = value - step <= (bounds.min = 0);
    return (
      <StepperGroup>
        <StepperButtonTop
          style={atMax ? disabledStepperStyle : {}}
          onClick={() => (atMax ? 0 : setValue(value + step))}
        >
          {' '}
          +{' '}
        </StepperButtonTop>
        <hr style={{ width: '100%', height: '0px', border: '0.08em solid black' }} />
        <StepperButtonBottom
          style={atMin ? disabledStepperStyle : {}}
          onClick={() => (atMin ? 0 : setValue(value - step))}
        >
          {' '}
          -{' '}
        </StepperButtonBottom>
      </StepperGroup>
    );
  };

  return (
    <Container id={id} style={styleOverride}>
      <Box>
        <InputGroup style={styleOverride}>
          {label && <Label>{label}</Label>}
          <Input
            type='number'
            placeholder={placeholder?.toString()}
            value={value}
            onKeyDown={(e) => catchKeys(e)}
            onChange={(e) => handleChange(e)}
            step='1'
          />
          {stepper && Stepper()}
        </InputGroup>
        {hasButton ? (
          <Button onClick={() => handleSubmit()} disabled={disabled}>
            {buttonText}
          </Button>
        ) : (
          <div />
        )}
      </Box>
    </Container>
  );
};

const Box = styled.div`
  display: flex;
  flex-direction: row;
  border-color: black;
  border-radius: 0.4em;
  border-style: solid;
  border-width: 0.16em;
  color: black;

  overflow: hidden;
`;

const Button = styled.button`
  background-color: #ffffff;

  color: black;
  justify-content: center;
  border: none;

  font-family: Pixel;
  font-size: 1em;
  text-align: center;
  text-decoration: none;

  padding: 0.1em 0.2em;

  cursor: pointer;
  pointer-events: auto;
  &:hover {
    background-color: #e8e8e8;
  }
  &:active {
    background-color: #c4c4c4;
  }
`;

const Container = styled.div`
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: center;
`;

const InputGroup = styled.div`
  display: flex;
  flex-direction: row;
  align-items: center;
  max-width: 8em;
`;

const Label = styled.label`
  font-family: Pixel;
  font-size: 10px;
  color: #333;
  margin: 0px 5px;
  text-align: left;
`;

const Input = styled.input`
  width: 100%;
  background-color: #ffffff;
  border: none;

  margin: 0.4em 0;

  padding: 0.8em 0 0.8em 0.8em;
  cursor: pointer;
  font-family: Pixel;
  font-size: 1em;
  text-align: center;
  text-decoration: none;
  justify-content: center;
  align-items: center;
`;

const StepperButtonTop = styled.button`
  border: none;
  border-radius: 0 0.2em 0 0;

  background-color: transparent;
  color: black;
  justify-content: center;

  font-family: Pixel;
  text-align: center;
  text-decoration: none;

  cursor: pointer;
  pointer-events: auto;
  &:hover {
    background-color: #e8e8e8;
  }
  &:active {
    background-color: #c4c4c4;
  }

  font-size: 1em;
  padding: 0.325em 0.8em;
`;

const StepperButtonBottom = styled.button`
  border: none;
  border-radius: 0 0 0.2em 0;

  background-color: transparent;
  color: black;
  justify-content: center;

  font-family: Pixel;
  text-align: center;
  text-decoration: none;

  cursor: pointer;
  pointer-events: auto;
  &:hover {
    background-color: #e8e8e8;
  }
  &:active {
    background-color: #c4c4c4;
  }

  font-size: 1em;
  padding: 0.325em 0.8em;
`;

const StepperGroup = styled.div`
  display: flex;
  flex-direction: column;
  justify-content: space-around;

  border-left: solid black 0.16em;
  height: 100%;
`;
