import React, { useState } from 'react';
import styled from 'styled-components';

import { ActionButton } from 'layers/react/components/library/ActionButton';
import { playClick } from 'utils/sounds';

interface Props {
  id: string;
  bounds: {
    min?: number;
    max?: number;
    step?: number;
  }
  buttonText?: string;
  fullWidth?: boolean;
  hasButton?: boolean;
  initialValue?: number;
  label?: string;
  placeholder?: string;
  onSubmit?: Function;
  watch?: (value: number) => void;
  stepper?: boolean;
}

// InputSingleNumberForm is a styled number input field with buttons to increase or decrease
export const InputSingleNumberForm = (props: Props) => {
  const [value, setValue] = useState<number>(props.initialValue || 0);
  let styleOverride = {};
  if (props.fullWidth) styleOverride = { width: '100%', maxWidth: '100%' };
  const step = props.bounds.step || 1;

  const updateValue = (newValue: number) => {
    setValue(newValue);
    if (props.watch) props.watch(newValue);
  }

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    updateValue(parseInt(event.target.value) || (props.initialValue || 0));
  };

  const handleSubmit = () => {
    playClick();
    props.onSubmit && props.onSubmit(value);
    updateValue(props.initialValue || 0);
  };

  const catchKeys = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter') {
      handleSubmit();
      console.log(`entered ${value}`);
    }
  };

  const Stepper = (
    <StepperGroup>
      <StepperButton onClick={
        () => (props.bounds.max && value + step > props.bounds.max)
          ? 0
          : updateValue(value + step)
      }> + </StepperButton>
      <hr style={{ width: "100%", height: "0px", border: "0.08vw solid black" }} />
      <StepperButton onClick={
        () => value - step > (props.bounds.min || 0)
          ? updateValue(value - step)
          : 0
      }> - </StepperButton>
    </StepperGroup>
  );

  return (
    <Container id={props.id} style={styleOverride}>
      <InputGroup style={styleOverride}>
        {props.label && <Label>{props.label}</Label>}
        <Input
          type='number'
          placeholder={props.placeholder?.toString()}
          value={value}
          onKeyDown={(e) => catchKeys(e)}
          onChange={(e) => handleChange(e)}
          step="1"
        />
        {props.stepper && Stepper}
      </InputGroup>
      {
        props.hasButton
          ? <ActionButton
            id={`submit`}
            text={props.buttonText || 'Submit'}
            onClick={() => handleSubmit()}
          />
          : <div />
      }
    </ Container>
  );
}

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

  border-color: black;
  border-radius: 0.4vw;
  border-style: solid;
  border-width: 0.16vw;
  color: black;
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
  
  padding: 0.8vw 0 0.8vw  0.8vw;
  cursor: pointer;
  font-family: Pixel;
  font-size: 1vw;
  text-align: left;
  text-decoration: none;
  justify-content: center;
  align-items: center;
`;

const StepperButton = styled.button`
  border: none;
  border-radius: 0.2vw;
  
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
  padding: 0.325vw 0.8vw
`;

const StepperGroup = styled.div`
  display: flex;
  flex-direction: column;
  justify-content: space-around;

  border-left: solid black .16vw;
  height: 100%;
`;