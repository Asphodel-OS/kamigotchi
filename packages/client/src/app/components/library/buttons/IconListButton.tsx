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
  search?: Search;
}

export interface Option {
  text: string;
  onClick: Function;
  image?: string;
  disabled?: boolean;
}

interface Search {
  value: string;
  onChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
  placeholder?: string;
}

export function IconListButton(props: Props) {
  const { img, options, text, balance } = props;
  const { radius, scale, scaleOrientation, search } = props;
  const { disabled, fullWidth } = props;

  const toggleRef = useRef<HTMLButtonElement>(null);
  const [anchorEl, setAnchorEl] = useState<HTMLButtonElement | null>(null);

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
  const OptionsMap = () => {
    return (
      <MenuWrapper search={!!props.search}>
        {props.search && (
          <MenuInput
            {...props.search}
            onClick={(e) => {
              e.stopPropagation();
            }}
          />
        )}
        {options
          .filter((option) => (!search ? true : option.text.toLowerCase().includes(search.value)))
          .map((option, i) => (
            <MenuOption key={i} disabled={option.disabled} onClick={() => onSelect(option)}>
              {option.image && <MenuIcon src={option.image} />}
              {option.text}
            </MenuOption>
          ))}
      </MenuWrapper>
    );
  };

  return (
    <Popover content={OptionsMap()}>
      <IconButton
        img={img}
        text={text}
        onClick={handleOpen}
        disabled={disabled}
        radius={radius ?? 0.45}
        scale={scale ?? 2.5}
        scaleOrientation={scaleOrientation ?? 'vw'}
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
  user-drag: none;
`;

const MenuInput = styled.input`
  height: 2.5vw;
  width: 100%;
  box-sizing: border-box;
  border: 0.15vw solid black;
  border-radius: 0.45vw;
  font-size: 0.75vw;
  padding: 0vw 0.5vw;
  margin-bottom: 0.6vw;
`;

const MenuWrapper = styled.div<{ search?: boolean }>`
  padding: ${({ search }) => (search ? '1vw' : '0vw')};
`;
