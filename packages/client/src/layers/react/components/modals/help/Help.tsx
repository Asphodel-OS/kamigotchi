import { useState } from 'react';
import { of } from 'rxjs';
import styled from 'styled-components';

import { HelpMenuIcons } from 'assets/images/icons/help';
import { helpIcon } from 'assets/images/icons/menu';
import { ActionButton } from 'layers/react/components/library/ActionButton';
import { IconButton } from 'layers/react/components/library/IconButton';
import { ModalHeader } from 'layers/react/components/library/ModalHeader';
import { ModalWrapper } from 'layers/react/components/library/ModalWrapper';
import { Tooltip } from 'layers/react/components/library/Tooltip';
import { registerUIComponent } from 'layers/react/engine/store';
import 'layers/react/styles/font.css';
import { SectionContent } from './SectionContent';
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

      const Menu = () => (
        <MenuBody>
          <MenuText>
            Here are valuable resources that can help you navigate Kamigotchi World.
          </MenuText>
          <Tooltip text={['Getting Started']}>
            <Label>Book 1</Label>
            <IconButton
              img={HelpMenuIcons.starting}
              onClick={() => setTab(HelpTabs.START)}
              size='book'
            />
          </Tooltip>
          <Tooltip text={["What's a Kamigotchi?"]}>
            <Label>Book 2</Label>
            <IconButton
              img={HelpMenuIcons.kamis}
              onClick={() => setTab(HelpTabs.KAMIS)}
              size='book'
            />
          </Tooltip>
          <Tooltip text={["What's a Node?"]}>
            <Label>Book 3</Label>
            <IconButton
              img={HelpMenuIcons.nodes}
              onClick={() => setTab(HelpTabs.NODES)}
              size='book'
            />
          </Tooltip>
        </MenuBody>
      );

      return (
        <ModalWrapper
          divName='help'
          id='help_modal'
          header={<ModalHeader title='Help' icon={helpIcon} />}
          canExit
        >
          <BackButton />
          <Banner src={CopyInfo[tab].header} alt={CopyInfo[tab].title} />
          {tab === HelpTabs.HOME ? <Menu /> : <SectionContent body={CopyInfo[tab].body} />}
        </ModalWrapper>
      );
    }
  );
}

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

const Label = styled.div`
  padding: 0.4vw;
  align-self: center;

  color: black;
  font-family: Pixel;
  font-size: 1vw;
  line-height: 0.8vw;
  text-align: center;
  text-shadow: 0 0 0.4vw rgba(0, 0, 0, 0.5);
`;

const MenuBody = styled.div`
  display: flex;
  flex-flow: row wrap;
  justify-content: center;
  align-items: center;
  padding: 1.5vw;
`;

const MenuText = styled.div`
  padding-bottom: 3vw;
  align-self: center;

  color: black;
  font-family: Pixel;
  font-size: 1vw;
  line-height: 1.6vw;
  text-align: center;
  word-spacing: 1vw;
`;
