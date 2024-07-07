import { useState } from 'react';
import { of } from 'rxjs';
import styled from 'styled-components';

import { ActionButton, ModalHeader, ModalWrapper } from 'app/components/library';
import { registerUIComponent } from 'app/root';
import { helpIcon } from 'assets/images/icons/menu';
import { Books } from './Books';
import { Page } from './Page';
import { CopyInfo } from './copy';
import { HelpTabs } from './types';

export function registerHelpModal() {
  registerUIComponent(
    'HelpModal',
    {
      colStart: 67,
      colEnd: 100,
      rowStart: 8,
      rowEnd: 75,
    },
    (layers) => of(layers),
    () => {
      const [tab, setTab] = useState<HelpTabs>(HelpTabs.HOME);

      const BackButton = () => (
        <ButtonRow
          style={{
            display: `${tab == HelpTabs.HOME ? 'none' : 'inline-flex'}`,
          }}
        >
          <ActionButton onClick={() => setTab(HelpTabs.HOME)} text='<' />
        </ButtonRow>
      );

      return (
        <ModalWrapper
          id='help'
          header={<ModalHeader title='Help' icon={helpIcon} />}
          canExit
          truncate
        >
          <Row>
            <ActionButton
              text='Join the Discord'
              onClick={() => window.open('https://discord.gg/eyUAtzZsE8')}
            />
          </Row>
          <BackButton />
          <Banner src={CopyInfo[tab].header} alt={CopyInfo[tab].title} />
          {tab === HelpTabs.HOME ? <Books setTab={setTab} /> : <Page body={CopyInfo[tab].body} />}
        </ModalWrapper>
      );
    }
  );
}

const Row = styled.div`
  width: 100%;
  display: flex;
  flex-flow: row nowrap;
  justify-content: flex-end;
  align-self: center;
`;

const ButtonRow = styled.div`
  position: absolute;

  display: inline-flex;
  flex-flow: row nowrap;
  justify-content: flex-start;
  align-self: flex-start;
`;

const Banner = styled.img`
  height: auto;
  width: 100%;
  padding: 2vw;
  padding-bottom: 1vw;
  align-self: center;
`;
