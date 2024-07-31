import styled from 'styled-components';

interface OverlayProps {
  bottom?: number;
  top?: number;
  right?: number;
  left?: number;
  translateX?: number;
  translateY?: number;
  fullWidth?: boolean;
}

export const Overlay = styled.div<OverlayProps>`
  position: absolute;
  ${({ fullWidth }) => fullWidth && 'width: 100%;'}

  ${({ bottom }) => bottom !== undefined && `bottom: ${bottom}vw;`}
  ${({ top }) => top !== undefined && `top: ${top}vw;`}
  ${({ right }) => right !== undefined && `right: ${right}vw;`}
  ${({ left }) => left !== undefined && `left: ${left}vw;`}
  ${({ translateX, translateY }) =>
    `transform: translate(${translateX ?? 0}%, ${translateY ?? 0}%);`}

  display: flex;
  flex-flow: row nowrap;
  align-items: center;
  justify-content: space-between;
`;
