import { Popover } from '@mui/material';
import React, { useRef, useState } from 'react';
import styled from 'styled-components';

import { hoverFx } from 'app/styles/effects';
import { playClick } from 'utils/sounds';

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
  onClick: Function;
  image?: string;
  disabled?: boolean;
}

export function IconListButton(props: Props) {
  const { img, options, text, balance } = props;
  const { disabled, fullWidth } = props;
  const toggleRef = useRef<HTMLButtonElement>(null);
  const [anchorEl, setAnchorEl] = useState<HTMLButtonElement | null>(null);
  const scale = props.scale ?? 1.4;
  const scaleOrientation = props.scalesOnHeight ? 'vh' : 'vw';

  const handleOpen = (event: React.MouseEvent<HTMLButtonElement>) => {
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
      <MenuOption key={i} disabled={option.disabled} onClick={() => onSelect(option)}>
        {option.image && <MenuIcon src={option.image} />}
        {option.text}
      </MenuOption>
    );
  };

  return (
    <Wrapper>
      <Button ref={toggleRef} onClick={handleOpen} disabled={!!disabled} fullWidth={!!fullWidth}>
        {balance ? <Balance>{balance}</Balance> : <Corner />}
        <Image src={img} scale={scale} orientation={scaleOrientation} />
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

const Wrapper = styled.div`
  width: auto;
`;

interface ButtonProps {
  disabled: boolean;
  fullWidth: boolean;
}

const Button = styled.button<ButtonProps>`
  position: relative;
  border: solid black 0.15vw;
  border-radius: 0.45vw;
  color: black;

  width: ${({ fullWidth }) => (fullWidth ? '100%' : 'auto')};
  padding: 0.4vw;
  gap: 0.4vw;
  display: flex;
  justify-content: center;
  align-items: center;

  background-color: ${({ disabled }) => (disabled ? '#bbb' : '#fff')};
  cursor: ${({ disabled }) => (disabled ? 'help' : 'pointer')};
  pointer-events: ${({ disabled }) => (disabled ? 'none' : 'auto')};

  &:hover {
    animation: ${() => hoverFx()} 0.2s;
    transform: scale(1.05);
  }
`;

const Image = styled.img<{ scale: number; orientation: string }>`
  width: ${({ scale }) => scale}${({ orientation }) => orientation};
  height: ${({ scale }) => scale}${({ orientation }) => orientation};
  ${({ scale }) => (scale > 3.2 ? 'image-rendering: pixelated;' : '')}
`;

const Text = styled.div`
  font-size: 0.8vw;
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

  font-size: 0.75vw;
  align-items: center;
  justify-content: center;
  padding: 0.2vw;
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
