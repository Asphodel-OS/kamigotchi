import { Popover } from '@mui/material';
import { useState } from 'react';
import styled from 'styled-components';

import React from 'react';
import { playClick } from 'utils/sounds';
import { IconButton } from './IconButton';

interface Props {
  img: string;
  options: Option[];
  text?: string;
  balance?: number;
  disabled?: boolean;
  fullWidth?: boolean;
  scale?: number;
  scalesOnHeight?: boolean;
}

export interface Option {
  text: string;
  onClick: () => void;
  image?: string;
  disabled?: boolean;
}

export const IconListButton = (props: Props) => {
  const { img, options, balance, fullWidth, disabled, scalesOnHeight, text } = props;
  const [anchorEl, setAnchorEl] = useState<HTMLButtonElement | null>(null);
  const open = Boolean(anchorEl);
  const id = open ? 'simple-popover' : undefined;
  const scale = props.scale ?? 1.4;
  const isIconList = true;
  const extraProps = () => {
    return { isIconList, balance, fullWidth, scalesOnHeight };
  };

  // close the menu and layer in a sound effect
  const onSelect = (option: Option) => {
    playClick();
    option.onClick();
    handleClick();
  };
  function handleClick(event?: React.MouseEvent<HTMLButtonElement>) {
    if (!disabled) {
      playClick();
      event && !anchorEl ? setAnchorEl(event.currentTarget) : setAnchorEl(null);
    }
  }

  const MenuItem = (option: Option, i: number) => {
    return (
      <MenuOption key={i} disabled={option.disabled} onClick={() => onSelect(option)}>
        {option.image && <MenuIcon src={option.image} />}
        {option.text}
      </MenuOption>
    );
  };

  return (
    <Wrapper>
      <div
        onClick={(e: React.MouseEvent<any>) => {
          handleClick(e);
        }}
      >
        <IconButton
          img={img}
          disabled={!!disabled}
          onClick={handleClick}
          text={text}
          size={scale}
          utils={{ extraProps }}
        />
        <Popover
          id={id}
          open={open}
          anchorEl={anchorEl}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
        >
          <Menu>{options.map((option, i) => MenuItem(option, i))}</Menu>
        </Popover>
      </div>
    </Wrapper>
  );
};

const Wrapper = styled.div`
  width: auto;
`;

const Menu = styled.div`
  border: solid black 0.15vw;
  border-radius: 0.6vw;
  color: black;
  min-width: 6vw;
`;

const MenuOption = styled.div<{ disabled?: boolean }>`
  display: flex;
  align-items: center;
  gap: 0.4vw;
  border-radius: 0.4vw;
  padding: 0.6vw;
  justify-content: left;
  font-size: 0.8vw;
  cursor: ${({ disabled }) => (disabled ? 'none' : 'pointer')};
  pointer-events: ${({ disabled }) => (disabled ? 'none' : 'auto')};
  background-color: ${({ disabled }) => (disabled ? '#bbb' : '#fff')};
  &:hover {
    background-color: #ddd;
  }
  &:active {
    background-color: #bbb;
  }
`;

const MenuIcon = styled.img`
  height: 1.4vw;
`;
