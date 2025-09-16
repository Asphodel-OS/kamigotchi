import { useRef, useState } from 'react';
import styled from 'styled-components';

import { playClick } from 'utils/sounds';
import { Popover } from '../poppers/Popover';
import { IconButton } from './IconButton';

export interface Option {
  text: string;
  onClick: Function;
  image?: string;
  disabled?: boolean;
}

export function IconListButton({
  img,
  options,
  text,
  balance,
  disabled,
  width,
  fullWidth,
  radius,
  scale,
  scaleOrientation,
  searchable,
  icon,
}: {
  img: string;
  options: Option[];

  text?: string;
  balance?: number;
  disabled?: boolean;
  width?: number;
  fullWidth?: boolean;
  radius?: number;
  scale?: number;
  scaleOrientation?: 'em' | 'em';

  searchable?: boolean;
  icon?: { inset?: { px?: number; x?: number; y?: number } };
}) {
  const toggleRef = useRef<HTMLButtonElement>(null);
  const [anchorEl, setAnchorEl] = useState<HTMLButtonElement | null>(null);
  const [search, setSearch] = useState<string>('');

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

  const OptionsMap = () => {
    return (
      <MenuWrapper>
        {searchable && (
          <MenuInput
            onClick={(e) => {
              e.stopPropagation();
            }}
            onChange={(e) => {
              setSearch(e.target.value);
            }}
          />
        )}
        {options
          .filter((option) => !searchable || option.text.toLowerCase().includes(search))
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
        scaleOrientation={scaleOrientation ?? 'em'}
        width={width}
        fullWidth={fullWidth}
        balance={balance}
        corner={!balance}
        icon={icon}
      />
    </Popover>
  );
}

const MenuOption = styled.div<{ disabled?: boolean }>`
  display: flex;
  align-items: center;
  gap: 0.4rem;

  border-radius: 0.4rem;
  padding: 0.6rem;
  justify-content: left;
  font-size: 0.8rem;

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
  height: 1.4rem;
  user-drag: none;
`;

const MenuInput = styled.input`
  position: sticky;
  border: 0.15rem solid black;
  border-radius: 0.45rem;

  width: 90%;
  height: 2.5rem;
  box-sizing: border-box;
  top: 0.6rem;

  padding: 0rem 0.6rem;
  margin: 0.6rem;
  flex-grow: 1;

  font-size: 0.75rem;
`;

const MenuWrapper = styled.div`
  position: relative;
`;
