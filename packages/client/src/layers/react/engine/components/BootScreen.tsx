import React, { useEffect, useState } from "react";
import styled from "styled-components";
import mud from 'assets/images/mud.png'

export const BootScreen: React.FC<{ initialOpacity?: number }> = ({ children, initialOpacity }) => {
  const [opacity, setOpacity] = useState(initialOpacity ?? 0);

  useEffect(() => setOpacity(1), []);

  return (
    <Container>
      <Logo src={mud} />
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

const Logo = styled.img`
transition: all 2s ease;
width: 800px;
`;
