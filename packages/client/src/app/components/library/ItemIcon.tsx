import styled from 'styled-components';

import { Tooltip } from 'app/components/library';
import { Item } from 'network/shapes/Item';
import { playClick } from 'utils/sounds';

interface Props {
  item: Item;
  size: 'small' | 'large';
  hoverText?: boolean | string[];
  balance?: number;
  glow?: string;
  onClick?: Function;
  disabled?: boolean;
  styleOverride?: {
    box?: any;
    icon?: any;
  };
}

export const ItemIcon = (props: Props) => {
  const { balance, size, item } = props;

  // layer on a sound effect
  const handleClick = async () => {
    if (props.onClick) {
      playClick();
      await props.onClick();
    }
  };

  const setBoxStyles = () => {
    let styles: any = {};
    if (props.styleOverride?.box) styles = props.styleOverride.box;

    if (props.glow) {
      styles.boxShadow = `0 0 0.75vw 0.75vw ${props.glow}`;
    }

    return styles;
  };

  const setIconStyles = () => {
    let styles: any = {};
    if (props.styleOverride?.icon) styles = props.styleOverride.icon;

    return styles;
  };

  const BalanceBadge = () => {
    if (balance) {
      if (size == 'small') return <SmallBalance>{balance}</SmallBalance>;
      else if (size == 'large') return <LargeBalance>{balance}</LargeBalance>;
    } else {
      return <></>;
    }
  };

  const base = () => {
    if (size == 'small') {
      return (
        <SmallBox style={setBoxStyles()}>
          {props.onClick ? (
            <ButtonWrapper onClick={handleClick}>
              <SmallIcon style={setIconStyles()} src={item.image} />
            </ButtonWrapper>
          ) : (
            <SmallIcon src={item.image} />
          )}
          {BalanceBadge()}
        </SmallBox>
      );
    } else {
      return (
        <LargeBox style={setBoxStyles()}>
          {props.onClick ? (
            <ButtonWrapper onClick={handleClick}>
              <LargeIcon style={setIconStyles()} src={item.image} />
            </ButtonWrapper>
          ) : (
            <LargeIcon src={item.image} />
          )}
          {BalanceBadge()}
        </LargeBox>
      );
    }
  };

  let result = base();

  if (typeof props.hoverText === 'boolean' && props.hoverText) {
    result = (
      <Tooltip text={item.description ? [item.name, '', item.description] : [item.name]}>
        {result}
      </Tooltip>
    );
  } else if (typeof props.hoverText === 'object') {
    result = <Tooltip text={props.hoverText}>{result}</Tooltip>;
  }

  return result;
};

const LargeBox = styled.div`
  position: relative;
  border: solid black 0.2vw;
  border-radius: 1vw;

  width: 10vw;
  height: 10vw;
  margin: 1.4vw;

  align-items: center;
  justify-content: center;
  overflow: hidden;
`;

const LargeIcon = styled.img`
  height: 100%;
  width: 100%;
  padding: 1vw;
  image-rendering: pixelated;
`;

const LargeBalance = styled.div`
  border-top: solid black 0.2vw;
  border-left: solid black 0.2vw;
  border-radius: 0.5vw 0 0 0;
  background-color: #fff;

  position: absolute;
  color: black;
  right: 0;
  bottom: 0;
  padding: 0.4vh 0.4vw;

  font-family: Pixel;
  font-size: 1vw;
`;

const SmallBox = styled.div`
  position: relative;
  border: solid black 0.15vw;
  border-radius: 0.5vw;

  width: 5vw;
  height: 5vw;
  margin: 0.7vw;

  align-items: center;
  justify-content: center;
  overflow: hidden;
`;

const SmallIcon = styled.img`
  height: 100%;
  width: 100%;
  padding: 0.5vw;
  image-rendering: pixelated;
`;

const SmallBalance = styled.div`
  border-top: solid black 0.15vw;
  border-left: solid black 0.15vw;
  border-radius: 0.3vw 0 0 0;
  background-color: #fff;

  position: absolute;
  color: black;
  right: 0;
  bottom: 0;
  padding: 0.2vw;

  font-family: Pixel;
  font-size: 0.5vw;
`;

const ButtonWrapper = styled.div`
  &:hover {
    background-color: #bbb;
  }
`;
