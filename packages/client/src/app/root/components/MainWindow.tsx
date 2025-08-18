import { allComponents } from 'app/components';
import { useLayers } from 'app/root/hooks';
import type { UIComponentWithGrid } from 'app/root/types';
import { observer } from 'mobx-react-lite';
import { Layers } from 'network/index';
import { useStream } from 'network/utils';
import { useMemo } from 'react';
import styled from 'styled-components';

export const MainWindow = observer(() => {
  const layers = useLayers();
  if (!layers) return null;

  return (
    <UIGrid>
      {allComponents.map((componentWithGrid) => (
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
  const req$ = useMemo(() => uiComponent.requirement(layers), [uiComponent, layers]);

  const state = useStream(req$);

  if (!state) return null;

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
  z-index: 10;
  overflow: hidden;
`;
