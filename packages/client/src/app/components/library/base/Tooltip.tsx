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
  id?: string;
}

export const Tooltip = (props: Props) => {
  const { children, text, direction } = props;
  const { align, title, popOverDirection, color, id } = props;
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
      console.log('resize');
    };

    window.addEventListener('resize', handleWindowResize);

    return () => window.removeEventListener('resize', handleWindowResize);
  }, []);
  console.log(`myInnerWidth ${myInnerWidth}`);
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
          id={id}
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
  id?: string;
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
  ${({ color }) => color && `background-color:${color};`}
  ${({ dimensions, innerWidth, innerHeight }) => {
    if (dimensions && innerWidth && innerHeight)
      if (dimensions.right >= innerWidth - 40)
        return `${`left:calc(${dimensions.x}px - ${dimensions.width}px ); `}`;
    if (dimensions.bottom >= innerHeight - 50) return `${`bottom:calc(${dimensions.height}px ); `}`;
  }}
`;
