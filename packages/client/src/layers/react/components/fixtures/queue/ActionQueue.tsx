import React, { useEffect, useState } from 'react';
import { map } from 'rxjs';
import styled from 'styled-components';

import { registerUIComponent } from 'layers/react/engine/store';
import { Log } from './Log';

export function registerActionQueueFixture() {
  registerUIComponent(
    'ActionQueue',
    {
      rowStart: 100,
      rowEnd: 70,
      colStart: 80,
      colEnd: 100,
    },

    (layers) => {
      const { network: { actions } } = layers;
      return actions!.Action.update$.pipe(
        map(() => {
          return { layers };
        })
      );
    },

    ({ layers }) => {
      return (
        <Wrapper>
          <Content style={{ pointerEvents: 'auto' }}>
            <Log network={layers.network} />
          </Content>
          <Description>TX Queue:</Description>
        </Wrapper>
      );
    }
  );
}

const Wrapper = styled.div`
  display: block;
  align-items: left;
`;

const Content = styled.div`
  display: flex;
  flex-direction: column;
  background-color: white;
  border-radius: 10px;
  box-shadow: 0 0 10px rgba(0, 0, 0, 0.3);
  padding: 20px;
  width: 99%;
  border-style: solid;
  border-width: 2px;
  border-color: black;

  overflow: scroll;
  max-height: 300px;
`;

const Description = styled.div`
  font-size: 14px;
  color: #333;
  text-align: left;
  padding: 2px;
  font-family: Pixel;
`;