import { useRef, useState } from 'react';
import styled from 'styled-components';

import { playClick } from 'utils/sounds';

import { Popover } from '../poppers';
import { TextTooltip } from '../tooltips';
import { IconButton } from './IconButton';

export interface Option {
  text: string;
  onClick?: Function;
  image?: string;
  disabled?: boolean;
  options?: Option[];
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
  searchable,
  icon,
  filter,
  shake,
  tooltip,
  disabled,
  menuButton = false,
  cooldownBackground,
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
  width?: number;
  fullWidth?: boolean;
  balance?: number;
  shake?: boolean;
  menuButton?: boolean;
  cooldownBackground?: string;

  // tooltip
  tooltip?: {
    text: string[] | React.ReactNode[];
    title?: string;
    children?: React.ReactNode;
    grow?: boolean;
    direction?: 'row' | 'column';
    delay?: number;
    width?: { desktop?: number; mobile?: number };
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
  const [forceCloseAll, setForceCloseAll] = useState(false);

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
    if (option.onClick) {
      playClick();
      option.onClick();
      handleClose();
      setForceCloseAll(true);
    }
  };

  const NestedMenuOption = ({ option }: { option: Option }) => {
    if (option.options) {
      const nestedContent = (
        <div>
          {option.options.map((subOption, j) => (
            <MenuOption
              key={j}
              disabled={subOption.disabled}
              onClick={(e) => {
                e.stopPropagation();
                onSelect(subOption);
              }}
            >
              {subOption.image && <OptionIcon src={subOption.image} />}
              {subOption.text && <OptionText>{subOption.text}</OptionText>}
            </MenuOption>
          ))}
        </div>
      );

      return (
        <Popover content={nestedContent}>
          <MenuOption disabled={option.disabled}>
            {option.image && <OptionIcon src={option.image} />}
            {option.text && <OptionText>{option.text}</OptionText>}
          </MenuOption>
        </Popover>
      );
    }

    return (
      <MenuOption disabled={option.disabled} onClick={() => onSelect(option)}>
        {option.image && <OptionIcon src={option.image} />}
        {option.text && <OptionText>{option.text}</OptionText>}
      </MenuOption>
    );
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
            <NestedMenuOption key={i} option={option} />
          ))}
      </MenuWrapper>
    );
  };

  return (
    <Popover
      content={OptionsMap()}
      maxHeight={33}
      fullWidth={fullWidth}
      disabled={disabled}
      forceClose={forceCloseAll}
      onClose={() => setForceCloseAll(false)}
    >
      <TextTooltip {...tooltip} text={tooltip?.text ?? ['']}>
        <IconButton
          img={img}
          text={text}
          onClick={handleOpen}
          disabled={disabled}
          radius={radius ?? 0.45}
          scale={scale}
          width={width}
          fullWidth={fullWidth}
          balance={balance}
          corner={!balance}
          icon={icon}
          filter={filter}
          shake={shake}
          cooldownBackground={cooldownBackground}
        />
      </TextTooltip>
    </Popover>
  );
}

const MenuWrapper = styled.div`
  position: relative;
  max-width: 30em;
`;

const MenuInput = styled.input`
  position: sticky;
  border: 0.15em solid black;
  border-radius: 0.45em;

  width: 90%;
  height: 2.5em;

  box-sizing: border-box;
  top: 0.6em;

  padding: 0em 0.6em;
  margin: 0.6em;
  flex-grow: 1;

  font-size: 0.75em;
`;

const MenuOption = styled.div<{ disabled?: boolean }>`
  position: relative;
  background-color: ${({ disabled }) => (disabled ? '#bbb' : '#fff')};
  border-radius: 0.45em;

  width: 100%;
  padding: 0.45em;
  gap: 0.6em;

  display: flex;
  align-items: center;

  cursor: ${({ disabled }) => (disabled ? 'none' : 'pointer')};
  pointer-events: ${({ disabled }) => (disabled ? 'none' : 'auto')};

  &:hover {
    background-color: #7d7;
    background-color: #ddd;
    outline: 0.15em solid #444;
    z-index: 1;
  }
  &:active {
    background-color: #bbb;
  }
`;

const OptionIcon = styled.img`
  border-radius: 0.3em;
  height: 2em;
  user-drag: none;
`;

const OptionText = styled.div`
  height: 100%;
  display: flex;
  justify-content: flex-start;
  align-items: center;
  font-size: 1em;
  line-height: 1.5em;
`;
