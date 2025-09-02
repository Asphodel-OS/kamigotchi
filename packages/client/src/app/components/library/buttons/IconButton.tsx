import { SvgIconComponent } from '@mui/icons-material';
import { ForwardedRef, forwardRef } from 'react';
import styled from 'styled-components';

import { clickFx, hoverFx, pulseFx } from 'app/styles/effects';
import { playClick } from 'utils/sounds';

// ActionButton is a text button that triggers an Action when clicked
export const IconButton = forwardRef(function IconButton(
  {
    img,
    onClick,
    text,
    disabled,

    // general styling
    color,
    fullWidth,
    pulse,
    shadow,
    width,
    flatten,

    // IconListButton options
    balance,
    corner,

    // open page in new tab indicator
    cornerAlt,

    radius = 0.45,
    scale = 2.5,
    scaleOrientation = 'em',
  }: {
    img?: string | SvgIconComponent;
    onClick: Function;
    text?: string;
    width?: number;

    // general styling
    color?: string;
    disabled?: boolean;
    fullWidth?: boolean;
    pulse?: boolean;

    // IconListButton options
    balance?: number;
    corner?: boolean;

    // open page in new tab indicator
    cornerAlt?: boolean;

    radius?: number;
    scale?: number;
    scaleOrientation?: 'em' | 'em' | 'em';
    shadow?: boolean;
    flatten?: `left` | `right`; // flattens a side, for use with dropdowns
  },
  ref: ForwardedRef<HTMLButtonElement>
) {
  // layer on a sound effect
  const handleClick = async () => {
    playClick();
    await onClick();
  };

  const MyImage = () => {
    if (img) {
      if (typeof img === 'string') {
        return <Image src={img} scale={scale} orientation={scaleOrientation} />;
      }
      // This allows the use of MUI icons, we want this to use placeholders until Lux has the icons ready
      const Icon = img;
      return <Icon sx={{ fontSize: `${scale * 0.75}${scaleOrientation}` }} />;
    }
  };

  return (
    <Container
      width={width}
      color={color ?? '#fff'}
      onClick={!disabled ? handleClick : () => {}}
      scale={scale}
      orientation={scaleOrientation}
      radius={radius}
      fullWidth={fullWidth}
      disabled={disabled}
      pulse={pulse}
      shadow={shadow}
      ref={ref}
      flatten={flatten}
    >
      {MyImage()}
      {text && (
        <Text scale={scale} orientation={scaleOrientation}>
          {text}
        </Text>
      )}
      {balance && <Balance>{balance}</Balance>}
      {corner && <Corner radius={radius - 0.15} orientation={scaleOrientation} flatten={flatten} />}
      {cornerAlt && <CornerAlt radius={radius - 0.15} orientation={scaleOrientation} />}
    </Container>
  );
});

const Container = styled.button<{
  width?: number;
  color: string;
  scale: number;
  orientation: string;
  radius: number;
  fullWidth?: boolean;
  disabled?: boolean;
  pulse?: boolean;
  flatten?: `left` | `right`;
  shadow?: boolean;
}>`
  position: relative;
  border: solid black 0.15em;
  border-radius: ${({ radius, orientation }) => `${radius}${orientation}`};

  height: ${({ scale, orientation }) => `${scale}${orientation}`};
  width: ${({ fullWidth, width }) => (fullWidth ? '100%' : width ? `${width}em` : 'auto')};
  min-width: fit-content;
  padding: ${({ scale, orientation }) => `${scale * 0.1}${orientation}`};
  gap: ${({ scale, orientation }) => `${scale * 0.1}${orientation}`};

  display: flex;
  flex-flow: row nowrap;
  justify-content: center;
  align-items: center;
  background-color: ${({ color, disabled }) => (disabled ? '#bbb' : color)};
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
  &:hover {
    animation: ${() => hoverFx()} 0.2s;
    transform: scale(1.05);
  }
  &:active {
    animation: ${() => clickFx()} 0.3s;
  }

  ${({ pulse }) => pulse && `animation: ${pulseFx} 2.5s ease-in-out infinite;`}
`;

const Image = styled.img<{ scale: number; orientation: string }>`
  width: ${({ scale }) => scale * 0.75}${({ orientation }) => orientation};
  height: ${({ scale }) => scale * 0.75}${({ orientation }) => orientation};
  ${({ scale }) => (scale > 4.5 ? 'image-rendering: pixelated;' : '')}
  user-drag: none;
`;

const Text = styled.div<{ scale: number; orientation: string }>`
  font-size: ${({ scale }) => scale * 0.3}${({ orientation }) => orientation};
`;

// TODO: get this scaling correctly with parent hover
const Corner = styled.div<{ radius: number; orientation: string; flatten?: string }>`
  position: absolute;
  border: solid black ${({ radius }) => radius}${({ orientation }) => orientation};
  border-bottom-right-radius: ${({ radius, flatten }) => (flatten === 'right' ? 0 : radius - 0.15)}${({ orientation }) => orientation};
  border-color: transparent black black transparent;
  bottom: 0;
  right: 0;
  width: 0;
  height: 0;
`;

// TODO: get this scaling correctly with parent hover
const CornerAlt = styled.div<{ radius: number; orientation: string }>`
  position: absolute;
  border: solid black ${({ radius }) => radius}${({ orientation }) => orientation};
  border-top-right-radius: ${({ radius }) => radius - 0.15}${({ orientation }) => orientation};
  border-color: black black transparent transparent;
  top: 0;
  right: 0;
  width: 0;
  height: 0;
`;

const Balance = styled.div`
  position: absolute;
  background-color: white;
  border-top: solid black 0.15em;
  border-left: solid black 0.15em;
  border-radius: 0.3em 0 0.3em 0;
  bottom: 0;
  right: 0;

  font-size: 0.75em;
  align-items: center;
  justify-content: center;
  padding: 0.2em;
`;
