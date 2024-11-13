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
}

export const Tooltip = (props: Props) => {
  const { children, text, direction } = props;
  const { align, title, popOverDirection, color } = props;
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
  const [active, setActive] = useState('none');
  const ref: any = useRef(null);

  const [dimensions, setDimensions] = useState<DOMRect | undefined>();
  const [myInnerHeight, setMyInnerHeight] = useState<any>();

  useEffect(() => {
    const handleWindowResize = () => {
      setMyInnerHeight(window.innerHeight);
      setDimensions(ref.current?.getBoundingClientRect());
      console.log('resize');
    };

    window.addEventListener('resize', handleWindowResize);

    return () => window.removeEventListener('resize', handleWindowResize);
  }, []);

  return (
    <MyToolTip
      flexGrow={flexGrow}
      direction={direction}
      onMouseEnter={() => text[0] !== '' && setActive('flex')}
      onMouseLeave={() => setActive('none')}
      id='tool'
      ref={ref}
    >
      {active && (
        <PopOverText
          popOverDirection={popOverDirection}
          active={active}
          align={align}
          color={color}
          dimensions={dimensions}
          innerHeight={myInnerHeight}
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
  active: string;
  popOverDirection?: string[];
  color?: string;
  dimensions?: any;
  innerHeight?: any;
}>`
  display: ${({ active }) => active};
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
  text-align: ${({ align }) => align ?? 'left'};

  ${({ dimensions, innerHeight }) =>
    innerHeight &&
    dimensions &&
    `top:max(0px,calc(-${innerHeight}px * 0.1 + ${dimensions.top}px));`};

  ${({ color }) => color && `background-color:${color};`}
  ${({ popOverDirection, dimensions }) => {
    if (popOverDirection && dimensions)
      return `transform:${popOverDirection.includes('left') ? `translateX(${-dimensions.width * 0.25}vh)` : popOverDirection.includes('right') ? `translateX(${dimensions.width * 0.08}vh)` : ''} 
                      ${popOverDirection.includes('top') ? `translateY(${-dimensions.height * 0.25}vh)` : popOverDirection.includes('bottom') ? `translateY(${dimensions.height * 0.08}vh)` : ''};`;
  }}
`;
