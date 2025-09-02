import styled from 'styled-components';

export const Text = styled.div<{
  size: number;
  color?: string;
  padding?: {
    top?: number;
    bottom?: number;
    left?: number;
    right?: number;
  };
}>`
  font-size: ${({ size }) => size}em;
  line-height: ${({ size }) => size * 1.5}em;
  color: ${({ color }) => color ?? '#333'};

  padding: ${({ padding }) => padding?.top ?? 0}em ${({ padding }) => padding?.right ?? 0}em
    ${({ padding }) => padding?.bottom ?? 0}em ${({ padding }) => padding?.left ?? 0}em;
`;
