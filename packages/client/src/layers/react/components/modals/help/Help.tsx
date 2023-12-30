import React, { useState } from 'react';
import { of } from 'rxjs';
import styled from 'styled-components';

import { HelpTabs } from './types';
import { CopyInfo } from './copy';
import { SectionContent } from './SectionContent';
import { helpIcon } from 'assets/images/icons/menu';
import { HelpMenuIcons } from 'assets/images/icons/help';
import { ActionButton } from 'layers/react/components/library/ActionButton';
import { IconButton } from 'layers/react/components/library/IconButton';
import { ModalHeader } from 'layers/react/components/library/ModalHeader';
import { ModalWrapper } from 'layers/react/components/library/ModalWrapper';
import { Tooltip } from 'layers/react/components/library/Tooltip';
import { registerUIComponent } from 'layers/react/engine/store';
import 'layers/react/styles/font.css';


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
        <ButtonRow style={{ display: `${tab == HelpTabs.HOME ? 'none' : 'inline-flex'}` }}>
          <ActionButton
            id='help_back_button'
            onClick={() => setTab(HelpTabs.HOME)}
            text='<'
          />
        </ButtonRow>
      );

      const Menu = () => (
        <Body>
          <Tooltip text={['Getting Started']} >
            <IconButton
              id='starting'
              img={HelpMenuIcons.starting}
              onClick={() => setTab(HelpTabs.START)}
              size='xl'
            />
          </Tooltip>
          <Tooltip text={["What's a Kamigotchi?"]} >
            <IconButton
              id='kamigotchi'
              img={HelpMenuIcons.kamis}
              onClick={() => setTab(HelpTabs.KAMIS)}
              size='xl'
            />
          </Tooltip>
          <Tooltip text={["What's a Node?"]} >
            <IconButton
              id='nodes'
              img={HelpMenuIcons.nodes}
              onClick={() => setTab(HelpTabs.NODES)}
              size='xl'
            />
          </Tooltip>
          <Tooltip text={["Kamigotchi World"]} >
            <IconButton
              id='world'
              img={HelpMenuIcons.starting}
              onClick={() => setTab(HelpTabs.WORLD)}
              size='xl'
            />
          </Tooltip>
        </Body>
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
          {(tab === HelpTabs.HOME)
            ? <Menu />
            : <SectionContent body={CopyInfo[tab].body} />
          }
        </ModalWrapper>
      );
    }
  );
}

const Banner = styled.img`
  height: auto;
  width: 100%;
`;

const Body = styled.div`
  display: flex;
  flex-flow: row wrap;
  justify-content: center;
  align-items: center;
  padding: 1.5vw;
`;

const ButtonRow = styled.div`
  position: absolute;
  
  display: inline-flex;
  flex-flow: row nowrap;
  justify-content: flex-start;
  align-self: flex-start;
`;
