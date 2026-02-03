import React, { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import styled from 'styled-components';
export const Tooltip = ({
  children,
  grow,
  direction,
  delay = 350,
  width,
  color,
  content,
  isDisabled,
  fullWidth,
  cursor,
}: {
  children: React.ReactNode;
  grow?: boolean;
  direction?: 'row' | 'column';
  delay?: number;
  width?: { desktop?: number; mobile?: number };
  color?: string;
  content: React.ReactNode;
  isDisabled: boolean;
  fullWidth?: boolean;
  cursor?: string;
}) => {
  const [shouldBeVisible, setShouldBeVisible] = useState(false);
  const [isActive, setIsActive] = useState(false);
  const [tooltipPosition, setTooltipPosition] = useState({ x: 0, y: 0 });

  const tooltipRef = useRef<HTMLDivElement>(document.createElement('div'));
  const isTouchActiveRef = useRef(false);
  const cursorPosRef = useRef({ x: 0, y: 0 });
  const longPressTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const handleScroll = () => closeTooltip();

    const handleTouchEnd = () => {
      setTimeout(() => {
        isTouchActiveRef.current = false;
      }, 300);
    };

    window.addEventListener('scroll', handleScroll);
    window.addEventListener('touchend', handleTouchEnd);
    window.addEventListener('touchcancel', handleTouchEnd);

    return () => {
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('touchend', handleTouchEnd);
      window.removeEventListener('touchcancel', handleTouchEnd);
      if (longPressTimeoutRef.current) {
        clearTimeout(longPressTimeoutRef.current);
      }
      setIsActive(false);
      setShouldBeVisible(false);
    };
  }, []);

  useEffect(() => {
    if (isDisabled) closeTooltip();
  }, [isDisabled]);

  //////////////////
  // POSITIONING

  const updatePosition = () => {
    const { x: cursorX, y: cursorY } = cursorPosRef.current;
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

  //////////////////
  // EVENT HANDLERS

  const handleMouseMove = (event: React.MouseEvent | React.TouchEvent) => {
    if (!event.type.startsWith('touch') && isTouchActiveRef.current) return;

    if (event.type.startsWith('touch')) {
      const touch = (event as React.TouchEvent).touches[0];
      cursorPosRef.current = { x: touch.clientX, y: touch.clientY };
    } else {
      const mouse = event as React.MouseEvent;
      cursorPosRef.current = { x: mouse.clientX, y: mouse.clientY };
    }
  };

  const handleMouseEnter = (event: React.MouseEvent) => {
    if (isTouchActiveRef.current || isDisabled) return;
    handleMouseMove(event);
    setIsActive(true);
  };

  const handleMouseLeave = () => {
    if (isTouchActiveRef.current) return;
    closeTooltip();
  };

  const handleTouchStart = (event: React.TouchEvent) => {
    if (isDisabled) return;
    isTouchActiveRef.current = true;
    handleMouseMove(event);

    longPressTimeoutRef.current = setTimeout(() => {
      setIsActive(true);
    }, 500);
  };

  const handleTouchEnd = () => {
    if (longPressTimeoutRef.current) {
      clearTimeout(longPressTimeoutRef.current);
      longPressTimeoutRef.current = null;
    }

    closeTooltip();
  };

  const closeTooltip = () => {
    setIsActive(false);
    setShouldBeVisible(false);
  };

  //////////////////
  // VISIBILITY

  useEffect(() => {
    if (!isActive) return;

    const actualDelay = isTouchActiveRef.current ? 0 : delay;

    setTimeout(() => {
      if (!isDisabled) setShouldBeVisible(true);
    }, actualDelay);
  }, [isActive, delay, isDisabled]);

  useLayoutEffect(() => {
    if (isActive) updatePosition();
  }, [isActive]);

  /////////////////
  // DISPLAY

  return (
    <Container
      flexGrow={grow ? '1' : '0'}
      direction={direction}
      fullWidth={fullWidth}
      disabled={isDisabled}
      cursor={cursor}
      onMouseEnter={handleMouseEnter}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      onTouchCancel={handleTouchEnd}
    >
      {isActive &&
        createPortal(
          <PopoverContainer
            shouldBeVisible={shouldBeVisible}
            tooltipPosition={tooltipPosition}
            width={width}
            color={color}
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

const Container = styled.span<{
  flexGrow: string;
  disabled?: boolean;
  direction?: string;
  fullWidth?: boolean;
  cursor?: string;
}>`
  display: flex;
  flex-direction: ${({ direction }) => direction ?? 'column'};
  flex-grow: ${({ flexGrow }) => flexGrow};
  cursor: ${({ disabled, cursor }) => cursor ?? (disabled ? 'default' : 'help')};
  ${({ fullWidth }) => fullWidth && 'width: 100%;'}
`;

const PopoverContainer = styled.span.attrs<{
  shouldBeVisible: boolean;
  color?: string;
  tooltipPosition?: any;
  width?: { desktop?: number; mobile?: number };
}>(({ shouldBeVisible, color, tooltipPosition, width }) => ({
  style: {
    backgroundColor: color ?? '#fff',
    color: color || '#333',
    opacity: shouldBeVisible ? 1 : 0,
    top: tooltipPosition.y,
    left: tooltipPosition.x,
    '--width-desktop': width?.desktop ? `${width.desktop}vw` : '25vw',
    '--width-mobile': width?.mobile ? `${width.mobile}vw` : '49vw',
  } as React.CSSProperties,
}))<{
  shouldBeVisible: boolean;
  color?: string;
  tooltipPosition?: any;
  width?: { desktop?: number; mobile?: number };
}>`
  position: fixed;
  font-size: clamp(0.8rem, 1.9vmin, 1.8rem);
  border: solid black 0.1em;
  border-radius: 0.5em;
  padding: 0.6em;
  line-height: 1.5;

  display: flex;
  flex-direction: column;
  overflow-wrap: anywhere;

  min-width: min-content;
  pointer-events: none;
  user-select: none;
  white-space: normal;
  z-index: 20;

  width: var(--width-desktop);
  @media (pointer: coarse) {
    width: var(--width-mobile);
  }
  max-width: fit-content;
`;
