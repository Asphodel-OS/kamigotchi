import React, { useEffect, useRef, useState } from 'react';
import styled from 'styled-components';

interface Props {
  text: string[];
  children: React.ReactNode;
  grow?: boolean;
  direction?: 'row' | 'column';
  align?: 'left' | 'right' | 'center';
  title?: boolean;
  popOverDirection?: string[];
  color?: string;
  scrollPosition?: number;
  delay?: number;
}

export const Tooltip = (props: Props) => {
  const { children, text, direction } = props;
  const { align, title, color, delay } = props;
  const conjoinedText = () => {
    return !title ? (
      text.join('\n')
    ) : (
      <>
        <div style={{ fontWeight: 'bold', position: 'relative', textAlign: 'center' }}>
          {text[0] + '\n'}
        </div>
        <div>{text.slice(1).join('\n')}</div>
      </>
    );
  };
  const flexGrow = props.grow ? '1' : '0';
  const [showDisplay, setShowDisplay] = useState('none');
  const [active, setActive] = useState(false);

  const [tooltipPosition, setTooltipPosition] = useState({ x: 0, y: 0 });
  const tooltipRef = useRef<HTMLDivElement>(document.createElement('div'));

  const handleMouseMove = (event: React.MouseEvent) => {
    // pointer coordinates
    const { clientX, clientY } = event;

    const tooltipWidth = tooltipRef.current?.offsetWidth || 0;
    const tooltipHeight = tooltipRef.current?.offsetHeight || 0;

    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;

    let tooltipX = clientX + 12;
    let tooltipY = clientY + 12;

    if (tooltipX + tooltipWidth > viewportWidth) {
      tooltipX = clientX - tooltipWidth;
    }

    if (tooltipY + tooltipHeight > viewportHeight) {
      tooltipY = viewportHeight - tooltipHeight;
    }

    setTooltipPosition({ x: tooltipX, y: tooltipY });
  };

  useEffect(() => {
    let timeoutId: NodeJS.Timeout;

    if (active) {
      timeoutId = setTimeout(() => {
        setShowDisplay('flex');
      }, delay);
    }
    return () => {
      clearTimeout(timeoutId);
    };
  }, [active, delay]);

  const handleMouseEnter = () => {
    setShowDisplay('none');
    if (text[0] !== '') {
      setActive(true);
    }
  };

  return (
    <MyToolTip
      flexGrow={flexGrow}
      direction={direction}
      onMouseEnter={() => handleMouseEnter()}
      onMouseLeave={() => setActive(false)}
      onMouseMove={(e) => {
        handleMouseMove(e);
      }}
    >
      {active && (
        <PopOverText
          showDisplay={showDisplay}
          align={align}
          color={color}
          tooltipPosition={tooltipPosition}
          ref={tooltipRef}
        >
          {conjoinedText()}
        </PopOverText>
      )}
      {children}
    </MyToolTip>
  );
};

const MyToolTip = styled.div<{ flexGrow: string; direction?: string; ref?: any }>`
  flex-direction: ${({ direction }) => direction ?? 'column'};
  flex-grow: ${({ flexGrow }) => flexGrow};
  display: flex;
  cursor: help;
`;

const PopOverText = styled.div<{
  align?: string;
  showDisplay: string;
  color?: string;
  tooltipPosition?: any;
}>`
  display: ${({ showDisplay }) => showDisplay};
  border-style: solid;
  z-index: 100;
  border-width: 0.15vw;
  border-color: black;
  background-color: #fff;
  border-radius: 0.6vw;
  padding: 0.9vw;
  max-width: 36vw;
  color: black;
  font-size: 0.7vw;
  font-family: Pixel;
  line-height: 1.25vw;
  white-space: pre-line;
  position: fixed;
  pointer-events: none;
  text-align: ${({ align }) => align ?? 'left'};
  ${({ color }) => color && `background-color:${color};`}
  top: ${({ tooltipPosition }) => tooltipPosition.y};
  left: ${({ tooltipPosition }) => tooltipPosition.x};
`;
