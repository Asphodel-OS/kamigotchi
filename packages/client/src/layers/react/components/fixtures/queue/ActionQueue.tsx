import React, { useState } from 'react';
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
            {(mode !== 'collapsed') && <Log network={layers.network} />}
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

// cancer. just absolute cancer
const Content = styled.div`
  position: absolute;
  padding: .2vw;
  
  right: 1.33vw;
  width: 32.66vw;
  max-width: 32.66vw;

  bottom: 3vh;
  max-height: 23vh;

  border: solid black 2px;
  border-radius: 10px;

  background-color: white;  
  display: flex;
  flex-flow: column nowrap;
`;