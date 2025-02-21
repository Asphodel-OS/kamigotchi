import styled from 'styled-components';

interface OverlayProps {
  bottom?: number;
  top?: number;
  right?: number;
  left?: number;
  translateX?: number;
  translateY?: number;
  fullWidth?: boolean;
  passthrough?: boolean;
  orientation?: 'row' | 'column';
  align?: 'flex-start' | 'center' | 'flex-end';
  justify?: 'flex-start' | 'center' | 'flex-end';
  gap?: number;
}

export const Overlay = styled.div<OverlayProps>`
  position: absolute;
  ${({ fullWidth }) => fullWidth && 'width: 100%;'}

  ${({ bottom }) => bottom !== undefined && `bottom: ${bottom}vw;`}
  ${({ top }) => top !== undefined && `top: ${top}vw;`}
  ${({ right }) => right !== undefined && `right: ${right}vw;`}
  ${({ left }) => left !== undefined && `left: ${left}vw;`}
  ${({ translateX, translateY }) =>
    translateX && translateY && `transform: translate(${translateX}%, ${translateY}%);`}

  ${({ gap }) => gap ?? `gap: ${gap}vw;`}

  display: flex;
  flex-flow: ${({ orientation }) => orientation ?? 'row'} nowrap;
  align-items: ${({ align }) => align ?? 'center'};
  justify-content: ${({ justify }) => justify ?? 'center'};
  pointer-events: ${({ passthrough }) => (passthrough ? 'none' : 'auto')};
`;
