import React, { useEffect, useRef, useState } from 'react';
import styled from 'styled-components';

interface Props {
  text: string[];
  children: React.ReactNode;
  grow?: boolean;
  direction?: 'row' | 'column';
  alignText?: 'left' | 'right' | 'center';
  title?: boolean;
  color?: string;
  delay?: number;
}

export const Tooltip = (props: Props) => {
  const { children, text, direction } = props;
  const { alignText, title, color, delay } = props;
  const flexGrow = props.grow ? '1' : '0';

  const [isVisible, setIsVisible] = useState(false);
  const [isActive, setIsActive] = useState(false);
  const [tooltipPosition, setTooltipPosition] = useState({ x: 0, y: 0 });

  const tooltipRef = useRef<HTMLDivElement>(document.createElement('div'));

  const conjoinedText = () => {
    return !title ? (
      text.join('\n')
    ) : (
      <div>
        <div style={{ fontWeight: 'bold', position: 'relative', textAlign: 'center' }}>
          {text[0] + '\n'}
        </div>
        {text.slice(1).join('\n')}
      </div>
    );
  };

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

  useEffect(() => {
    let timeoutId: ReturnType<typeof window.setTimeout>;

    if (isActive) {
      timeoutId = setTimeout(() => {
        if (text.length > 0) setIsVisible(true);
      }, delay ?? 350);
    }
    return () => clearTimeout(timeoutId);
  }, [isActive, delay]);

  return (
    <Container
      flexGrow={flexGrow}
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
      {isActive && (
        <PopOverText
          isVisible={isVisible}
          alignText={alignText}
          color={color}
          tooltipPosition={tooltipPosition}
          ref={tooltipRef}
        >
          {conjoinedText()}
        </PopOverText>
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
  alignText?: string;
  isVisible: boolean;
  color?: string;
  tooltipPosition?: any;
}

const PopOverText = styled.div.attrs<PopOverProps>((props) => ({
  style: {
    backgroundColor: props.color ?? '#fff',
    opacity: props.isVisible ? 1 : 0,
    textAlign: props.alignText ?? 'left',
    top: props.tooltipPosition.y,
    left: props.tooltipPosition.x,
  },
}))<PopOverProps>`
  position: fixed;

  border: solid black 0.15vw;
  border-radius: 0.6vw;

  max-width: 36vw;
  padding: 0.9vw;
  display: flex;
  overflow-wrap: anywhere;

  color: black;
  font-size: 0.7vw;
  line-height: 1.25vw;

  white-space: pre-line;
  z-index: 5;

  pointer-events: none;
  user-select: none;
`;
