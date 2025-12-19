import { SvgIconComponent } from '@mui/icons-material';
import { ForwardedRef, forwardRef } from 'react';
import styled, { css } from 'styled-components';

import { clickFx, hoverFx, pulseFx, shakeFx } from 'app/styles/effects';
import { playClick } from 'utils/sounds';

// IconButton is a button that triggers an action when clicked
// TODO: clean up these parameters as nested objects
export const IconButton = forwardRef(function IconButton(
  {
    img,
    onClick,
    text,
    disabled,
    color,
    fullWidth,
    fullHeight,
    pulse,
    shadow,
    width,
    flatten,
    balance,
    corner,
    cornerAlt,
    radius = 0.45,
    scaleRelativeToRoot = 2,
    scaleRelativeToContainer = 8,
    icon,
    filter,
    noBorder,
    shake,
  }: {
    onClick: Function;
    img?: string | SvgIconComponent; // TODO: get rid of all svg icons and mui references
    text?: string;
    width?: number;
    shake?: boolean;

    // general styling
    color?: string;
    disabled?: boolean;
    fullHeight?: boolean;
    fullWidth?: boolean;
    pulse?: boolean;

    balance?: number; // shows a balance on icon (for Inventory)
    corner?: boolean; // indicates button has options
    cornerAlt?: boolean; // open page in new tab indicator

    radius?: number;
    scaleRelativeToRoot?: number;
    scaleRelativeToContainer?: number;
    shadow?: boolean;
    flatten?: `left` | `right`; // flattens a side, for use with dropdowns
    noBorder?: boolean;
    icon?: {
      size?: number;
      inset?: { px?: number; x?: number; y?: number };
      color?: string;
      position?: 'left' | 'right';
    };
    filter?: string;
  },
  ref: ForwardedRef<HTMLButtonElement>
) {
  // layer on a sound effect
  const handleClick = async () => {
    playClick();
    await onClick();
  };

  const resolvedIconInsetPx = icon?.inset?.px ?? 0;
  const resolvedIconInsetXpx = icon?.inset?.x ?? undefined;
  const resolvedIconInsetYpx = icon?.inset?.y ?? undefined;

  const MyImage = () => {
    if (img) {
      if (typeof img === 'string') {
        return (
          <Image
            src={img}
            scaleRelativeToRoot={scaleRelativeToRoot}
            iconInsetPx={resolvedIconInsetPx}
            iconInsetXpx={resolvedIconInsetXpx}
            iconInsetYpx={resolvedIconInsetYpx}
            filter={filter}
            scaleRelativeToContainer={scaleRelativeToContainer}
          />
        );
      }
      // This allows the use of MUI icons, we want this to use placeholders until Lux has the icons ready
      const Icon = img;
      return (
        <Icon sx={{ fontSize: `${scaleRelativeToRoot * 0.75 * scaleRelativeToContainer}cqi` }} />
      );
    }
  };

  return (
    <Container
      width={width}
      color={color ?? '#fff'}
      onClick={!disabled ? handleClick : () => {}}
      scaleRelativeToRoot={scaleRelativeToRoot}
      scaleRelativeToContainer={scaleRelativeToContainer}
      radius={radius}
      fullWidth={fullWidth}
      fullHeight={fullHeight}
      disabled={disabled}
      pulse={pulse}
      shadow={shadow}
      ref={ref}
      flatten={flatten}
      noBorder={noBorder}
      filter={filter}
      shake={shake}
      img={!!img}
    >
      {MyImage()}
      {text && (
        <Text
          scaleRelativeToRoot={scaleRelativeToRoot}
          scaleRelativeToContainer={scaleRelativeToContainer}
          withIcon={!!img}
        >
          {text}
        </Text>
      )}
      {balance !== undefined && (
        <Balance
          scaleRelativeToRoot={scaleRelativeToRoot}
          scaleRelativeToContainer={scaleRelativeToContainer}
        >
          {balance}
        </Balance>
      )}
      {corner && (
        <Corner
          radius={radius - 0.15}
          scaleRelativeToContainer={scaleRelativeToContainer}
          flatten={flatten}
        />
      )}
      {cornerAlt && (
        <CornerAlt radius={radius - 0.15} scaleRelativeToContainer={scaleRelativeToContainer} />
      )}
    </Container>
  );
});

