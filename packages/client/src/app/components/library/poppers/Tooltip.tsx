import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import styled from 'styled-components';

interface Props {
  text: string[];
  title?: string;

  // parent container
  children: React.ReactNode;
  grow?: boolean; // parent prop
  direction?: 'row' | 'column';

  // tooltip
  delay?: number;
  maxWidth?: number;
  size?: number;
  alignText?: 'left' | 'right' | 'center';
  color?: string;
}

export const Tooltip = (props: Props) => {
  const { children, grow, direction } = props;
  const { text, title, alignText, maxWidth, color, delay } = props;
  const textSize = props.size ?? 0.75;

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

    if (text[0] !== '') {
      setIsActive(true);
    }
  };

  /////////////////
  // HOOKS

  useEffect(() => {
    let timeoutId: ReturnType<typeof window.setTimeout>;

    if (isActive) {
      timeoutId = setTimeout(() => {
        if (text.length > 0) setIsVisible(true);
      }, delay ?? 350);
    }
    return () => clearTimeout(timeoutId);
  }, [isActive, delay]);

  /////////////////
  // DISPLAY

  return (
    <Container
      flexGrow={grow ? '1' : '0'}
      direction={direction}
      disabled={text.length === 0}
      onMouseEnter={(e) => handleMouseEnter(e)}
      onMouseLeave={(e) => {
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
            {title && <Text size={textSize * 1.35}>{title}</Text>}
            {text.map((line, idx) => (
              <Text key={idx} size={textSize} align={alignText}>
                {line}
              </Text>
            ))}
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
}>`
  display: flex;
  flex-direction: ${({ direction }) => direction ?? 'column'};

  flex-grow: ${({ flexGrow }) => flexGrow};
  cursor: ${({ disabled }) => (disabled ? 'cursor' : 'help')};
`;

interface PopOverProps {
  isVisible: boolean;
  color?: string;
  tooltipPosition?: any;
  maxWidth?: number;
}

const PopoverContainer = styled.div.attrs<PopOverProps>((props) => ({
  style: {
    backgroundColor: props.color ?? '#fff',
    opacity: props.isVisible ? 1 : 0,
    top: props.tooltipPosition.y,
    left: props.tooltipPosition.x,
    maxWidth: props.maxWidth ? `${props.maxWidth}vw` : '36vw',
  },
}))<PopOverProps>`
  position: fixed;
  flex-direction: column;

  border: solid black 0.15vw;
  border-radius: 0.6vw;

  padding: 0.9vw;
  display: flex;
  overflow-wrap: anywhere;

  color: black;
  font-size: 0.7vw;
  line-height: 1.25vw;

  white-space: normal;
  z-index: 10;

  pointer-events: none;
  user-select: none;
`;

const Text = styled.div<{ size: number; align?: string }>`
  font-size: ${(props) => props.size}vw;
  line-height: ${(props) => props.size * 1.8}vw;
  text-align: ${(props) => props.align ?? 'center'};
  white-space: pre-line;
`;
