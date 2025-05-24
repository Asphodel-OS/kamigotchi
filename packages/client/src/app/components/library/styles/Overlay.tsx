import styled from 'styled-components';

interface OverlayProps {
  bottom?: number;
  top?: number;
  right?: number;
  left?: number;
  translateX?: number;
  translateY?: number;
  width?: number;
  height?: number;

  fullWidth?: boolean;
  fullHeight?: boolean;
  passthrough?: boolean;
  opacity?: number;
  zIndex?: number;

  orientation?: 'row' | 'column';
  align?: 'flex-start' | 'center' | 'flex-end' | 'space-between';
  justify?: 'flex-start' | 'center' | 'flex-end' | 'space-between';
  gap?: number;
}

export const Overlay = styled.div<OverlayProps>`
  position: absolute;

  ${({ width }) => width && `width: ${width}vw;`}
  ${({ fullWidth }) => fullWidth && 'width: 100%;'}
  ${({ height }) => height && `height: ${height}vw;`}
  ${({ fullHeight }) => fullHeight && 'height: 100%;'}

  ${({ zIndex }) => zIndex !== undefined && `z-index: ${zIndex};`}
  ${({ bottom }) => bottom !== undefined && `bottom: ${bottom}vw;`}
  ${({ top }) => top !== undefined && `top: ${top}vw;`}
  ${({ right }) => right !== undefined && `right: ${right}vw;`}
  ${({ left }) => left !== undefined && `left: ${left}vw;`}
  ${({ translateX, translateY }) =>
    translateX && translateY && `transform: translate(${translateX}%, ${translateY}%);`}

  ${({ gap }) => gap && `gap: ${gap}vw;`}
  ${({ opacity }) => opacity !== undefined && `opacity: ${opacity};`}

  display: flex;
  flex-flow: ${({ orientation }) => orientation ?? 'row'} nowrap;
  align-items: ${({ align }) => align ?? 'center'};
  justify-content: ${({ justify }) => justify ?? 'center'};
  pointer-events: ${({ passthrough }) => (passthrough ? 'none' : 'auto')};
`;
