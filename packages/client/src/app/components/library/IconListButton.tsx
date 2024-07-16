import { Popover } from '@mui/material';
import { clickFx, hoverFx } from 'app/styles/effects';
import React, { useRef, useState } from 'react';
import styled from 'styled-components';

import { playClick } from 'utils/sounds';

interface Props {
  img: string;
  options: Option[];
  balance?: number;
  disabled?: boolean;
  noMargin?: boolean;
}

export interface Option {
  text: string;
  onClick: Function;
  image?: string;
  disabled?: boolean;
}

export function IconListButton(props: Props) {
  const { img, options, balance, disabled, noMargin } = props;
  const toggleRef = useRef<HTMLButtonElement>(null);
  const [anchorEl, setAnchorEl] = useState<HTMLButtonElement | null>(null);

  const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    if (!disabled) {
      playClick();
      setAnchorEl(event.currentTarget);
    }
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

  const open = Boolean(anchorEl);
  const id = open ? 'simple-popover' : undefined;

  const MenuItem = (option: Option, i: number) => {
    return (
      <Option key={i} disabled={option.disabled} onClick={() => onSelect(option)}>
        {option.image && <Icon src={option.image} />}
        {option.text}
      </Option>
    );
  };

  return (
    <div>
      <Button ref={toggleRef} onClick={handleClick} disabled={!!disabled} noMargin={!!noMargin}>
        {balance ? <Balance>{balance}</Balance> : <Corner />}
        <Image src={img} isItem={!!balance} />
      </Button>
      <Popover
        id={id}
        open={open}
        anchorEl={anchorEl}
        onClose={handleClose}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
      >
        <Menu>{options.map((option, i) => MenuItem(option, i))}</Menu>
      </Popover>
    </div>
  );
}

interface ButtonProps {
  disabled: boolean;
  noMargin: boolean;
}

const Button = styled.button<ButtonProps>`
  position: relative;
  border: solid black 0.15vw;
  border-radius: 0.4vw;
  color: black;

  padding: 0.4vw;
  display: flex;
  justify-content: center;

  margin: ${({ noMargin }) => (noMargin ? '0vw' : '0.2vw')};
  background-color: ${({ disabled }) => (disabled ? '#bbb' : '#fff')};
  cursor: ${({ disabled }) => (disabled ? 'help' : 'pointer')};
  pointer-events: ${({ disabled }) => (disabled ? 'none' : 'auto')};

  &:hover {
    animation: ${() => hoverFx()} 0.2s;
    transform: scale(1.05);
  }
  &:active {
    animation: ${() => clickFx()} 0.3s;
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

const Balance = styled.div`
  position: absolute;
  background-color: white;
  border-top: solid black 0.15vw;
  border-left: solid black 0.15vw;
  border-radius: 0.3vw 0 0.3vw 0;
  bottom: 0;
  right: 0;

  font-size: 9px;
  align-items: center;
  justify-content: center;
  padding: 0.2vw;
`;

const Icon = styled.img`
  height: 1.4vw;
`;

const Image = styled.img<{ isItem?: boolean }>`
  width: ${({ isItem }) => (isItem ? '60px' : '1.4vw')};
  height: ${({ isItem }) => (isItem ? '60px' : '1.4vw')};
`;

const Menu = styled.div`
  border: solid black 0.15vw;
  border-radius: 0.4vw;
  color: black;
  min-width: 7vw;
`;

const Option = styled.div<{ disabled?: boolean }>`
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
