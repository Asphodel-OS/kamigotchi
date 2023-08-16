import React, { useEffect, useState } from "react";
import styled from "styled-components";
import original from 'assets/images/loading/original.png'

export const BootScreen: React.FC<{}> = ({ children }) => {

  // TODO: on load, select a random banner to use
  useEffect(() => {

  }, []);

  return (
    <Container>
      <Image src={original} />
      <div>{children || <>&nbsp;</>}</div>
    </Container>
  );
};

const Container = styled.div`
  width: 100%;
  height: 100%;
  position: absolute;
  background-color: #000;
  display: grid;
  align-content: center;
  align-items: center;
  justify-content: center;
  justify-items: center;
  transition: all 2s ease;
  grid-gap: 50px;
  z-index: 100;
  pointer-events: all;

  div {
    font-family: "Space Grotesk", sans-serif;
  }
`;

const Image = styled.img`
  transition: all 2s ease;
  width: 800px;
`;
