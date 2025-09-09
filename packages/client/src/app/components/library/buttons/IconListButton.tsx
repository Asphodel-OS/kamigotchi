import { useRef, useState } from 'react';
import styled from 'styled-components';

import { playClick } from 'utils/sounds';
import { TextTooltip } from '../poppers';
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
  tooltipProps,
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
  scaleOrientation?: 'vw' | 'vh';
  searchable?: boolean;
  icon?: { inset?: { px?: number; x?: number; y?: number } };
  tooltipProps?: {
    text: string[] | React.ReactNode[];
    title?: string;
    children?: React.ReactNode;
    grow?: boolean;
    direction?: 'row' | 'column';
    delay?: number;
    maxWidth?: number;
    size?: number;
    alignText?: 'left' | 'right' | 'center';
    color?: string;
    fullWidth?: boolean;
  };
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
    <Popover fullWidth={fullWidth} content={OptionsMap()} disabled={disabled}>
      <TextTooltip {...tooltipProps} text={tooltipProps?.text ?? ['']}>
        <IconButton
          img={img}
          text={text}
          onClick={handleOpen}
          disabled={disabled}
          radius={radius ?? 0.45}
          scale={scale ?? 2.5}
          scaleOrientation={scaleOrientation ?? 'vw'}
          width={width}
          fullWidth={fullWidth}
          balance={balance}
          corner={!balance}
          icon={icon}
        />
      </TextTooltip>
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
  position: sticky;
  border: 0.15vw solid black;
  border-radius: 0.45vw;

  width: 90%;
  height: 2.5vw;
  box-sizing: border-box;
  top: 0.6vw;

  padding: 0vw 0.6vw;
  margin: 0.6vw;
  flex-grow: 1;

  font-size: 0.75vw;
`;

const MenuWrapper = styled.div`
  position: relative;
`;
