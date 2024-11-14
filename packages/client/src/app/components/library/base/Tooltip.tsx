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
}

export const Tooltip = (props: Props) => {
  const { children, text, direction } = props;
  const { align, title, popOverDirection, color, scrollPosition } = props;
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
  const [myInnerWidth, setMyInnerWidth] = useState<any>();

  useEffect(() => {
    const handleWindowResize = () => {
      setMyInnerHeight(window.innerHeight);
      setMyInnerWidth(window.innerWidth);
      setDimensions(ref.current?.getBoundingClientRect());
    };

    window.addEventListener('resize', handleWindowResize);

    return () => window.removeEventListener('resize', handleWindowResize);
  });
  //console.log(`dimensions ${JSON.stringify(dimensions)}     scrollPosition ${scrollPosition}`);
  console.log(` scrollPosition on tooltip   ${scrollPosition}`);
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
          innerWidth={myInnerWidth}
          scrollPosition={scrollPosition}
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
  innerWidth?: any;
  scrollPosition?: number;
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
  pointer-events: none;
  text-align: ${({ align }) => align ?? 'left'};
  ${({ color }) => color && `background-color:${color};`}

  ${({ scrollPosition, dimensions, innerHeight }) =>
    scrollPosition && dimensions && innerHeight && `transform:translateY( -${scrollPosition}px );`}
`;
/*
  ${({ dimensions, innerWidth }) => {
    if (dimensions && innerWidth)
      if (dimensions.right + dimensions.width + 50 >= innerWidth)
        return `${`right:calc( ${dimensions.width}px ); `}`;
  }}
  ${({ dimensions, innerHeight }) => {
    if (dimensions && innerHeight)
      if (dimensions.bottom * 2 >= innerHeight)
        return `${`bottom:calc(${dimensions.height}px ); `}`;
  }}

*/
