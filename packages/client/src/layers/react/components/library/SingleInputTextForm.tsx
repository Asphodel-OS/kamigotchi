import React, { useState } from 'react';
import styled from 'styled-components';

import { ActionButton } from 'layers/react/components/library/ActionButton';
import { dataStore } from 'layers/react/store/createStore';
import clickSoundUrl from 'assets/sound/fx/mouseclick.wav';

interface Props {
  id: string;
  label?: string;
  placeholder?: string;
  onSubmit?: Function;
  hasButton?: boolean;
  initialValue?: string;
  fullWidth?: boolean;
}

// SingleInputTextForm is a styled input field with some additional frills
export const SingleInputTextForm = (props: Props) => {
  const { sound: { volume } } = dataStore();
  const [value, setValue] = useState(props.initialValue || '');
  let styleOverride = {};
  if (props.fullWidth) styleOverride = { width: '100%' };

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setValue(event.target.value);
  };

  const handleSubmit = () => {
    const clickSound = new Audio(clickSoundUrl);
    clickSound.volume = volume * 0.6;
    clickSound.play();
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
      {props.hasButton && <ActionButton id={`submit`} text='Submit' onClick={() => handleSubmit()} />}
    </ Container>
  );
}

const Container = styled.div`
  width: 50%;
  margin: 20px 5px;
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