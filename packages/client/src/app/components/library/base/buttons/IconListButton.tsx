import { useRef, useState } from 'react';
import styled from 'styled-components';

import { playClick } from 'utils/sounds';
import { Popover } from '../poppers/Popover';
import { IconButton } from './IconButton';

interface Props {
  img: string;
  options: Option[];
  text?: string;
  balance?: number;
  disabled?: boolean;
  fullWidth?: boolean;
  radius?: number;
  scale?: number;
  scaleOrientation?: 'vw' | 'vh';
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
  const scaleOrientation = props.scaleOrientation ?? 'vw';
  const scale = props.scale ?? 2.5;
  const radius = props.radius ?? 0.45;

  const handleOpen = () => {
    if (!disabled && toggleRef.current) {
      playClick();
      setAnchorEl(toggleRef.current);
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
  const optionsMap = () => {
    return options.map((option, i) => MenuItem(option, i));
  };

  const MenuItem = (option: Option, i: number) => {
    return (
      <MenuOption key={i} disabled={option.disabled} onClick={() => onSelect(option)}>
        {option.image && <MenuIcon src={option.image} />}
        {option.text}
      </MenuOption>
    );
  };

  return (
    <Popover content={optionsMap()}>
      <IconButton
        img={img}
        text={text}
        onClick={handleOpen}
        disabled={disabled}
        radius={radius}
        scale={scale}
        scaleOrientation={scaleOrientation}
        fullWidth={fullWidth}
        balance={balance}
        corner={!balance}
      />
    </Popover>
  );
}

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
