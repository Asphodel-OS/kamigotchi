import React, { useEffect, useState } from "react";
import styled from "styled-components";
import { loadingScreens } from "assets/images/loading";

export const BootScreen: React.FC<{}> = ({ children }) => {
  const [image, setImage] = useState();

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
    const rand = Math.floor(Math.random() * loadingScreens.length)
    const randomBanner = loadingScreens[rand];
    setImage(randomBanner);
  };

  return (
    <Container>
      <Image src={image} />
      <Text>{children || <>&nbsp</>}</Text>
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
  width: 100%;
`;

const Text = styled.div`
  color: #fff;
  position: absolute;
  bottom: 15vw;
  width: 100%;

  text-align: center;
  font-family: "Space Grotesk", sans-serif;
  font-size: 20px;
`;
