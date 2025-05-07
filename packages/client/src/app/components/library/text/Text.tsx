import styled from 'styled-components';

interface TextProps {
  size: number;
  color?: string;
}

export const Text = styled.div<TextProps>`
  font-size: ${({ size }) => size}vw;
  line-height: ${({ size }) => size * 1.5}vw;
  color: ${({ color }) => color ?? '#333'};
`;
