import React from 'react';
import styled from 'styled-components';

import { Tooltip } from './Tooltip';

interface Props {
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
}

// example how of to pass icons to the tooltip:
//  [
//       <>
//         {playerEntities.length} <img src={OperatorIcon} /> players on this tile
//       </>,
//     ];

export const TextTooltip = (props: Props) => {
  const { children, grow, direction } = props;
  const { text, title, alignText, maxWidth, color, delay } = props;
  const textSize = props.size ?? 0.75;

  return (
    <Tooltip
      grow={grow}
      direction={direction}
      delay={delay}
      maxWidth={maxWidth}
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

const Text = styled.div<{ size: number; align?: string }>`
  font-size: ${(props) => props.size}vw;
  line-height: ${(props) => props.size * 1.8}vw;
  text-align: ${(props) => props.align ?? 'center'};
  white-space: pre-line;
  img {
    vertical-align: middle;
  }
`;