// TODO:read scaleRelativeToContainer calcs
const Container = styled.button<{
  width?: number;
  color: string;
  scaleRelativeToRoot: number;
  scaleRelativeToContainer: number;
  radius: number;
  fullWidth?: boolean;
  fullHeight?: boolean;
  disabled?: boolean;
  pulse?: boolean;
  flatten?: `left` | `right`;
  shadow?: boolean;
  noBorder?: boolean;
  filter?: string;
  shake?: boolean;
  img: boolean;
}>`
  position: relative;
  border: ${({ noBorder }) => (noBorder ? 'none' : 'solid black 0.15em')};
  border-radius: ${({ radius }) => `${radius * 0.7}em`};

  width: ${({ fullWidth, width }) => (fullWidth ? '100%' : width ? `${width}cqi` : 'auto')};
  min-height: fit-content;
  min-width: fit-content;
  height: ${({ fullHeight }) => (fullHeight ? '100%' : 'auto')};
  ${({ img, scaleRelativeToRoot, scaleRelativeToContainer }) =>
    !img &&
    scaleRelativeToRoot &&
    scaleRelativeToContainer &&
    `
  padding: ${` min(${scaleRelativeToRoot * 0.5}rem, ${scaleRelativeToContainer * 0.5}cqi)`};
  gap: ${`min(${scaleRelativeToRoot * 0.3}rem, ${scaleRelativeToContainer * 0.3}cqi)`};`}

  display: flex;
  flex-flow: row nowrap;
  justify-content: center;
  align-items: center;
  background-color: ${({ color, disabled }) => (disabled ? '#bbb' : color)};
  box-shadow: ${({ shadow, scaleRelativeToRoot }) =>
    shadow && `0 0 ${scaleRelativeToRoot * 0.1}rem black`};

  cursor: ${({ disabled }) => (disabled ? 'help' : 'pointer')};
  pointer-events: ${({ disabled }) => (disabled ? 'none' : 'auto')};
  user-select: none;
  ${({ flatten }) =>
    flatten === `right`
      ? ` border-top-right-radius: 0;
      border-bottom-right-radius: 0;
  `
      : flatten === `left` &&
        ` border-top-left-radius: 0;
      border-bottom-left-radius: 0;
  `}

  ${({ pulse }) => pulse && pulseAnimationRule}
  ${({ shake }) => shake && shakeAnimationRule}

  ${({ disabled }) =>
    !disabled &&
    css`
      &:hover {
        animation: ${() => hoverFx()} 0.2s;
        transform: scale(1.05);
        z-index: 1;
      }
      &:active {
        animation: ${() => clickFx()} 0.3s;
      }
    `}
`;

const Image = styled.img<{
  scaleRelativeToRoot: number;
  iconInsetPx?: number;
  iconInsetXpx?: number;
  iconInsetYpx?: number;
  filter?: string;
  scaleRelativeToContainer: number;
}>`
  width: ${({ scaleRelativeToRoot, scaleRelativeToContainer }) =>
    `min(${scaleRelativeToRoot * 1.9}rem, ${scaleRelativeToContainer}cqi)`};
  height: ${({ scaleRelativeToRoot, scaleRelativeToContainer }) =>
    `min(${scaleRelativeToRoot * 1.9}rem, ${scaleRelativeToContainer}cqi)`};

  user-drag: none;
  ${({ scaleRelativeToRoot, scaleRelativeToContainer }) =>
    scaleRelativeToRoot > 2 && scaleRelativeToContainer >= 8 ? 'image-rendering: pixelated;' : ''}
  ${({ filter }) => filter && `filter: ${filter};`}
`;

const Text = styled.div<{
  scaleRelativeToRoot: number;
  scaleRelativeToContainer: number;
  withIcon?: boolean;
}>`
  font-size: ${({ scaleRelativeToRoot, scaleRelativeToContainer }) =>
    `min(${scaleRelativeToRoot * 0.5}rem, ${scaleRelativeToContainer}cqi)`};
  @media (pointer: coarse) {
    font-size: ${({ scaleRelativeToRoot, scaleRelativeToContainer }) =>
      `min(${scaleRelativeToRoot * 0.8}rem, ${scaleRelativeToContainer}cqi)`};
  }
`;

// TODO: get this scaling correctly with parent hover
const Corner = styled.div<{ radius: number; scaleRelativeToContainer: number; flatten?: string }>`
  position: absolute;
  border: solid black ${({ radius }) => radius * 2}cqi;
  border-bottom-right-radius: ${({ radius, flatten }) =>
    flatten === 'right' ? 0 : radius - 0.15}cqi;
  border-color: transparent black black transparent;
  bottom: 0;
  right: 0;
  width: 0;
  height: 0;
`;

// TODO: get this scaling correctly with parent hover
const CornerAlt = styled.div<{ radius: number; scaleRelativeToContainer: number }>`
  position: absolute;
  border: solid black ${({ radius }) => radius}cqi;
  border-top-right-radius: ${({ radius }) => radius - 0.15}cqi;
  border-color: black black transparent transparent;
  top: 0;
  right: 0;
  width: 0;
  height: 0;
`;

const Balance = styled.div<{ scaleRelativeToContainer: number; scaleRelativeToRoot: number }>`
  position: absolute;
  background-color: white;
  border-top: solid black 0.2cqi;
  border-left: solid black 0.2cqi;
  border-radius: 0.6cqi 0 0.6cqi 0;
  bottom: 0;
  right: 0;
  font-size: ${({ scaleRelativeToRoot, scaleRelativeToContainer }) =>
    `min(${scaleRelativeToRoot * 0.3}rem, ${scaleRelativeToContainer * 0.3}cqi)`};
  @media (pointer: coarse) and (max-aspect-ratio: 11/16) {
    font-size: ${({ scaleRelativeToRoot, scaleRelativeToContainer }) =>
      `min(${scaleRelativeToRoot * 0.6}rem, ${scaleRelativeToContainer * 0.6}cqi)`};
  }
  align-items: center;
  justify-content: center;
  padding: 0.3cqi;
  max-width: 100%;
  white-space: nowrap;
  overflow: auto hidden;
  pointer-events: auto;

  ::-webkit-scrollbar {
    -webkit-appearance: none;
    height: 0.2em;
  }
  ::-webkit-scrollbar-thumb {
    height: 0.2em;
    background-color: rgba(0, 0, 0, 0.5);
  }
`;

const pulseAnimationRule = css`
  animation: ${pulseFx} 2.5s ease-in-out infinite;
`;

const shakeAnimationRule = css`
  animation: ${shakeFx} 0.5s ease-in-out infinite;
`;
