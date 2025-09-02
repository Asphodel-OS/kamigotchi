import React from 'react';
import styled from 'styled-components';

import { Tooltip } from './Tooltip';

// example how of to pass icons to the tooltip:
//  [
//       <>
//         {playerEntities.length} <img src={OperatorIcon} /> players on this tile
//       </>,
//     ];

export const TextTooltip = ({
  text,
  title,
  children,
  grow,
  direction,
  delay,
  maxWidth,
  size: textSize = 0.75,
  alignText = 'center',
  color,
  fullWidth,
}: {
  text: string[] | React.ReactNode[];
  title?: string;
  children: React.ReactNode;
  grow?: boolean;
  direction?: 'row' | 'column';
  delay?: number;
  maxWidth?: number;
  size?: number;
  alignText?: 'left' | 'right' | 'center';
  color?: string;
  fullWidth?: boolean;
}) => {
  return (
    <Tooltip
      grow={grow}
      direction={direction}
      delay={delay}
      maxWidth={maxWidth}
      fullWidth={fullWidth}
      color={color}
      isDisabled={text.every((entry) => entry === '' || entry === null)}
      content={
        <>
          {title && <Text size={textSize * 1.35}>{title}</Text>}
          {text.map((line, idx) => (
            <Text key={idx} size={textSize} align={alignText}>
              {line}
            </Text>
          ))}
        </>
      }
    >
      {children}
    </Tooltip>
  );
};

const Text = styled.div<{ size: number; align: string }>`
  font-size: ${({ size }) => size}em;
  line-height: ${({ size }) => size * 1.8}em;
  text-align: ${({ align }) => align};
  white-space: pre-line;
  img {
    vertical-align: middle;
  }
`;
