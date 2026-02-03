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
    scale = 1.1,
    icon,
    filter,
    noBorder,
    shake,
    cooldownBackground,
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
    cooldownBackground?: string;

    balance?: number; // shows a balance on icon (for Inventory)
    corner?: boolean; // indicates button has options
    cornerAlt?: boolean; // open page in new tab indicator

    radius?: number;
    scale?: number;
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
            scale={scale}
            iconInsetPx={resolvedIconInsetPx}
            iconInsetXpx={resolvedIconInsetXpx}
            iconInsetYpx={resolvedIconInsetYpx}
            filter={filter}
          />
        );
      }
      // This allows the use of MUI icons, we want this to use placeholders until Lux has the icons ready
      const Icon = img;
      return <Icon sx={{ fontSize: `${scale * 1.5}em` }} />;
    }
  };

  return (
    <Container
      width={width}
      color={color ?? '#fff'}
      onClick={!disabled ? handleClick : () => {}}
      scale={scale}
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
      cooldownBackground={cooldownBackground}
    >
      {MyImage()}
      {text && (
        <Text scale={scale} withIcon={!!img}>
          {text}
        </Text>
      )}
      {balance !== undefined && <Balance scale={scale}>{balance}</Balance>}
      {corner && <Corner radius={radius - 0.15} flatten={flatten} />}
      {cornerAlt && <CornerAlt radius={radius - 0.15} />}
    </Container>
  );
});

const Container = styled.button<{
  width?: number;
  color: string;
  scale: number;
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
  cooldownBackground?: string;
}>`
  position: relative;
  border: ${({ noBorder }) => (noBorder ? 'none' : 'solid black 0.15em')};
  border-radius: ${({ radius }) => `${radius * 1.2}em`};

  width: ${({ fullWidth, width }) => (fullWidth ? '100%' : width ? `${width}em` : 'auto')};
  min-height: fit-content;
  min-width: fit-content;
  height: ${({ fullHeight }) => (fullHeight ? '100%' : 'auto')};
  padding: ${({ img, scale }) => scale * (img ? 0.15 : 0.3)}em;

  display: flex;
  flex-flow: row nowrap;
  justify-content: center;
  align-items: center;
  background: ${({ color, disabled, cooldownBackground }) =>
    cooldownBackground || (disabled ? '#bbb' : color)};
  box-shadow: ${({ shadow, scale }) => shadow && `0 0 ${scale * 0.1}em black`};

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
  scale: number;
  iconInsetPx?: number;
  iconInsetXpx?: number;
  iconInsetYpx?: number;
  filter?: string;
}>`
  width: ${({ scale }) => `${scale * 1.9}em`};
  height: ${({ scale }) => `${scale * 1.9}em`};

  user-drag: none;
  ${({ scale }) => (scale > 2 ? 'image-rendering: pixelated;' : '')}
  ${({ filter }) => filter && `filter: ${filter};`}
`;

const Text = styled.div<{
  scale: number;
  withIcon?: boolean;
}>`
  font-size: ${({ scale }) => `${scale * 0.8}em`};
  white-space: nowrap;
`;

const Corner = styled.div<{ radius: number; flatten?: string }>`
  position: absolute;
  border: solid black ${({ radius }) => radius * 0.9}em;
  border-bottom-right-radius: ${({ radius, flatten }) =>
    flatten === 'right' ? 0 : `${radius * 1.2}em`};
  border-color: transparent black black transparent;
  bottom: 0;
  right: 0;
  width: 0;
  height: 0;
`;

const CornerAlt = styled.div<{ radius: number }>`
  position: absolute;
  border: solid black ${({ radius }) => radius * 0.25}em;
  border-top-right-radius: ${({ radius }) => `${radius * 0.25}em`};
  border-color: black black transparent transparent;
  top: 0;
  right: 0;
  width: 0;
  height: 0;
`;

const Balance = styled.div<{ scale: number }>`
  position: absolute;
  background-color: white;
  border-top: solid black 0.05em;
  border-left: solid black 0.05em;
  border-radius: 0.15em 0 0.45em 0;
  bottom: 0;
  right: 0;
  font-size: ${({ scale }) => `${scale * 0.5}em`};
  align-items: center;
  justify-content: center;
  padding: 0.1em;
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
