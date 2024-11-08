import React, { useState } from 'react';
import styled from 'styled-components';

interface Props {
  text: string[];
  children: React.ReactNode;
  grow?: boolean;
  direction?: 'row' | 'column';
  align?: 'left' | 'right' | 'center';
  title?: boolean;
}

export const Tooltip = (props: Props) => {
  const { children, text, direction, title } = props;
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
  const align = props.align ?? 'left';
  const [active, setActive] = useState('none');

  let timeout: NodeJS.Timeout;

  return (
    <MyToolTip
      flexGrow={flexGrow}
      direction={direction}
      onMouseEnter={() => setActive('flex')}
      onMouseLeave={() => setActive('none')}
    >
      {children}
      {active && (
        <PopOverText active={active} flexGrow={flexGrow} direction={direction} align={align}>
          {conjoinedText()}
        </PopOverText>
      )}
    </MyToolTip>
  );
};

const MyToolTip = styled.div<{ flexGrow: string; direction?: string }>`
  flex-direction: ${({ direction }) => direction ?? 'column'};
  flex-grow: ${({ flexGrow }) => flexGrow};
  display: flex;
  cursor: help;
  flex-direction: column;
`;

const PopOverText = styled.div<{
  align: string;
  flexGrow: string;
  direction?: string;
  active: string;
}>`
  display: ${({ active }) => active};
  z-index: 102;
  border-style: solid;
  border-width: 0.15vw;
  border-color: black;
  background-color: #fff;
  border-radius: 0.6vw;
  padding: 0.9vw;
  max-width: 6vw;
  color: black;
  font-size: 0.7vw;
  font-family: Pixel;
  line-height: 1.25vw;
  white-space: pre-line;
  flex-direction: ${({ direction }) => direction ?? 'column'};
  flex-grow: ${({ flexGrow }) => flexGrow};
  text-align: ${({ align }) => align};
  position: fixed;
`;
