import React, { useState } from 'react';
import { of } from 'rxjs';
import styled from 'styled-components';

import { HelpTabs } from './types';
import { CopyContent } from './copy';
import { HelpBanners } from 'assets/images/banners';
import { triggerIcons } from 'assets/images/icons/triggers';
import { helpIcon } from 'assets/images/icons/menu';
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
      let helpContent = null;
      const [tab, setTab] = useState<HelpTabs>(HelpTabs.HOME);
      function handleLinkClick(tab: HelpTabs) {
        setTab(tab);
      }

      const Header = (
        <div style={{ display: `${tab == HelpTabs.HOME ? 'none' : 'flex'}` }}>
          <Button onClick={() => handleLinkClick(HelpTabs.HOME)}>
            <img style={{ height: '100%', width: 'auto' }} src={triggerIcons.home} alt='home_icon' />
          </Button>
        </div>
      )

      switch (tab) {
        case HelpTabs.HOME:
          helpContent = (
            <div>
              <Image src={HelpBanners.welcome} alt='welcome to kamigotchi' />
              <div style={{ display: 'flex', flexDirection: 'column', marginTop: '5px' }}>
                <Link onClick={() => handleLinkClick(HelpTabs.START)}>
                  Getting Started
                </Link>
                <Link onClick={() => handleLinkClick(HelpTabs.KAMIS)}>
                  Kamigotchi
                </Link>
                <Link onClick={() => handleLinkClick(HelpTabs.NODES)}>
                  Nodes
                </Link>
                <Link onClick={() => handleLinkClick(HelpTabs.WORLD)}>
                  The World
                </Link>
              </div>
            </div>
          );
          break;
        case HelpTabs.START:
          helpContent = (
            <div>
              <Image src={CopyContent[tab].header} alt='getting started' />
              <Description>
                {CopyContent[tab].body.map((line: string) => { return <>{line}<br /></> })}
              </Description>
            </div>
          );
          break;
        case HelpTabs.KAMIS:
          helpContent = (
            <div>
              <Image src={CopyContent[tab].header} alt='what kami' />
              <Description>
                {CopyContent[tab].body.map((line: string) => { return <>{line}<br /></> })}
              </Description>
            </div>
          );
          break;
        case HelpTabs.NODES:
          helpContent = (
            <div>
              <Image src={CopyContent[tab].header} alt='nodes' />
              <Description>
                {CopyContent[tab].body.map((line: string) => { return <>{line}<br /></> })}
              </Description>
            </div>
          );
          break;
        case HelpTabs.WORLD:
          helpContent = (
            <div>
              <Image src={CopyContent[tab].header} alt='world' />
              <Description>
                {CopyContent[tab].body.map((line: string) => { return <>{line}<br /></> })}
              </Description>
            </div>
          );
          break;
      }

      return (
        <ModalWrapperFull
          divName='help'
          id='help_modal'
          header={<ModalHeader title='Help' icon={helpIcon} />}
          canExit
        >
          {Header}
          {helpContent}
        </ModalWrapperFull>
      );
    }
  );
}

const Button = styled.button`
  background-color: #ffffff;
  border-style: solid;
  border-width: 2px;
  border-color: black;
  color: black;
  font-size: 14px;
  cursor: pointer;
  pointer-events: auto;
  border-radius: 5px;
  font-family: Pixel;
  &:active {
    background-color: #c4c4c4;
  }
  margin-bottom: 5px;
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

const Image = styled.img`
  height: auto;
  width: 100%;
`;

const Description = styled.div`
  font-size: 16px;
  color: #333;
  text-align: left;
  line-height: 110%;
  font-family: Pixel;
  padding: 1.5vw;
`;

