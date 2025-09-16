import styled from 'styled-components';

export const Overlay = styled.div<{
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
  isHidden?: boolean;
}>`
  position: absolute;

  ${({ width }) => width && `width: ${width}rem;`}
  ${({ fullWidth }) => fullWidth && 'width: 100%;'}
  ${({ height }) => height && `height: ${height}rem;`}
  ${({ fullHeight }) => fullHeight && 'height: 100%;'}

  ${({ zIndex }) => zIndex !== undefined && `z-index: ${zIndex};`}
  ${({ bottom }) => bottom !== undefined && `bottom: ${bottom}rem;`}
  ${({ top }) => top !== undefined && `top: ${top}rem;`}
  ${({ right }) => right !== undefined && `right: ${right}rem;`}
  ${({ left }) => left !== undefined && `left: ${left}rem;`}
  ${({ translateX, translateY }) =>
    translateX && translateY && `transform: translate(${translateX}%, ${translateY}%);`}

  ${({ gap }) => gap && `gap: ${gap}rem;`}
  ${({ opacity }) => opacity !== undefined && `opacity: ${opacity};`}

  display: ${({ isHidden }) => (isHidden ? 'none' : 'flex')};
  flex-flow: ${({ orientation }) => orientation ?? 'row'} nowrap;
  align-items: ${({ align }) => align ?? 'center'};
  justify-content: ${({ justify }) => justify ?? 'center'};
  pointer-events: ${({ passthrough }) => (passthrough ? 'none' : 'auto')};
`;
