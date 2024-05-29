import React, { useEffect, useState } from 'react';
import styled from 'styled-components';

import { loadingScreens } from 'assets/images/loading';

export const BootScreen: React.FC<{}> = ({ children }) => {
  const [rand, setRand] = useState(0); // index of randomly selected banner
  const bannerKeys = Object.keys(loadingScreens);
  const bannerValues = Object.values(loadingScreens);

  // set the banner on startup and on a 5 second interval
  useEffect(() => {
    refreshBanner();
    const timerId = setInterval(refreshBanner, 5000);
    return function cleanup() {
      clearInterval(timerId);
    };
  }, []);

  // swaps the banner image
  const refreshBanner = () => {
    setRand(Math.floor(Math.random() * bannerKeys.length));
  };

  return (
    <Container>
      <Image src={bannerValues[rand]} />
      <Status>{children}</Status>
      <Tag>banner by: {bannerKeys[rand]}</Tag>
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
  font-family: 'Space Grotesk', sans-serif;
  font-size: 3vh;
`;

const Tag = styled.div`
  color: #fff;
  position: absolute;
  bottom: 5vh;
  left: 5vw;
  width: 100%;

  text-align: left;
  font-family: 'Space Grotesk', sans-serif;
  font-size: 2vh;
`;
