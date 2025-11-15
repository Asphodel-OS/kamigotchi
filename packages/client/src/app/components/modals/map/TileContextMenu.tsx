import { useEffect, useRef } from 'react';
import styled from 'styled-components';

import { playClick } from 'utils/sounds';

export interface ContextMenuOption {
  text: string;
  onClick: Function;
  image?: string;
  disabled?: boolean;
}

export const TileContextMenu = ({
  options,
  position,
  onClose,
}: {
  options: ContextMenuOption[];
  position: { x: number; y: number };
  onClose: () => void;
}) => {
  const menuRef = useRef<HTMLDivElement>(null);

  // listen for clicking outside the menu
  useEffect(() => {
    const timer = setTimeout(() => {
      document.addEventListener('mousedown', handleClickOutside);
    }, 100);

    return () => {
      clearTimeout(timer);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [onClose]);

  // close the menu when an outside click is detected
  const handleClickOutside = (event: MouseEvent) => {
    if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
      onClose();
    }
  };

  return (
    <MenuContainer
      ref={menuRef}
      style={{
        left: `${position.x}px`,
        top: `${position.y}px`,
      }}
    >
      {options.map((option, index) => (
        <MenuItem
          key={index}
          disabled={option.disabled}
          onClick={(e) => {
            e.stopPropagation();
            if (option.disabled) return;
            playClick();
            option.onClick();
            onClose();
          }}
        >
          {option.image && <Icon src={option.image} />}
          <Text>{option.text}</Text>
        </MenuItem>
      ))}
    </MenuContainer>
  );
};

const MenuContainer = styled.div`
  position: fixed;
  background-color: white;
  border: 0.15vw solid black;
  border-radius: 0.4vw;
  z-index: 1000;
  min-width: 10vw;
  box-shadow: 0 0.2vw 0.5vw rgba(0, 0, 0, 0.2);
  font-family: Pixel;
`;

const MenuItem = styled.div<{ disabled?: boolean }>`
  background-color: ${({ disabled }) => (disabled ? '#bbb' : '#fff')};
  border-radius: 0.6vw;
  padding: 0.6vw;
  gap: 0.3vw;
  display: flex;
  justify-content: flex-start;
  align-items: center;
  cursor: ${({ disabled }) => (disabled ? 'not-allowed' : 'pointer')};
  pointer-events: ${({ disabled }) => (disabled ? 'none' : 'auto')};
  user-select: none;

  &:hover {
    background-color: ${({ disabled }) => (disabled ? '#bbb' : '#ddd')};
  }

  &:active {
    background-color: #bbb;
  }
`;

const Icon = styled.img`
  width: 1.4vw;
  image-rendering: pixelated;
  user-drag: none;
`;

const Text = styled.span`
  white-space: nowrap;
`;
