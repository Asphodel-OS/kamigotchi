import { EntityIndex, getComponentEntities } from '@mud-classic/recs';
import { useEffect, useState } from 'react';
import { map, merge } from 'rxjs';
import styled from 'styled-components';

import { UIComponent } from 'app/root/types';
import { useVisibility } from 'app/stores';
import { Controls } from './Controls';
import { Logs } from './Logs';

export const ActionQueue: UIComponent = {
  id: 'ActionQueue',
  requirement: (layers) => {
    const { network } = layers;
    const { actions, components } = network;
    const { LoadingState } = components;

    return merge(actions.Action.update$, LoadingState.update$).pipe(
      map(() => {
        return { network };
      })
    );
  },
  Render: ({ network }) => {
    const ActionComponent = network.actions.Action;
    const { fixtures } = useVisibility();
    const [mode, setMode] = useState<number>(1);
    const [actionIndices, setActionIndices] = useState<EntityIndex[]>([]);

    // track the full list of Actions by their Entity Index
    useEffect(() => {
      setActionIndices([...getComponentEntities(ActionComponent)]);
    }, [[...getComponentEntities(ActionComponent)].length]);

    const sizes = ['none', '23vh', '90vh'];
    return (
      <Wrapper style={{ display: fixtures.actionQueue ? 'block' : 'none' }}>
        <Content style={{ pointerEvents: 'auto', maxHeight: sizes[mode] }}>
          {mode !== 0 && <Logs actionIndices={actionIndices} network={network} />}
          <Controls mode={mode} setMode={setMode} />
        </Content>
      </Wrapper>
    );
  },
};

const Wrapper = styled.div`
  align-items: left;
  user-select: none;
`;

// cancer. just absolute cancer
const Content = styled.div`
  position: absolute;
  padding: 0.2vw;

  right: 1.33vw;
  width: 32.66vw;
  max-width: 32.66vw;

  bottom: 1.7vh;
  max-height: 23vh;

  border: solid black 0.15vw;
  border-radius: 0.6vw;

  background-color: white;
  display: flex;
  flex-flow: column nowrap;
`;
