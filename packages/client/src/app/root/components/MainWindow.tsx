import { observer } from 'mobx-react-lite';
import { useMemo } from 'react';
import styled from 'styled-components';

import { allComponents } from 'app/components';
import { useLayers } from 'app/root/hooks';
import type { UIComponentWithGrid } from 'app/root/types';
import { Layers } from 'network/index';
import { useStream } from 'network/utils';
import { of } from 'rxjs';

export const MainWindow = observer(({ ready }: { ready: boolean }) => {
  const layers = useLayers();

  // this includes the LoadingState and ActionQueue components when not ready
  const toRender = ready ? allComponents : allComponents.slice(0, 4);

  return (
    <UIGrid>
      {toRender.map((componentWithGrid) => (
        <UIComponentRenderer
          key={componentWithGrid.uiComponent.id}
          layers={layers}
          componentWithGrid={componentWithGrid}
        />
      ))}
    </UIGrid>
  );
});

const UIComponentRenderer = ({
  layers,
  componentWithGrid,
}: {
  layers: Layers;
  componentWithGrid: UIComponentWithGrid;
}) => {
  const { uiComponent, gridConfig } = componentWithGrid;
  const req$ = useMemo(
    () => (uiComponent.requirement ? uiComponent.requirement(layers) : of({})),
    [uiComponent, layers]
  );

  const state = useStream(req$);

  // Only prevent rendering when stream hasn't emitted yet, not when state is valid but falsy
  // This allows components to render states like { open: false } or 0
  if (state === undefined) return null;

  return (
    <div
      style={{
        gridArea: `${gridConfig.rowStart} / ${gridConfig.colStart} / ${gridConfig.rowEnd} / ${gridConfig.colEnd}`,
      }}
    >
      {<uiComponent.Render {...state} />}
    </div>
  );
};

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
