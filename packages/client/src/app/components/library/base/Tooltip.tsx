import React, { useEffect, useRef, useState } from 'react';
import styled from 'styled-components';

interface Props {
  text: string[];
  children: React.ReactNode;
  grow?: boolean;
  direction?: 'row' | 'column';
  align?: 'left' | 'right' | 'center';
  title?: boolean;
  color?: string;
  delay?: number;
}

export const Tooltip = (props: Props) => {
  const { children, text, direction } = props;
  const { align, title, color, delay } = props;
  const flexGrow = props.grow ? '1' : '0';

  const [showDisplay, setShowDisplay] = useState(false);
  const [active, setActive] = useState(false);
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
    // pointer coordinates
    const { clientX, clientY } = event;

    const tooltipWidth = tooltipRef.current?.offsetWidth || 0;
    const tooltipHeight = tooltipRef.current?.offsetHeight || 0;

    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;

    let tooltipX = clientX + 12;
    let tooltipY = clientY + 12;

    if (tooltipX + tooltipWidth + 20 > viewportWidth) {
      tooltipX = clientX - tooltipWidth;
    }

    if (tooltipY + tooltipHeight + 20 > viewportHeight) {
      tooltipY = viewportHeight - tooltipHeight;
    }

    setTooltipPosition({ x: tooltipX, y: tooltipY });
  };

  const handleMouseEnter = () => {
    setShowDisplay(false);
    if (text[0] !== '') {
      setActive(true);
    }
  };

  useEffect(() => {
    let timeoutId: NodeJS.Timeout;

    if (active) {
      timeoutId = setTimeout(() => {
        setShowDisplay(true);
      }, delay ?? 350);
    }
    return () => {
      clearTimeout(timeoutId);
    };
  }, [active, delay]);

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
  showDisplay: boolean;
  color?: string;
  tooltipPosition?: any;
}>`
  display: flex;
  ${({ showDisplay }) => (showDisplay ? `opacity:100;` : `opacity:0;`)};
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
