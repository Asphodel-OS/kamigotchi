import styled from 'styled-components';

import { DetailedEntity } from 'layers/network/shapes/utils/EntityTypes';
import { Tooltip } from 'layers/react/components/library/Tooltip';
import { playClick } from 'utils/sounds';

interface Props {
  item: DetailedEntity;
  size: 'small' | 'large' | 'fixed';
  description?: boolean;
  balance?: number;
  glow?: string;
  onClick?: Function;
  disabled?: boolean;
}

export const ItemIcon = (props: Props) => {
  // layer on a sound effect
  const handleClick = async () => {
    if (props.onClick) {
      playClick();
      await props.onClick();
    }
  };

  const setStyles = () => {
    let styles: any = {};

    if (props.glow) {
      styles.boxShadow = `0 0 0.75vw 0.75vw ${props.glow}`;
    }

    return styles;
  };

  const balance = () => {
    if (props.balance) {
      if (props.size == 'small') return <SmallBalance>{props.balance}</SmallBalance>;
      else if (props.size == 'large') return <LargeBalance>{props.balance}</LargeBalance>;
      else if (props.size == 'fixed') return <FixedBalance>{props.balance}</FixedBalance>;
    } else {
      return <></>;
    }
  };

  const base = () => {
    if (props.size == 'small')
      return (
        <SmallBox style={setStyles()}>
          {props.onClick ? (
            <ButtonWrapper onClick={handleClick}>
              <SmallIcon src={props.item.image} />
            </ButtonWrapper>
          ) : (
            <SmallIcon src={props.item.image} />
          )}
          {balance()}
        </SmallBox>
      );
    else if (props.size == 'large')
      return (
        <LargeBox style={setStyles()}>
          {props.onClick ? (
            <ButtonWrapper onClick={handleClick}>
              <LargeIcon src={props.item.image4x ?? props.item.image} />
            </ButtonWrapper>
          ) : (
            <LargeIcon src={props.item.image4x ?? props.item.image} />
          )}
          {balance()}
        </LargeBox>
      );
    else props.size == 'fixed';
    return (
      <FixedBox style={setStyles()}>
        {props.onClick ? (
          <ButtonWrapper onClick={handleClick}>
            <FixedIcon src={props.item.image} />
          </ButtonWrapper>
        ) : (
          <FixedIcon src={props.item.image} />
        )}
        {balance()}
      </FixedBox>
    );
  };

  let result = base();

  if (props.description) {
    result = <Tooltip text={[props.item.name, '', props.item.description ?? '']}>{result}</Tooltip>;
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

const FixedBox = styled.div`
  position: relative;
  border: solid black 1.5px;
  border-radius: 4px;

  margin: 5px;

  align-items: center;
  justify-content: center;
  overflow: hidden;
`;

const FixedIcon = styled.img`
  height: 50px;
  width: 50px;
  padding: 5px;
`;

const FixedBalance = styled.div`
  border-top: solid black 1.25px;
  border-left: solid black 1.25px;
  border-radius: 2.5px 0 0 0;
  background-color: #fff;

  position: absolute;
  color: black;
  right: 0;
  bottom: 0;
  padding: 2px;

  font-family: Pixel;
  font-size: 8px;
`;

const ButtonWrapper = styled.div`
  &:hover {
    background-color: #bbb;
  }
`;
