import styled from 'styled-components';

import { clickFx, hoverFx, pulseFx } from 'app/styles/effects';
import { playClick } from 'utils/sounds';

interface Props {
  img: string;
  onClick: () => void;
  text?: string;
  size?: number;
  color?: string;
  disabled?: boolean;
  noMargin?: boolean;
  pulse?: boolean;
  utils?: {
    extraProps: () => {
      isIconList?: boolean;
      balance?: number;
      fullWidth?: boolean;
      scalesOnHeight?: boolean;
    };
  };
}

// ActionButton is a text button that triggers an Action when clicked
export const IconButton = (props: Props) => {
  const { img, onClick, text, size, color, disabled, noMargin, pulse, utils } = props;
  const scale = size ?? 2.5;

  const { isIconList, balance, fullWidth, scalesOnHeight } = utils?.extraProps?.() ?? {};

  const scalescaleOrientation = scalesOnHeight ? 'vh' : 'vw';

  // layer on a sound effect
  const handleClick = async () => {
    playClick();
    await onClick();
  };
  //console.log('im text' + text);
  return (
    <Button
      scale={scale}
      onClick={(e: React.MouseEvent<HTMLButtonElement>) => {
        !disabled ? handleClick() : e.preventDefault;
      }}
      color={color ?? '#fff'}
      pulse={pulse}
      noMargin={noMargin}
      disabled={disabled}
      square={!text}
      fullWidth={fullWidth}
      isIconList={isIconList}
    >
      {balance ? <Balance>{balance}</Balance> : isIconList && <Corner />}
      <Image isIconList={isIconList} src={img} scale={scale} orientation={scalescaleOrientation} />
      {text && (
        <Text isIconList={isIconList} scale={scale}>
          {text}
        </Text>
      )}
    </Button>
  );
};

const Button = styled.button<{
  scale: number;
  color: string;
  disabled?: boolean;
  pulse?: boolean;
  noMargin?: boolean;
  square?: boolean;
  fullWidth?: boolean;
  isIconList?: boolean;
  text?: string;
}>`
  border: solid black 0.15vw;
  display: flex;
  justify-content: center;
  align-items: center;
  background-color: ${({ color, disabled }) => (disabled ? '#bbb' : color)};
  cursor: ${({ disabled }) => (disabled ? 'help' : 'pointer')};
  pointer-events: ${({ disabled }) => (disabled ? 'none' : 'auto')};
  &:hover {
    animation: ${() => hoverFx()} 0.2s;
    transform: scale(1.05);
  }
  ${({ isIconList, fullWidth, scale, noMargin, square, pulse }) => {
    if (isIconList)
      return `
      position: relative;
      border-radius: 0.45vw;
      color: black;
      width: ${fullWidth ? '100%' : 'auto'};
      padding: 0.4vw;
      gap: 0.4vw;
    `;
    if (!isIconList)
      return `
      margin: ${noMargin ? 0 : scale * 0.1}vw;
      padding: ${scale * 0.1}vw;
      gap: ${scale * 0.1}vw;
      border-radius: ${scale * 0.2}vw;
      height: ${scale}vw;
      ${square && `width: ${scale}vw;`}
      flex-flow: row nowrap;
      user-select: none;
      &:active {
        animation: ${() => clickFx()} 0.3s;
      }

      animation: ${pulse && pulseFx} 3s ease-in-out infinite;
        `;
  }}
`;

const Text = styled.div<{ scale: number; isIconList?: boolean }>`
  ${({ isIconList, scale }) => {
    if (isIconList)
      return `
        font-size: 0.8vw;
    `;
    if (!isIconList)
      return `
        font-size: ${scale * 0.25}vw;
    `;
  }}
`;
const Image = styled.img<{ scale: number; orientation: string; isIconList?: boolean }>`
  ${({ isIconList, scale, orientation }) => {
    if (isIconList)
      return `
        width: ${scale + orientation} ;
        height: ${scale + orientation} ;
        ${scale > 3.2 ? 'image-rendering: pixelated;' : ''};
    `;
    if (!isIconList)
      return `
        height: ${scale * 0.75}vw;
    `;
  }}
`;
const Balance = styled.div`
  position: absolute;
  background-color: white;
  border-top: solid black 0.15vw;
  border-left: solid black 0.15vw;
  border-radius: 0.3vw 0 0.3vw 0;
  bottom: 0;
  right: 0;
  font-size: 0.75vw;
  align-items: center;
  justify-content: center;
  padding: 0.2vw;
`;
const Corner = styled.div`
  position: absolute;
  border: solid black 0.3vw;
  border-color: transparent black black transparent;
  right: 0;
  bottom: 0;
  width: 0;
  height: 0;
`;
