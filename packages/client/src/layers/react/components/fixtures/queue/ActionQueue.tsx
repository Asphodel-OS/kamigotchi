import React, { useEffect, useState } from 'react';
import { map } from 'rxjs';
import styled from 'styled-components';

import { Log } from './Log';
import { Controls } from './Controls';
import { registerUIComponent } from 'layers/react/engine/store';
import { dataStore } from 'layers/react/store/createStore';

export function registerActionQueueFixture() {
  registerUIComponent(
    'ActionQueue',
    {
      rowStart: 90,
      rowEnd: 100,
      colStart: 66,
      colEnd: 99,
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
      const [mode, setMode] = useState<'collapsed' | 'expanded'>('expanded');
      const { fixtures } = dataStore();

      return (
        <Wrapper
          style={{ display: fixtures.actionQueue ? 'block' : 'none' }}
        >
          <Content style={{ pointerEvents: 'auto' }}>
            {(mode === 'expanded') && <Log network={layers.network} />}
            <Controls
              mode={mode}
              setMode={setMode}
              network={layers.network}
            />
          </Content>
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
  position: absolute;
  bottom: 1vw;
  right: 1vw;
  width: 33vw;
  padding: .2vw;
  max-height: 33vh;

  border: solid black 2px;
  border-radius: 10px;
  

  background-color: white;  
  display: flex;
  flex-flow: column nowrap;

`;