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

  ${({ width }) => width && `width: ${width}em;`}
  ${({ fullWidth }) => fullWidth && 'width: 100%;'}
  ${({ height }) => height && `height: ${height}em;`}
  ${({ fullHeight }) => fullHeight && 'height: 100%;'}

  ${({ zIndex }) => zIndex !== undefined && `z-index: ${zIndex};`}
  ${({ bottom }) => bottom !== undefined && `bottom: ${bottom}em;`}
  ${({ top }) => top !== undefined && `top: ${top}em;`}
  ${({ right }) => right !== undefined && `right: ${right}em;`}
  ${({ left }) => left !== undefined && `left: ${left}em;`}
  ${({ translateX, translateY }) =>
    translateX && translateY && `transform: translate(${translateX}%, ${translateY}%);`}

  ${({ gap }) => gap && `gap: ${gap}em;`}
  ${({ opacity }) => opacity !== undefined && `opacity: ${opacity};`}

  display: ${({ isHidden }) => (isHidden ? 'none' : 'flex')};
  flex-flow: ${({ orientation }) => orientation ?? 'row'} nowrap;
  align-items: ${({ align }) => align ?? 'center'};
  justify-content: ${({ justify }) => justify ?? 'center'};
  pointer-events: ${({ passthrough }) => (passthrough ? 'none' : 'auto')};
`;
