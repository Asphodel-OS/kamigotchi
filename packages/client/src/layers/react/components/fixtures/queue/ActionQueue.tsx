import React, { useEffect, useState } from 'react';
import { map } from 'rxjs';
import styled from 'styled-components';

import { Logs } from './Logs';
import { Controls } from './Controls';
import { registerUIComponent } from 'layers/react/engine/store';
import { useComponentSettings } from 'layers/react/store/componentSettings';
import { EntityIndex, getComponentEntities } from '@latticexyz/recs';

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
      const ActionComponent = layers.network.actions!.Action;
      const { fixtures } = useComponentSettings();
      const [mode, setMode] = useState<number>(1);
      const [actionIndices, setActionIndices] = useState<EntityIndex[]>([]);

      // track the full list of Actions by their Entity Index
      useEffect(() => {
        setActionIndices([...getComponentEntities(ActionComponent)]);
      }, [([...getComponentEntities(ActionComponent)]).length]);

      const sizes = ['none', '23vh', '90vh'];
      return (
        <Wrapper
          style={{ display: fixtures.actionQueue ? 'block' : 'none' }}
        >
          <Content style={{ pointerEvents: 'auto', maxHeight: sizes[mode] }}>
            {(mode !== 0) && <Logs actionIndices={actionIndices} network={layers.network} />}
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