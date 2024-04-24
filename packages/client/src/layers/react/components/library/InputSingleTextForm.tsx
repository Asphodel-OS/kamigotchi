import React, { useState } from 'react';
import styled from 'styled-components';

import PlaceholderIcon from 'assets/images/icons/placeholder.png';
import { playClick } from 'utils/sounds';
import { IconButton } from './IconButton';
import { Tooltip } from './Tooltip';

interface Props {
  fullWidth?: boolean; // whether the input should take up the full width of its container
  label?: string; // the label for the input
  placeholder?: string; // placeholder for empty input
  maxLen?: number; // the maximum length of the input
  initialValue?: string; // the initial value of the input
  hasButton?: boolean; // whether the input has a submit button
  onSubmit?: (text: string) => void; // the function to call when the submit button is clicked
  disabled?: boolean; // whether the input is disabled
  buttonIcon?: string; // the icon to display on the button
}

// InputSingleTextForm is a styled input field with some additional frills
export const InputSingleTextForm = (props: Props) => {
  const { maxLen, fullWidth, label, placeholder, onSubmit } = props;
  const { hasButton, buttonIcon } = props;
  const [value, setValue] = useState(props.initialValue || '');
  let styleOverride = {};
  if (fullWidth) styleOverride = { width: '100%' };

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    let value = event.target.value;
    if (maxLen && value.length > maxLen) value = value.slice(0, maxLen);
    setValue(value);
  };

  const handleSubmit = () => {
    playClick();
    if (onSubmit) onSubmit(value);
    setValue('');
  };

  const catchKeys = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter' && value.length > 0) handleSubmit();
  };

  return (
    <Container style={styleOverride}>
      <InputGroup>
        {label && <Label>{label}</Label>}
        <Input
          type='text'
          placeholder={placeholder}
          value={value}
          onKeyDown={(e) => catchKeys(e)}
          onChange={(e) => handleChange(e)}
          disabled={props.disabled}
        />
      </InputGroup>
      {hasButton && (
        <Tooltip text={['submit']}>
          <IconButton img={buttonIcon ?? PlaceholderIcon} onClick={() => handleSubmit()} />
        </Tooltip>
      )}
    </Container>
  );
};

const Container = styled.div`
  width: 50%;
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: center;
  gap: 0.6vw;
`;

const InputGroup = styled.div`
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
  border: solid 0.15vw black;
  border-radius: 0.4vw;

  background-color: #ffffff;
  width: 100%;
  color: black;
  margin: 0.1vw 0vw;
  padding: 0.8vw 1vw;

  font-family: Pixel;
  font-size: 0.8vw;
  text-align: left;
  text-decoration: none;

  justify-content: center;
  align-items: center;

  &:disabled {
    background-color: #ccc;
  }
`;
