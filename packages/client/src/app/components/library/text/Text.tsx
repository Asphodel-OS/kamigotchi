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
  onClick?: () => void;
}>`
  font-size: ${({ size }) => size}em;
  line-height: ${({ size }) => size * 1.5}em;
  color: ${({ color }) => color ?? '#333'};

  padding: ${({ padding }) => padding?.top ?? 0}rem ${({ padding }) => padding?.right ?? 0}rem
    ${({ padding }) => padding?.bottom ?? 0}rem ${({ padding }) => padding?.left ?? 0}em;

  ${({ onClick }) => onClick && 'cursor: pointer'};
  &:hover {
    ${({ onClick }) => (onClick ? 'opacity: 0.6;' : '')}
  }
  user-select: none;
`;
