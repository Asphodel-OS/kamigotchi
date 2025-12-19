import React, { useRef, useState } from 'react';
import styled from 'styled-components';

import { playClick } from 'utils/sounds';
import { Popover } from '../poppers/Popover';

export interface Option {
  text: string;
  onClick: Function;
  image?: string;
  disabled?: boolean;
}

export const ActionListButton = ({
  id,
  text,
  options,
  size = 'medium',
  disabled = false,
  persist = false,
}: {
  id: string;
  text: string;
  options: Option[];
  size?: 'small' | 'medium';
  disabled?: boolean;
  persist?: boolean; // whether to persist menu on click
}) => {
  const toggleRef = useRef<HTMLButtonElement>(null);
  const [anchorEl, setAnchorEl] = useState<HTMLButtonElement | null>(null);

  const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    if (!disabled) {
      setAnchorEl(event.currentTarget);
      playClick();
    }
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  // close the menu and layer in a sound effect
  const onSelect = (option: Option) => {
    if (option.disabled) return;
    playClick();
    option.onClick();
    if (!persist || options.length < 2) handleClose();
  };

  const setButtonStyles = () => {
    const styles: any = {};
    if (disabled) styles.backgroundColor = '#bbb';

    if (size === 'small') {
      styles.fontSize = '.6em';
      styles.margin = '0em .12em';
      styles.padding = '.2em .5em';
      styles.borderRadius = '.3em';
    } else if (size === 'medium') {
      styles.fontSize = '.8em';
      styles.margin = '0em .16em';
      styles.padding = '.35em .7em';
      styles.borderRadius = '.4em';
    }

    return styles;
  };

  const optionsMap = () => {
    return options.map((o, i) => (
      <Entry key={`entry-${i}`} onClick={() => onSelect(o)} disabled={o.disabled}>
        {o.image && <Icon src={o.image} />}
        {o.text}
      </Entry>
    ));
  };

  return (
    <Popover content={optionsMap()}>
      <Button ref={toggleRef} id={id} onClick={handleClick} style={setButtonStyles()}>
        {text + ' ▾'}
      </Button>
    </Popover>
  );
}

const Button = styled.button`
  background-color: #fff;
  border: solid black 0.15em;
  color: black;
  display: flex;

  font-family: Pixel;
  justify-content: center;
  text-align: center;
  text-decoration: none;

  cursor: pointer;
  pointer-events: auto;
  user-select: none;
  &:hover {
    background-color: #ddd;
  }
  &:active {
    background-color: #bbb;
  }
`;

const Entry = styled.div<{ disabled?: boolean }>`
  background-color: ${({ disabled }) => (disabled ? '#bbb' : '#fff')};
  border-radius: 0.6em;
  padding: 0.6em;
  gap: 0.3em;

  display: flex;
  justify-content: flex-start;
  align-items: center;

  cursor: pointer;
  pointer-events: ${({ disabled }) => (disabled ? 'none' : 'auto')};
  &:hover {
    background-color: #ddd;
  }
  &:active {
    background-color: #bbb;
  }
`;

const Icon = styled.img`
  width: 1.4em;
  user-drag: none;
`;
