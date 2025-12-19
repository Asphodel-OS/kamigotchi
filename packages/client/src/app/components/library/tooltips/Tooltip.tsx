import React, { useEffect, useLayoutEffect, useRef, useState } from 'react';
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
  maxWidth?: { desktop?: number; mobile?: number };
  color?: string;
  content: React.ReactNode;
  isDisabled: boolean;
  fullWidth?: boolean;
}) => {
  const [shouldBeVisible, setShouldBeVisible] = useState(false);
  const [isActive, setIsActive] = useState(false);
  const [tooltipPosition, setTooltipPosition] = useState({ x: 0, y: 0 });

  const tooltipRef = useRef<HTMLDivElement>(document.createElement('div'));
  const isMobileRef = useRef(false);
  const cursorPosRef = useRef({ x: 0, y: 0 });
  // if user is scrolling, close the tooltip
  useEffect(() => {
    window.addEventListener('scroll', closeTooltip);
    return () => {
      window.removeEventListener('scroll', closeTooltip);
    };
  }, []);

  // if user taps elsewhere on mobile, close the tooltip
  useEffect(() => {
    if (!shouldBeVisible) return;
    const handleTapElsewhere = () => {
      closeTooltip();
    };
    const timeoutId = setTimeout(() => {
      window.addEventListener('touchstart', handleTapElsewhere);
    }, 10);
    return () => {
      clearTimeout(timeoutId);
      window.removeEventListener('touchstart', handleTapElsewhere);
    };
  }, [shouldBeVisible]);

  /////////////////
  // HANDLERS

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

  const handleMouseMove = (event: React.MouseEvent | React.TouchEvent) => {
    const isMobile = event.type.startsWith('touch');

    if (isMobile) {
      const touch = (event as React.TouchEvent).touches[0];
      cursorPosRef.current = { x: touch.clientX, y: touch.clientY };
    } else {
      const mouseEvent = event as React.MouseEvent;
      cursorPosRef.current = { x: mouseEvent.clientX, y: mouseEvent.clientY };
    }
    if (!isMobile) updatePosition();
  };

  // prevent flickering on mobile
  useLayoutEffect(() => {
    if (isActive) {
      updatePosition();
    }
  }, [isActive]);

  const handleMouseEnter = (event: React.MouseEvent) => {
    handleMouseMove(event);
    if (!isDisabled) {
      setIsActive(true);
    }
  };

  // for mobile, handles opening
  const handleTouchStart = (event: React.TouchEvent) => {
    if (isDisabled) return;
    handleMouseMove(event);
    isMobileRef.current = true;
    setIsActive(true);
  };

  // for mobile, handles finger release
  const handleTouchEnd = () => {
    isMobileRef.current = false;
  };

  /* closes the tooltip when
  scrolling or tapping elsewhere*/
  const closeTooltip = () => {
    setIsActive(false);
    setShouldBeVisible(false);
  };

  /////////////////
  // HOOKS

  useEffect(() => {
    let timeoutId: ReturnType<typeof window.setTimeout>;
    if (isActive) {
      const isMobile = isMobileRef.current;
      const activeDelay = isMobile ? 500 : delay;
      timeoutId = setTimeout(() => {
        if (!isDisabled && (!isMobile || isMobileRef.current)) {
          setShouldBeVisible(true);
        } else if (isMobile) {
          setIsActive(false);
        }
      }, activeDelay);
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
        closeTooltip();
      }}
      onMouseMove={(e) => {
        handleMouseMove(e);
      }}
      onTouchStart={(e) => handleTouchStart(e)}
      onTouchEnd={handleTouchEnd}
      onTouchCancel={handleTouchEnd}
    >
      {isActive &&
        createPortal(
          <PopoverContainer
            shouldBeVisible={shouldBeVisible}
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

const Container = styled.span<{
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
  ${({ fullWidth }) => fullWidth && 'width: 100%;'};
`;

const PopoverContainer = styled.span.attrs<{
  shouldBeVisible: boolean;

  color?: string;
  tooltipPosition?: any;
  maxWidth?: { desktop?: number; mobile?: number };
}>(({ shouldBeVisible, color, tooltipPosition }) => ({
  style: {
    backgroundColor: color ?? '#fff',
    opacity: shouldBeVisible ? 1 : 0,
    top: tooltipPosition.y,
    left: tooltipPosition.x,
  },
}))<{
  shouldBeVisible: boolean;

  color?: string;
  tooltipPosition?: any;
  maxWidth?: { desktop?: number; mobile?: number };
}>`
  position: fixed;
  border: solid black 0.15vw;
  border-radius: 0.6vw;
  padding: 0.9vw;
  color: ${({ color }) => color || '#333'};

  display: flex;
  flex-direction: column;
  overflow-wrap: anywhere;

  max-width: ${({ maxWidth }) => (maxWidth?.desktop ? `${maxWidth.desktop}vw` : '20vw')};

  font-size: min(1.8vw, 1.5em);
  min-width: min-content;
  pointer-events: none;
  user-select: none;
  @media (pointer: coarse) {
    max-width: min(55vw, 55cqi);
  }
  @media (max-aspect-ratio: 11/16) and (pointer: coarse) {
    font-size: min(3.4rem, 3.5cqi);
    min-width: 0;

    max-width: ${({ maxWidth }) => (maxWidth?.mobile ? `${maxWidth.mobile}vw` : '50vw')};
  }

  line-height: 1.25vw;
  white-space: normal;
  z-index: 20;
`;
