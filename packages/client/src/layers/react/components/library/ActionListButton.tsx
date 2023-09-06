import React, { useState, useRef, useEffect } from 'react';
import styled from 'styled-components';

import clickSoundUrl from 'assets/sound/fx/mouseclick.wav';
import { dataStore } from 'layers/react/store/createStore';
import { Popover } from '@mui/material';

interface Props {
  id: string;
  text: string;
  options: Option[];
  disabled?: boolean;
  scrollPosition?: number;
}

export interface Option {
  text: string;
  onClick: Function;
}

export function ActionListButton(props: Props) {
  const { sound: { volume } } = dataStore();
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
    const clickSound = new Audio(clickSoundUrl);
    clickSound.volume = volume * 0.6;
    clickSound.play();
    option.onClick();
    handleClose();
  }

  const setStyles = () => {
    var styles: any = {};
    if (props.disabled) styles.backgroundColor = '#bbb';
    return styles;
  };

  const open = Boolean(anchorEl);
  const id = open ? 'simple-popover' : undefined;

  return (
    <div>
      <Button
        ref={toggleRef}
        id={props.id}
        onClick={handleClick}
        style={setStyles()}
      >
        {props.text + ' ▾'}
      </Button>
      <Popover
        id={id}
        open={open}
        anchorEl={anchorEl}
        onClose={handleClose}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
      >
        <Menu>
          {props.options.map((option, i) => (
            <Item key={i} onClick={() => onSelect(option)}>
              {option.text}
            </Item>
          ))}
        </Menu>
      </Popover>
    </div>
  );
}

const Button = styled.button`
  border: solid black .15vw;
  border-radius: .4vw;
  color: black;
  display: flex;

  font-family: Pixel;
  font-size: .8vw;
  justify-content: center;
  padding: .35vw .7vw;
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
  border: solid black .15vw;
  border-radius: .4vw;
  color: black;
  min-width: 7vw;
`;

const Item = styled.div`
  border-radius: .4vw;
  padding: .6vw;
  justify-content: left;

  font-family: Pixel;
  font-size: .8vw;

  cursor: pointer;
  pointer-events: auto;
  &:hover {
    background-color: #ddd;
  }
  &:active {
    background-color: #bbb;
  }
`;
