import React from 'react';
import styled from 'styled-components';

import { useNetwork } from 'app/stores';
import { loadingScreens } from 'assets/images/loading';

export const BootScreen: React.FC<{}> = ({ children }) => {
  const { randNum } = useNetwork();
  const bannerKeys = Object.keys(loadingScreens);
  const bannerValues = Object.values(loadingScreens);

  const getBannerIndex = () => {
    return Math.floor(randNum * bannerKeys.length);
  };

  return (
    <Container>
      <Image src={bannerValues[getBannerIndex()]} />
      <Status>{children}</Status>
      <TagContainer>
        <Tag>banner by: </Tag>
        <Tag>{bannerKeys[getBannerIndex()]}</Tag>
      </TagContainer>
    </Container>
  );
};

const Container = styled.div`
  width: 100%;
  height: 100%;
  position: absolute;
  background-color: #000;
  align-content: center;
  align-items: center;
  justify-content: center;
  justify-items: center;
  transition: all 2s ease;
  pointer-events: all;
  z-index: 100;
`;

const Image = styled.img`
  transition: all 2s ease;
  height: 100%;
  width: 100%;
  align-self: right;
`;

const Status = styled.div`
  color: #fff;
  position: absolute;
  bottom: 35vh;
  width: 100%;

  text-align: center;
  font-family: Pixel;
  font-size: 2.4vh;
`;

const TagContainer = styled.div`
  position: absolute;
  bottom: 5vh;
  left: 5vw;
  width: 100%;
`;

const Tag = styled.div`
  color: #fff;
  text-align: left;
  font-family: Pixel;
  font-size: 1.8vh;
  line-height: 2.4vh;
`;
