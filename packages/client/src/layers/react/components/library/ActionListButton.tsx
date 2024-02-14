import React, { useRef, useState } from 'react';
import styled from 'styled-components';

import { Popover } from '@mui/material';
import { playClick } from 'utils/sounds';

interface Props {
  id: string;
  text: string;
  options: Option[];
  disabled?: boolean;
}

export interface Option {
  text: string;
  onClick: Function;
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

  const setStyles = () => {
    var styles: any = {};
    if (props.disabled) styles.backgroundColor = '#bbb';
    return styles;
  };

  const open = Boolean(anchorEl);
  const id = open ? 'simple-popover' : undefined;

  return (
    <div>
      <Button ref={toggleRef} id={props.id} onClick={handleClick} style={setStyles()}>
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
  background-color: #fff;
  border: solid black 0.15vw;
  border-radius: 0.4vw;
  color: black;
  display: flex;

  font-family: Pixel;
  font-size: 0.8vw;
  justify-content: center;
  padding: 0.35vw 0.7vw;
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
  font-size: 0.8vw;

  cursor: pointer;
  pointer-events: auto;
  &:hover {
    background-color: #ddd;
  }
  &:active {
    background-color: #bbb;
  }
`;
