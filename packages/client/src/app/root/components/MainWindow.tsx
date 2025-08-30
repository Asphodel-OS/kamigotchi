import { observer } from 'mobx-react-lite';
import styled from 'styled-components';

import { allComponents } from 'app/components';

export const MainWindow = observer(({
  ready,
}: {
  ready: boolean;
}) => {
  // this includes the LoadingState and ActionQueue components when not ready
  const renderedComponents = ready ? allComponents : allComponents.slice(0, 2);

  return (
    <UIGrid>
      {
        renderedComponents
          .map(({ uiComponent, gridConfig }) => (
            <div
              style={{
                gridArea: `${gridConfig.rowStart} / ${gridConfig.colStart} / ${gridConfig.rowEnd} / ${gridConfig.colEnd}`,
              }}
            >
              {<uiComponent.Render />}
            </div>
          ))
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
