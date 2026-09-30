import { observer } from 'mobx-react-lite';
import styled from 'styled-components';

import { allComponents } from 'app/components';

export const MainWindow = observer(({ ready }: { ready: boolean }) => {
  // wallet login needs no synced state, so players can connect while the world is still loading
  const renderedComponents = ready
    ? allComponents
    : allComponents.filter((c, i) => i < 5 || c.uiComponent.id === 'WalletConnecter');

  return (
    <UIGrid>
      {renderedComponents.map(({ uiComponent, gridConfig }) => (
        <div
          key={uiComponent.id}
          style={{
            gridArea: `${gridConfig.rowStart} / ${gridConfig.colStart} / ${gridConfig.rowEnd} / ${gridConfig.colEnd}`,
          }}
        >
          {<uiComponent.Render />}
        </div>
      ))}
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
  * {
    -webkit-user-select: none;
    -ms-user-select: none;
    user-select: none;
    user-drag: none;
    -webkit-user-drag: none;
  }
`;
