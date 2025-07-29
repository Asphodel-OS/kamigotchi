import { observer } from 'mobx-react-lite';
import React from 'react';
import styled from 'styled-components';

const WINDOW_CLASSNAME = 'react-ui-window';

export const Cell = observer(({
  children,
  style,
}: {
  children: React.ReactNode;
  style: React.CSSProperties;
}) => {
  return (
    <Container style={style} className={WINDOW_CLASSNAME}>
      {children}
    </Container>
  );
});

const Container = styled.div`
  width: 100%;
  height: 100%;
  color: #fff;
`;
