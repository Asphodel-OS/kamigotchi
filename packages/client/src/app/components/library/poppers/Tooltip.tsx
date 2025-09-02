import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import styled from 'styled-components';

export const Tooltip = ({
  children,
  grow,
  direction,
  delay = 350,
  maxWidth,
  color,
  content,
  isDisabled,
  fullWidth,
}: {
  children: React.ReactNode;
  grow?: boolean;
  direction?: 'row' | 'column';
  delay?: number;
  maxWidth?: number;
  color?: string;
  content: React.ReactNode;
  isDisabled: boolean;
  fullWidth?: boolean;
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const [isActive, setIsActive] = useState(false);
  const [tooltipPosition, setTooltipPosition] = useState({ x: 0, y: 0 });

  const tooltipRef = useRef<HTMLDivElement>(document.createElement('div'));

  /////////////////
  // HANDLERS

  const handleMouseMove = (event: React.MouseEvent) => {
    const { clientX: cursorX, clientY: cursorY } = event;
    const width = tooltipRef.current?.offsetWidth || 0;
    const height = tooltipRef.current?.offsetHeight || 0;
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    let x = cursorX + 12;
    let y = cursorY + 12;
    if (x + width + 10 > viewportWidth) {
      x = cursorX - width - 10;
    }
    if (y + height + 10 > viewportHeight) {
      y = cursorY - height - 10;
    }
    setTooltipPosition({ x, y });
  };

  const handleMouseEnter = (event: React.MouseEvent) => {
    handleMouseMove(event);

    if (!isDisabled) {
      setIsActive(true);
    }
  };

  /////////////////
  // HOOKS

  useEffect(() => {
    let timeoutId: ReturnType<typeof window.setTimeout>;
    if (isActive) {
      timeoutId = setTimeout(() => {
        if (!isDisabled) setIsVisible(true);
      }, delay);
    }
    return () => clearTimeout(timeoutId);
  }, [isActive, delay, isDisabled]);

  /////////////////
  // DISPLAY

  return (
    <Container
      flexGrow={grow ? '1' : '0'}
      direction={direction}
      fullWidth={fullWidth}
      disabled={isDisabled}
      onMouseEnter={(e) => handleMouseEnter(e)}
      onMouseLeave={() => {
        setIsActive(false), setIsVisible(false);
      }}
      onMouseMove={(e) => {
        handleMouseMove(e);
      }}
    >
      {isActive &&
        createPortal(
          <PopoverContainer
            isVisible={isVisible}
            maxWidth={maxWidth}
            color={color}
            tooltipPosition={tooltipPosition}
            ref={tooltipRef}
          >
            {content}
          </PopoverContainer>,
          document.body
        )}
      {children}
    </Container>
  );
};

const Container = styled.div<{
  flexGrow: string;
  disabled?: boolean;
  direction?: string;
  ref?: any;
  fullWidth?: boolean;
}>`
  display: flex;
  flex-direction: ${({ direction }) => direction ?? 'column'};
  flex-grow: ${({ flexGrow }) => flexGrow};
  cursor: ${({ disabled }) => (disabled ? 'cursor' : 'help')};
  ${({ fullWidth }) => fullWidth && 'width: 100%;'}
`;

const PopoverContainer = styled.div.attrs<{
  isVisible: boolean;
  color?: string;
  tooltipPosition?: any;
  maxWidth?: number;
}>(({
  isVisible,
  color,
  tooltipPosition,
  maxWidth,
}) => ({
  style: {
    backgroundColor: color ?? '#fff',
    opacity: isVisible ? 1 : 0,
    top: tooltipPosition.y,
    left: tooltipPosition.x,
    maxWidth: maxWidth ? `${maxWidth}em` : '36em',
  },
}))`
  position: fixed;
  flex-direction: column;
  border: solid black 0.15em;
  border-radius: 0.6em;
  padding: 0.9em;
  display: flex;
  overflow-wrap: anywhere;
  color: black;
  font-size: 0.7em;
  line-height: 1.25em;
  white-space: normal;
  z-index: 10;
  pointer-events: none;
  user-select: none;
`;
