import React, { useState, useRef } from 'react';
import styled from 'styled-components';

import { Popover } from '@mui/material';
import { playClick } from 'utils/sounds';

interface Props {
  id: string;
  img: string;
  options: Option[];
  disabled?: boolean;
}

export interface Option {
  text: string;
  onClick: Function;
  disabled?: boolean;
}

export function IconListButton(props: Props) {
  const toggleRef = useRef<HTMLButtonElement>(null);
  const [anchorEl, setAnchorEl] = useState<HTMLButtonElement | null>(null);

  const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    playClick();
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

  const element = (option: Option, i: number) => {
    if (option.disabled)
      return (
        <Item key={i} style={{ backgroundColor: '#ccc' }}>
          {option.text}
        </Item>
      );
    else
      return (
        <Item key={i} onClick={() => onSelect(option)}>
          {option.text}
        </Item>
      );
  };

  return (
    <div>
      <Button ref={toggleRef} id={props.id} onClick={handleClick} style={setStyles()}>
        <Corner />
        <Image src={props.img} />
      </Button>
      <Popover
        id={id}
        open={open}
        anchorEl={anchorEl}
        onClose={handleClose}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
      >
        <Menu>{props.options.map((option, i) => element(option, i))}</Menu>
      </Popover>
    </div>
  );
}

const Button = styled.button`
  position: relative;
  background-color: #fff;
  border: solid black 0.15vw;
  border-radius: 0.4vw;
  color: black;

  margin: 0.2vw;
  padding: 0.4vw;

  display: flex;
  font-family: Pixel;
  font-size: 0.8vw;
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

const Corner = styled.div`
  position: absolute;
  border: solid black 0.3vw;
  border-color: transparent black black transparent;
  right: 0;
  bottom: 0;
  width: 0;
  height: 0;
`;

const Image = styled.img`
  width: 1.4vw;
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
