import { Tooltip } from 'layers/react/components/library/Tooltip';
import React from 'react';
import styled from 'styled-components';

import { playClick } from 'utils/sounds';

import { Item } from 'layers/react/shapes/Item';

interface Props {
  id: string;
  item: Item;
  size: 'small' | 'large' | 'fixed';
  named?: boolean;
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
  }

  const setStyles = () => {
    let styles: any = {};

    if (props.glow) {
      styles.boxShadow = `0 0 0.75vw 0.75vw ${props.glow}`;
    }

    return styles;
  }

  const balance = () => {
    if (props.balance) {
      switch (props.size) {
        case 'small':
          return (
            <SmallBalance>{props.balance}</SmallBalance>
          );
          break;
        case 'large':
          return (
            <LargeBalance>{props.balance}</LargeBalance>
          );
          break;
        case 'fixed':
          return (
            <FixedBalance>{props.balance}</FixedBalance>
          );
          break;
      }
    } else {
      return (<></>);
    }
  }

  const base = () => {
    switch (props.size) {
      case 'small':
        return (
          <SmallBox style={setStyles()}>
            {props.onClick
              ? <ButtonWrapper onClick={handleClick}>
                <SmallIcon src={props.item.image.default} />
              </ButtonWrapper>
              : <SmallIcon src={props.item.image.default} />
            }
            {balance()}
          </SmallBox>
        );
        break;
      case 'large':
        return (
          <LargeBox style={setStyles()}>
            {props.onClick
              ? <ButtonWrapper onClick={handleClick}>
                <LargeIcon src={props.item.image.x4} />
              </ButtonWrapper>
              : <LargeIcon src={props.item.image.x4} />
            }
            {balance()}
          </LargeBox>
        );
        break;
      case 'fixed':
        return (
          <FixedBox style={setStyles()}>
            {props.onClick
              ? <ButtonWrapper onClick={handleClick}>
                <FixedIcon src={props.item.image.default} />
              </ButtonWrapper>
              : <FixedIcon src={props.item.image.default} />
            }
            {balance()}
          </FixedBox>
        );
        break;
    }
  }

  let result = base();


  if (props.named) {
    result = (
      <Tooltip text={[props.item.name]}>
        {result}
      </Tooltip>
    );
  }

  return result;
}

const LargeBox = styled.div`
  position: relative;
  border: solid black .2vw;
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
  border-top: solid black .2vw;
  border-left: solid black .2vw;
  border-radius: 0.5vw 0 0 0;
  background-color: #FFF;

  position: absolute;
  color: black;
  right: 0;
  bottom: 0;
  padding: .4vh .4vw;

  font-family: Pixel;
  font-size: 1vw;
`;

const SmallBox = styled.div`
  position: relative;
  border: solid black .15vw;
  border-radius: .5vw;

  width: 5vw;
  height: 5vw;
  margin: .7vw;

  align-items: center;
  justify-content: center;
  overflow: hidden;
`;

const SmallIcon = styled.img`
  height: 100%;
  width: 100%;
  padding: .5vw;
`;

const SmallBalance = styled.div` 
  border-top: solid black .15vw;
  border-left: solid black .15vw;
  border-radius: .3vw 0 0 0;
  background-color: #FFF;

  position: absolute;
  color: black;
  right: 0;
  bottom: 0;
  padding: .2vw;

  font-family: Pixel;
  font-size: .5vw;
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
  background-color: #FFF;

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
    background-color: #BBB;
  }
`;