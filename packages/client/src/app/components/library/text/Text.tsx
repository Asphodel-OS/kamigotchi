import styled from 'styled-components';

export const Text = styled.div<{
  size: number;
  color?: string;
  limit?: number;
  padding?: {
    top?: number;
    bottom?: number;
    left?: number;
    right?: number;
  };
}>`
  font-size: ${({ size }) => size}vw;
  line-height: ${({ size }) => size * 1.5}vw;
  color: ${({ color }) => color ?? '#333'};
  ${({ limit }) =>
    limit && `max-width:${limit}ch;     overflow: hidden;  text-overflow: ellipsis;`};

  padding: ${({ padding }) => padding?.top ?? 0}vw ${({ padding }) => padding?.right ?? 0}vw
    ${({ padding }) => padding?.bottom ?? 0}vw ${({ padding }) => padding?.left ?? 0}vw;
`;
