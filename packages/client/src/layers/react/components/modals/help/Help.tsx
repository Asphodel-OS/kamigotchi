import React, { useState } from 'react';
import { of } from 'rxjs';
import styled from 'styled-components';

import { HelpTabs } from './types';
import { CopyInfo } from './copy';
import { SectionContent } from './SectionContent';
import { helpIcon } from 'assets/images/icons/menu';
import { ActionButton } from 'layers/react/components/library/ActionButton';
import { ModalHeader } from 'layers/react/components/library/ModalHeader';
import { ModalWrapperFull } from 'layers/react/components/library/ModalWrapper';
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
        <div>
          <div style={{ display: 'flex', flexDirection: 'column', marginTop: '5px' }}>
            <Link onClick={() => setTab(HelpTabs.START)}>
              Getting Started
            </Link>
            <Link onClick={() => setTab(HelpTabs.KAMIS)}>
              Kamigotchi
            </Link>
            <Link onClick={() => setTab(HelpTabs.NODES)}>
              Nodes
            </Link>
            <Link onClick={() => setTab(HelpTabs.WORLD)}>
              The World
            </Link>
          </div>
        </div>
      );

      return (
        <ModalWrapperFull
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
        </ModalWrapperFull>
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

// Styled link component
const Link = styled.a`
  color: #222;
  text-decoration: underline;
  cursor: pointer;
  font-family: Pixel;
  margin: 5px;
  font-size: 18px;
`;

const Banner = styled.img`
  height: auto;
  width: 100%;
`;