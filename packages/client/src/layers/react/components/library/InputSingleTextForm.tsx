import React, { useState } from 'react';
import styled from 'styled-components';

import { ActionButton } from 'layers/react/components/library/ActionButton';
import { playClick } from 'utils/sounds';

interface Props {
  id: string;
  buttonText?: string;
  fullWidth?: boolean;
  hasButton?: boolean;
  initialValue?: string;
  label?: string;
  placeholder?: string;
  onSubmit?: Function;
}

// InputSingleTextForm is a styled input field with some additional frills
export const InputSingleTextForm = (props: Props) => {
  const [value, setValue] = useState(props.initialValue || '');
  let styleOverride = {};
  if (props.fullWidth) styleOverride = { width: '100%' };
  props.buttonText = props.buttonText || 'Submit';

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setValue(event.target.value);
  };

  const handleSubmit = () => {
    playClick();
    props.onSubmit && props.onSubmit(value);
    setValue('');
  };

  const catchKeys = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter') {
      handleSubmit();
      console.log(`entered ${value}`);
    }
  };

  return (
    <Container id={props.id} style={styleOverride}>
      <InputGroup>
        {props.label && <Label>{props.label}</Label>}
        <Input
          type='text'
          placeholder={props.placeholder}
          value={value}
          onKeyDown={(e) => catchKeys(e)}
          onChange={(e) => handleChange(e)}
        />
      </InputGroup>
      {props.hasButton && <ActionButton
        id={`submit`}
        text={props.buttonText}
        onClick={() => handleSubmit()}
      />}
    </ Container>
  );
}

const Container = styled.div`
  width: 50%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
`;

const InputGroup = styled.div`
  max-width: 400px;
  width: 100%;

  display: flex;
  flex-direction: column;
  align-items: start;
  justify-content: left;
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
  border-color: black;
  border-radius: 5px;
  border-style: solid;
  border-width: 2px;
  color: black;
  margin: 5px 0px;
  
  padding: 15px 12px;
  cursor: pointer;
  font-family: Pixel;
  font-size: 12px;
  text-align: left;
  text-decoration: none;
  justify-content: center;
  align-items: center;
`;