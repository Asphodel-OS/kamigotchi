import { useLayers, useStore } from 'app/root/hooks';
import { observer } from 'mobx-react-lite';
import React, { useMemo } from 'react';
import styled from 'styled-components';

import { GridConfiguration, UIComponent } from 'app/root/types';
import { Layers } from 'network/';
import { useStream } from 'network/utils';
import { Cell } from './Cell';

const UIComponentContainer: React.FC<{ gridConfig: GridConfiguration }> = React.memo(
  ({ children, gridConfig }) => {
    const { colStart, colEnd, rowStart, rowEnd } = gridConfig;

    return (
      <Cell
        style={{
          gridRowStart: rowStart,
          gridRowEnd: rowEnd,
          gridColumnStart: colStart,
          gridColumnEnd: colEnd,
        }}
      >
        {children}
      </Cell>
    );
  }
);

export const UIComponentRenderer: React.FC<{
  layers: Layers;
  id: string;
  uiComponent: UIComponent;
}> = React.memo(({ layers, id, uiComponent: { requirement, Render, gridConfig } }) => {
  const req = useMemo(() => requirement(layers), [requirement, layers]);
  const state = useStream(req);
  if (!state) return null;

  return (
    <UIComponentContainer key={`component-${id}`} gridConfig={gridConfig}>
      {<Render {...state} />}
    </UIComponentContainer>
  );
});

export const ComponentRenderer = observer(() => {
  const { UIComponents } = useStore();
  const layers = useLayers();
  if (!layers) return null;

  return (
    <UIGrid>
      {
        // Iterate through all registered UIComponents
        // and return those whose requirements are fulfilled
        [...UIComponents.entries()]
          .map(([id, uiComponent]) => {
            return (
              <UIComponentRenderer
                layers={layers}
                id={id}
                key={`componentRenderer-${id}`}
                uiComponent={uiComponent}
              />
            );
          })
          .filter((value) => value != null)
      }
    </UIGrid>
  );
});

const UIGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(100, 1%);
  grid-template-rows: repeat(100, 1%);
  position: absolute;
  left: 0;
  top: 0;
  height: 100vh;
  width: 100vw;
  pointer-events: none;
  z-index: 10;
  overflow: hidden;
`;
