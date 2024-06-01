import { of } from 'rxjs';

import { registerUIComponent } from 'app/root';
import { useVisibility } from 'app/stores';
import styled from 'styled-components';
import { AccountMenuButton, MapMenuButton, PartyMenuButton } from './buttons';

export function registerMenuLeft() {
  registerUIComponent(
    'LeftMenuFixture',
    {
      colStart: 2,
      colEnd: 33,
      rowStart: 3,
      rowEnd: 6,
    },
    (layers) => of(layers),
    () => {
      const { fixtures } = useVisibility();

      return (
        <Wrapper style={{ display: fixtures.menu ? 'flex' : 'none' }}>
          <AccountMenuButton />
          <MapMenuButton />
          <PartyMenuButton />
        </Wrapper>
      );
    }
  );
}

const Wrapper = styled.div`
  flex-direction: row;
  align-items: center;
  justify-content: flex-start;
  gap: 0.6vh;
`;
