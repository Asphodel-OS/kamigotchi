import styled from 'styled-components';

export const Text = styled.div<{
  size?: number;
  color?: string;
  padding?: {
    top?: number;
    bottom?: number;
    left?: number;
    right?: number;
  };
  shadow?: {
    color?: string;
    blur?: number;
    offset?: {
      x?: number;
      y?: number;
    };
  };
  onClick?: () => void;
}>`
  font-size: ${({ size }) => size ?? 0.6}vw;
  line-height: ${({ size }) => size ?? 0.6 * 1.5}vw;
  color: ${({ color }) => color ?? '#333'};

  padding: ${({ padding }) => padding?.top ?? 0}vw ${({ padding }) => padding?.right ?? 0}vw
    ${({ padding }) => padding?.bottom ?? 0}vw ${({ padding }) => padding?.left ?? 0}vw;

  ${({ shadow }) =>
    shadow &&
    `text-shadow: ${shadow.offset?.x ?? 0}vw ${shadow.offset?.y ?? 0}vw ${shadow.blur ?? 0}vw ${shadow?.color ?? '#000'};`}

  ${({ onClick }) => onClick && 'cursor: pointer'};
  &:hover {
    ${({ onClick }) => (onClick ? 'opacity: 0.6;' : '')}
  }
  user-select: none;
`;
