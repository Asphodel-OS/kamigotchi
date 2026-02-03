import { UIComponent } from 'app/root/types';
import { useVisibility } from 'app/stores';
import { useEffect, useState } from 'react';
import styled from 'styled-components';
import {
  ItemsMenuButton,
  MoreMenuButton,
  SocialMenuButton,
  SudoMenuButton,
  WorldMenuButton,
} from './buttons';

export const RightMenuFixture: UIComponent = {
  id: 'RightMenuFixture',
  Render: () => {
    const menuVisible = useVisibility((s) => s.fixtures.menu);

    const [isMobile, setIsMobile] = useState(false);

    useEffect(() => {
      const mobileQuery = window.matchMedia('(max-aspect-ratio: 11/16) ');
      setIsMobile(mobileQuery.matches);
      const handler = (e: MediaQueryListEvent) => setIsMobile(e.matches);
      mobileQuery.addEventListener('change', handler);
      return () => {
        mobileQuery.removeEventListener('change', handler);
      };
    }, []);
    return (
      <Wrapper>
        {isMobile && (
          <>
            {menuVisible && (
              <>
                <SocialMenuButton />
                <WorldMenuButton />
                <ItemsMenuButton />
              </>
            )}
            <SudoMenuButton />
            <MoreMenuButton />
          </>
        )}
      </Wrapper>
    );
  },
};

const Wrapper = styled.div`
  justify-self: end;

  @media (max-aspect-ratio: 11/16) {
    justify-self: stretch;

    > * {
      flex: 1;

      button {
        width: 100%;
      }
    }
  }

  display: flex;
  gap: 0.3em;
`;
