import React, { useRef, useState } from 'react';
import styled from 'styled-components';

import { Popover } from '@mui/material';
import { playClick } from 'utils/sounds';

interface Props {
  id: string;
  text: string;
  options: Option[];
  size?: 'small' | 'medium';
  disabled?: boolean;
}

export interface Option {
  text: string;
  onClick: Function;
  disabled?: boolean;
}

export function ActionListButton(props: Props) {
  const toggleRef = useRef<HTMLButtonElement>(null);
  const [anchorEl, setAnchorEl] = useState<HTMLButtonElement | null>(null);

  const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    if (!props.disabled) setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  // close the menu and layer in a sound effect
  const onSelect = (option: Option) => {
    playClick();
    option.onClick();
    handleClose();
  };

  const setButtonStyles = () => {
    var styles: any = {};
    if (props.disabled) styles.backgroundColor = '#bbb';

    const size = props.size ?? 'medium';
    if (size === 'small') {
      styles.fontSize = '.6vw';
      styles.margin = '0vw .12vw';
      styles.padding = '.2vw .5vw';
      styles.borderRadius = '.3vw';
      styles.borderWidth = '.1vw';
    } else if (size === 'medium') {
      styles.fontSize = '.8vw';
      styles.margin = '0vw .16vw';
      styles.padding = '.35vw .7vw';
      styles.borderRadius = '.4vw';
      styles.borderWidth = '.15vw';
    }

    return styles;
  };

  const setMenuStyles = () => {
    var styles: any = {};

    const size = props.size ?? 'medium';
    if (size === 'small') {
      styles.fontSize = '.6vw';
      styles.borderRadius = '.3vw';
      styles.borderWidth = '.1vw';
    } else if (size === 'medium') {
      styles.fontSize = '.8vw';
      styles.borderRadius = '.4vw';
      styles.borderWidth = '.15vw';
    }

    return styles;
  };

  const MenuEntry = (option: Option, key: number) => {
    let styles: any = {};
    if (option.disabled) {
      styles.backgroundColor = '#bbb';
      styles.pointerEvents = 'none';
    }

    const onClick = option.disabled ? () => {} : () => option.onClick();

    return (
      <Item key={`MenuEntry-${key}`} onClick={onClick} style={styles}>
        {option.text}
      </Item>
    );
  };

  const open = Boolean(anchorEl);
  const id = open ? 'simple-popover' : undefined;

  return (
    <div>
      <Button ref={toggleRef} id={props.id} onClick={handleClick} style={setButtonStyles()}>
        {props.text + ' ▾'}
      </Button>
      <Popover
        id={id}
        open={open}
        anchorEl={anchorEl}
        onClose={handleClose}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
      >
        <Menu style={setMenuStyles()}>
          {props.options.map((option, i) => MenuEntry(option, i))}
        </Menu>
      </Popover>
    </div>
  );
}

const Button = styled.button`
  background-color: #fff;
  color: black;
  display: flex;

  font-family: Pixel;
  justify-content: center;
  text-align: center;
  text-decoration: none;

  cursor: pointer;
  pointer-events: auto;
  &:hover {
    background-color: #ddd;
  }
  &:active {
    background-color: #bbb;
  }
`;

const Menu = styled.div`
  border: solid black 0.15vw;
  border-radius: 0.4vw;
  color: black;
  min-width: 7vw;
`;

const Item = styled.div`
  border-radius: 0.4vw;
  padding: 0.6vw;
  justify-content: left;

  font-family: Pixel;

  cursor: pointer;
  pointer-events: auto;
  &:hover {
    background-color: #ddd;
  }
  &:active {
    background-color: #bbb;
  }
`;
