import React, { useState } from 'react';
import styled from 'styled-components';

import { ActionIcons } from 'assets/images/icons/actions';
import { playClick } from 'utils/sounds';
import { IconButton } from '../buttons';
import { TextTooltip } from '../poppers/TextTooltip';

// InputSingleTextForm is a styled input field with some additional frills
export const InputSingleTextForm = ({
  maxLen,
  fullWidth,
  label,
  placeholder,
  onSubmit,
  hasButton,
  buttonIcon = ActionIcons.chat,
  disabled,
  initialValue = '',
}: {
  fullWidth?: boolean; // whether the input should take up the full width of its container
  label?: string; // the label for the input
  maxLen?: number; // the maximum length of the input
  placeholder?: string; // placeholder for empty input
  initialValue?: string; // the initial value of the input
  onSubmit?: (text: string) => void; // the function to call when the submit button is clicked
  hasButton?: boolean; // whether the input has a submit button
  buttonIcon?: string; // the icon to display on the button
  disabled?: boolean; // whether the input is disabled
}) => {
  const isDisabled = !!disabled;

  const [value, setValue] = useState(initialValue);

  /////////////////
  // INTERACTION

  const catchKeys = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter' && value.length > 0) handleSubmit();
  };

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

  /////////////////
  // INTERPRETATION

  return (
    <Container fullWidth={fullWidth}>
      <InputGroup>
        {label && <Label>{label}</Label>}
        <Input
          type='text'
          value={value}
          placeholder={placeholder}
          onKeyDown={(e) => catchKeys(e)}
          onChange={(e) => handleChange(e)}
          disabled={isDisabled}
        />
      </InputGroup>
      {hasButton && (
        <TextTooltip text={isDisabled ? [] : ['submit']}>
          <IconButton
            img={buttonIcon}
            onClick={() => handleSubmit()}
            disabled={isDisabled || value.length === 0}
          />
        </TextTooltip>
      )}
    </Container>
  );
};

const Container = styled.div<{ fullWidth?: boolean }>`
  width: ${({ fullWidth }) => (fullWidth ? '100%' : '50%')};
  display: flex;
  flex-direction: row;
  align-items: flex-end;
  justify-content: center;
  gap: 0.3em;
`;

const InputGroup = styled.div`
  width: 100%;

  display: flex;
  flex-direction: column;
  align-items: start;
  justify-content: left;
`;

const Label = styled.label`
  font-size: 0.6em;
  color: #333;
  margin: 0.3em;
  text-align: left;
`;

const Input = styled.input`
  border: solid 0.15em black;
  border-radius: 0.4em;

  background-color: #ffffff;
  width: 100%;
  color: black;
  padding: 0.75em 1em;

  font-size: 0.75em;
  text-align: left;
  text-decoration: none;

  justify-content: center;
  align-items: center;

  &:disabled {
    background-color: #ccc;
  }
`;
