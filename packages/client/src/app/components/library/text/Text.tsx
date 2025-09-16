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
  font-size: ${({ size }) => size}rem;
  line-height: ${({ size }) => size * 1.5}rem;
  color: ${({ color }) => color ?? '#333'};

  padding: ${({ padding }) => padding?.top ?? 0}rem ${({ padding }) => padding?.right ?? 0}rem
    ${({ padding }) => padding?.bottom ?? 0}rem ${({ padding }) => padding?.left ?? 0}rem;
`;
