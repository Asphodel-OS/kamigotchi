import React, { useState } from 'react';
import styled from 'styled-components';

import { playClick } from 'utils/sounds';

interface Props {
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
}

const disabledStepperStyle = {
  backgroundColor: '#c4c4c4',
  pointerEvents: 'none',
};

// InputSingleNumberForm is a styled number input field with buttons to increase or decrease
export const InputSingleNumberForm = (props: Props) => {
  const [value, setValue] = props.watch
    ? [props.watch.value, props.watch.set]
    : useState<number>(props.initialValue || 0);
  let styleOverride = {};
  if (props.fullWidth) styleOverride = { width: '100%', maxWidth: '100%' };
  const step = props.bounds.step || 1;

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setValue(parseInt(event.target.value) || props.initialValue || 0);
  };

  const handleSubmit = () => {
    playClick();
    props.onSubmit && props.onSubmit(value);
    setValue(props.initialValue || 0);
  };

  const catchKeys = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter') {
      handleSubmit();
      console.log(`entered ${value}`);
    }
  };

  const Stepper = () => {
    const atMax = props.bounds.max != undefined && value + step > props.bounds.max;
    const atMin = value - step <= (props.bounds.min || 0);
    return (
      <StepperGroup>
        <StepperButtonTop
          style={atMax ? disabledStepperStyle : {}}
          onClick={() => (atMax ? 0 : setValue(value + step))}
        >
          {' '}
          +{' '}
        </StepperButtonTop>
        <hr style={{ width: '100%', height: '0px', border: '0.08vw solid black' }} />
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
    <Container id={props.id} style={styleOverride}>
      <Box>
        <InputGroup style={styleOverride}>
          {props.label && <Label>{props.label}</Label>}
          <Input
            type='number'
            placeholder={props.placeholder?.toString()}
            value={value}
            onKeyDown={(e) => catchKeys(e)}
            onChange={(e) => handleChange(e)}
            step='1'
          />
          {props.stepper && Stepper()}
        </InputGroup>
        {props.hasButton ? (
          <Button onClick={() => handleSubmit()} disabled={props.disabled}>
            {props.buttonText || 'Submit'}
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
  border-radius: 0.4vw;
  border-style: solid;
  border-width: 0.16vw;
  color: black;

  overflow: hidden;
`;

const Button = styled.button`
  background-color: #ffffff;

  color: black;
  justify-content: center;
  border: none;

  font-family: Pixel;
  font-size: 1vw;
  text-align: center;
  text-decoration: none;

  padding: 0.1vh 0.2vw;

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
  max-width: 8vw;
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

  margin: 0.4vw 0;

  padding: 0.8vw 0 0.8vw 0.8vw;
  cursor: pointer;
  font-family: Pixel;
  font-size: 1vw;
  text-align: center;
  text-decoration: none;
  justify-content: center;
  align-items: center;
`;

const StepperButtonTop = styled.button`
  border: none;
  border-radius: 0 0.2vw 0 0;

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

  font-size: 1vw;
  padding: 0.325vw 0.8vw;
`;

const StepperButtonBottom = styled.button`
  border: none;
  border-radius: 0 0 0.2vw 0;

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

  font-size: 1vw;
  padding: 0.325vw 0.8vw;
`;

const StepperGroup = styled.div`
  display: flex;
  flex-direction: column;
  justify-content: space-around;

  border-left: solid black 0.16vw;
  height: 100%;
`;
