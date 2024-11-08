import React, { useState } from 'react';
import styled from 'styled-components';

interface Props {
  text: string[];
  children: React.ReactNode;
  grow?: boolean;
  direction?: 'row' | 'column';
  align?: 'left' | 'right' | 'center';
  title?: boolean;
  popOverDirection?: 'left' | 'right' | 'bottom' | 'top';
}

export const Tooltip = (props: Props) => {
  const { children, text, direction, title, popOverDirection } = props;
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

  return (
    <MyToolTip
      flexGrow={flexGrow}
      direction={direction}
      onMouseEnter={() => setActive('flex')}
      onMouseLeave={() => setActive('none')}
    >
      {children}
      {active && (
        <PopOverText popOverDirection={popOverDirection} active={active} align={align}>
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
`;

const PopOverText = styled.div<{
  align: string;
  active: string;
  popOverDirection?: string;
}>`
  display: ${({ active }) => active};
  border-style: solid;
  border-width: 0.15vw;
  border-color: black;
  background-color: #fff;
  border-radius: 0.6vw;
  padding: 0.9vw;
  max-width: 26vw;
  color: black;
  font-size: 0.7vw;
  font-family: Pixel;
  line-height: 1.25vw;
  white-space: pre-line;
  position: fixed;
  --tooltip-margin: 30px;
  text-align: ${({ align }) => align};
  ${({ popOverDirection }) => {
    if (popOverDirection === 'top')
      return `      
          transform:translateY(-102%);
        `;
    if (popOverDirection === 'bottom')
      return `      
              transform:translateY(29%);
            `;

    if (popOverDirection === 'left')
      return `      
                      transform:translateX(-102%);
                    `;
    if (popOverDirection === 'right')
      return `      
                      transform:translateX(14%);
                    `;
  }}
`;
