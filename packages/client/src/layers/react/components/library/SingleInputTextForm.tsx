import React, { useEffect, useState } from 'react';
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
}

// SingleInputTextForm is a styled input field with some additional frills
export const SingleInputTextForm = (props: Props) => {
  const { sound: { volume } } = dataStore();
  const [value, setValue] = useState('');

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setValue(event.target.value);
  };

  const handleSubmit = () => {
    const clickSound = new Audio(clickSoundUrl);
    clickSound.volume = volume * 0.6;
    clickSound.play();
    props.onSubmit && props.onSubmit(value);
  };

  const catchKeys = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter') {
      handleSubmit();
      console.log(`entered ${value}`);
    }
  };

  return (
    <Container id={props.id}>
      {props.label && <Label>{props.label}</Label>}
      <Input
        type='text'
        placeholder={props.placeholder}
        value={value}
        onKeyDown={(e) => catchKeys(e)}
        onChange={(e) => handleChange(e)}
      />
      {props.hasButton && <ActionButton id={`submit`} text='Submit' onClick={() => handleSubmit()} />}
    </ Container>
  );
}

const Container = styled.div`
  width: 100%;
  margin: 20px 5px;
  display: flex;
  flex-direction: column;
  align-items: left;
  justify-content: center;
`;

const Label = styled.label`
  font-family: Pixel;
  font-size: 10px;
  color: #333;
  margin: 0px 5px;
`;

const Input = styled.input`
  background-color: #ffffff;
  border-style: solid;
  border-width: 2px;
  border-color: black;
  color: black;
  padding: 15px 12px;
  margin: 5px 0px;

  text-align: left;
  text-decoration: none;
  display: inline-block;
  font-size: 12px;
  cursor: pointer;
  border-radius: 5px;
  justify-content: center;
  font-family: Pixel;
`;