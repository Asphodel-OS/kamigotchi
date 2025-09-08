import { EntityIndex, getComponentEntities } from '@mud-classic/recs';
import { useEffect, useState } from 'react';
import styled from 'styled-components';

import { UIComponent } from 'app/root/types';
import { useLayers } from 'app/root/hooks';
import { useVisibility } from 'app/stores';
import { useStream } from 'network/utils/hooks';
import { Controls } from './Controls';
import { Logs } from './Logs';

export const ActionQueue: UIComponent = {
  id: 'ActionQueue',
  Render: () => {
    const { network } = useLayers();

    const { actions: { Action: ActionComponent } } = network;

    const actionUpdate = useStream(ActionComponent.update$);

    const actionQueueVisible = useVisibility((s) => s.fixtures.actionQueue);
    const [mode, setMode] = useState<number>(1);
    const [actionIndices, setActionIndices] = useState<EntityIndex[]>([]);

    // track the full list of Actions by their Entity Index
    useEffect(() => {
      setActionIndices([...getComponentEntities(ActionComponent)]);
    }, [actionUpdate]);

    if(!actionQueueVisible) return null;

    const sizes = ['none', '100%', '90vh'];
    return (
      <Wrapper>
        <Content style={{ pointerEvents: 'auto', maxHeight: sizes[mode] }}>
          {mode !== 0 && <Logs actionIndices={actionIndices} network={network} />}
          <Controls mode={mode} setMode={setMode} />
        </Content>
      </Wrapper>
    );
  },
};

const Wrapper = styled.div`
  height: 0;
  min-height: 100%;
  display: flex;
  flex-direction: column;
  justify-content: end;

  user-select: none;
`;

// cancer. just absolute cancer
const Content = styled.div`
  display: grid;
  padding: 0.2em;

  border: solid black 0.15em;
  border-radius: 0.6em;

  background-color: white;
`;
