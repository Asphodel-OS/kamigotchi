import { Popover } from '@mui/material';
import { clickFx, hoverFx } from 'app/styles/effects';
import React, { useRef, useState } from 'react';
import styled from 'styled-components';

import { playClick } from 'utils/sounds';

interface Props {
  img: string;
  options: Option[];
  text?: string;
  balance?: number;
  disabled?: boolean;
  fullWidth?: boolean;
  noBounce?: boolean;
}

export interface Option {
  text: string;
  onClick: Function;
  image?: string;
  disabled?: boolean;
}

export function IconListButton(props: Props) {
  const { img, options, text, balance } = props;
  const { disabled, fullWidth, noBounce } = props;
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
    <Wrapper>
      <Button
        ref={toggleRef}
        onClick={handleClick}
        disabled={!!disabled}
        fullWidth={!!fullWidth}
        noBounce={!!noBounce}
      >
        {balance ? <Balance>{balance}</Balance> : <Corner />}
        <Image src={img} isItem={!!balance} />
        {text && <Text>{text}</Text>}
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
    </Wrapper>
  );
}

interface ButtonProps {
  disabled: boolean;
  fullWidth: boolean;
  noBounce: boolean;
}

const Wrapper = styled.div`
  width: 100%;
`;

const Button = styled.button<ButtonProps>`
  position: relative;
  border: solid black 0.15vw;
  border-radius: 0.4vw;
  color: black;

  width: 100%;
  padding: 0.4vw;
  gap: 0.4vw;
  display: flex;
  justify-content: center;
  align-items: center;

  background-color: ${({ disabled }) => (disabled ? '#bbb' : '#fff')};
  cursor: ${({ disabled }) => (disabled ? 'help' : 'pointer')};
  pointer-events: ${({ disabled }) => (disabled ? 'none' : 'auto')};

  ${({ noBounce }) =>
    noBounce
      ? `
        &:hover {
          background-color: #bbb;
        }
        &:active {
          background-color: #999;
        `
      : `
        &:hover {
          animation: ${() => hoverFx()} 0.2s;
          transform: scale(1.05);
        }
        &:active {
          animation: ${() => clickFx()} 0.3s;
        }
      `}
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
  ${({ isItem }) => (isItem ? 'image-rendering: pixelated;' : '')}
`;

const Text = styled.div`
  font-family: Pixel;
  font-size: 0.8vw;
`;

const Menu = styled.div`
  border: solid black 0.15vw;
  border-radius: 3.5px;
  color: black;
  min-width: 6vw;
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
