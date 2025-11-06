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
  width,
  fullWidth,
  radius,
  scale,
  scaleOrientation,
  searchable,
  icon,
  filter,
  shake,
  tooltip,
  disabled,
}: {
  options: Option[];
  searchable?: boolean;
  filter?: string;

  // button
  img?: string;
  text?: string;
  icon?: { inset?: { px?: number; x?: number; y?: number } };
  radius?: number;
  scale?: number;
  scaleOrientation?: 'vw' | 'vh';
  width?: number;
  fullWidth?: boolean;
  balance?: number;
  shake?: boolean;

  // tooltip
  tooltip?: {
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

  disabled?: boolean;
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
              {option.image && <OptionIcon src={option.image} />}
              {option.text && <OptionText>{option.text}</OptionText>}
            </MenuOption>
          ))}
      </MenuWrapper>
    );
  };

  return (
    <Popover content={OptionsMap()} maxHeight={33} fullWidth={fullWidth} disabled={disabled}>
      <TextTooltip {...tooltip} text={tooltip?.text ?? ['']}>
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
          filter={filter}
          shake={shake}
        />
      </TextTooltip>
    </Popover>
  );
}

const MenuWrapper = styled.div`
  position: relative;
  max-width: 30vw;
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

const MenuOption = styled.div<{ disabled?: boolean }>`
  position: relative;
  background-color: ${({ disabled }) => (disabled ? '#bbb' : '#fff')};
  border-radius: 0.45vw;

  width: 100%;
  padding: 0.45vw;
  gap: 0.6vw;

  display: flex;
  align-items: center;

  cursor: ${({ disabled }) => (disabled ? 'none' : 'pointer')};
  pointer-events: ${({ disabled }) => (disabled ? 'none' : 'auto')};

  &:hover {
    background-color: #7d7;
    background-color: #ddd;
    outline: 0.15vw solid #444;
    z-index: 1;
  }
  &:active {
    background-color: #bbb;
  }
`;

const OptionIcon = styled.img`
  border-radius: 0.3vw;
  height: 1.8vw;
  user-drag: none;
`;

const OptionText = styled.div`
  height: 100%;

  display: flex;
  justify-content: flex-start;
  align-items: center;

  font-size: 0.9vw;
  line-height: 1.5vw;
`;
