import React, { useRef, useState } from 'react';
import styled from 'styled-components';

import { Popover } from '@mui/material';
import { playClick } from 'utils/sounds';

export interface Option {
  text: string;
  onClick: Function;
  image?: string;
  disabled?: boolean;
}

interface Props {
  id: string;
  text: string;
  options: Option[];
  size?: 'small' | 'medium';
  disabled?: boolean;
  persist?: boolean; // whether to persist menu on click
}

export function ActionListButton(props: Props) {
  const { id, text, options, disabled } = props;

  const toggleRef = useRef<HTMLButtonElement>(null);
  const [anchorEl, setAnchorEl] = useState<HTMLButtonElement | null>(null);

  const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    if (!disabled) {
      setAnchorEl(event.currentTarget);
      playClick();
    }
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  // close the menu and layer in a sound effect
  const onSelect = (option: Option) => {
    if (option.disabled) return;
    playClick();
    option.onClick();
    if (!props.persist || options.length < 2) handleClose();
  };

  const setButtonStyles = () => {
    var styles: any = {};
    if (disabled) styles.backgroundColor = '#bbb';

    const size = props.size ?? 'medium';
    if (size === 'small') {
      styles.fontSize = '.6vw';
      styles.margin = '0vw .12vw';
      styles.padding = '.2vw .5vw';
      styles.borderRadius = '.3vw';
    } else if (size === 'medium') {
      styles.fontSize = '.8vw';
      styles.margin = '0vw .16vw';
      styles.padding = '.35vw .7vw';
      styles.borderRadius = '.4vw';
    }

    return styles;
  };

  return (
    <div>
      <Button ref={toggleRef} id={id} onClick={handleClick} style={setButtonStyles()}>
        {text + ' ▾'}
      </Button>
      <Popover
        id={Boolean(anchorEl) ? 'simple-popover' : undefined}
        open={Boolean(anchorEl)}
        anchorEl={anchorEl}
        onClose={handleClose}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
      >
        <Menu>
          {options.map((o, i) => (
            <Entry key={`entry-${i}`} onClick={() => onSelect(o)} disabled={o.disabled}>
              {o.image && <Icon src={o.image} />}
              {o.text}
            </Entry>
          ))}
        </Menu>
      </Popover>
    </div>
  );
}

const Button = styled.button`
  background-color: #fff;
  border: solid black 0.15vw;
  color: black;
  display: flex;

  font-family: Pixel;
  justify-content: center;
  text-align: center;
  text-decoration: none;

  cursor: pointer;
  pointer-events: auto;
  user-select: none;
  &:hover {
    background-color: #ddd;
  }
  &:active {
    background-color: #bbb;
  }
`;

const Menu = styled.div`
  border: solid black 0.15vw;
  border-radius: 0.6vw;
  min-width: 7vw;
  font-size: 0.6vw;
`;

const Entry = styled.div<{ disabled?: boolean }>`
  background-color: ${({ disabled }) => (disabled ? '#bbb' : '#fff')};
  border-radius: 0.6vw;
  padding: 0.6vw;
  gap: 0.3vw;

  display: flex;
  justify-content: flex-start;
  align-items: center;

  cursor: pointer;
  pointer-events: ${({ disabled }) => (disabled ? 'none' : 'auto')};
  &:hover {
    background-color: #ddd;
  }
  &:active {
    background-color: #bbb;
  }
`;

const Icon = styled.img`
  width: 1.4vw;
`;
