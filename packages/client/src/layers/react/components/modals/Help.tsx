import React, { useState, useRef } from 'react';
import { of } from 'rxjs';
import styled from 'styled-components';

import { ModalWrapperFull } from 'layers/react/components/library/ModalWrapper';
import { registerUIComponent } from 'layers/react/engine/store';
import 'layers/react/styles/font.css';

import homeImage from 'src/assets/images/icons/home_native.png';
import gettingStarted from 'src/assets/images/banners/gettingStarted.png';
import welcome from 'src/assets/images/banners/welcome.png';
import whatKami from 'src/assets/images/banners/whatKami.png';
import whatNode from 'src/assets/images/banners/whatNode.png';
import world from 'src/assets/images/banners/world.png';


export enum HelpComponentState {
  HOME,
  KAMI_INFO,
  NODES,
  START,
  TIPS,
  WORLD
}

export function registerHelpModal() {
  registerUIComponent(
    'Help',
    {
      colStart: 67,
      colEnd: 100,
      rowStart: 10,
      rowEnd: 100,
    },

    (layers) => of(layers),

    () => {
      let helpContent = null;
      const [helpState, setHelpState] = useState<HelpComponentState>(HelpComponentState.HOME);
      function handleLinkClick(state: HelpComponentState) {
        setHelpState(state);
      }

      const scrollableRef = useRef<HTMLDivElement>(null);

      const Header = (
        <div style={{ display: `${helpState == HelpComponentState.HOME ? 'none' : 'flex'}` }}>
          <Button onClick={() => handleLinkClick(HelpComponentState.HOME)}>
            <img style={{ height: '100%', width: 'auto' }} src={homeImage} alt='home_icon' />
          </Button>
        </div>
      )

      switch (helpState) {
        case HelpComponentState.HOME:
          helpContent = (
            <div>
              <img style={{ height: 'auto', width: '100%' }} src={welcome} alt='welcome to kamigotchi' />
              <div style={{ display: 'flex', flexDirection: 'column', marginTop: '5px' }}>
                <Link onClick={() => handleLinkClick(HelpComponentState.START)}>
                  Getting Started
                </Link>
                <Link onClick={() => handleLinkClick(HelpComponentState.KAMI_INFO)}>
                  Kamigotchi
                </Link>
                <Link onClick={() => handleLinkClick(HelpComponentState.NODES)}>
                  Nodes
                </Link>
                <Link onClick={() => handleLinkClick(HelpComponentState.WORLD)}>
                  The World
                </Link>
              </div>
            </div>
          );
          break;
        case HelpComponentState.START:
          helpContent = (
            <div>
              <img style={{ height: 'auto', width: '100%' }} src={gettingStarted} alt='getting started' />
              <Description>
                Welcome to Kamigotchi World.
                <br />
                You can move using the map.
                <br />
                <br />
                Look for a vending machine and for Nodes scattered throughout the world.
                <br />
                <br />
                You may want to find Kamigotchi if you want to influence this world, but you're welcome to explore either way.
                <br />
                <br />
                It's possible to rename your Kamigotchi somewhere in-game.
              </Description>
            </div>
          );
          break;
        case HelpComponentState.KAMI_INFO:
          helpContent = (
            <div>
              <img style={{ height: 'auto', width: '100%' }} src={whatKami} alt='what kami' />
              <Description>
                Kamigotchi are vibrant individuals who exist to provide you with
                emotional support and value. You can convert their health and
                well-being into $MUSU by sending them to work at Nodes.
                <br />
                <br />
                Kamigotchi have several different statistics that determine
                their abilities. Base statistics are determined by a Kami's Traits.
                Traits are separated into rarity tiers. Some are extremely uncommon.
                Rarer traits usually give more stat points.
                <br />
                <br />
                Kamigotchi also have Types, determined by their Arm and Body traits. Kamigotchi
                can be Normal, Eerie, Scrap, or Insect types, and the Arm and Body can have different
                Types - leading to a dual-type Kami, for example Normal/Insect.
                <br />
                <br />
                Health determines a Kami's well being. The lower a Kami's health,
                the easier it is for them to be Liquidated for other Kamigotchi,
                will kills them. Dead Kamigotchi are not destroyed, but must be
                resurrected using a Ribbon.
                <br />
                Health drains slowly when harvesting on a node. As Health drains, Kamigotchi
                produce $MUSU based on their Power stat. More Power increases both Health drain rate
                and the level of $MUSU generated.
                <br />
                <br />
                Your Kamigotchi are fiercely
                independent and will gradually regenerate health if left to
                their own devices, but can be fed to speed this process.
                <br />
                <br />
                Violence and Harmony determine a Kami's capacity for attack and
                defense. The Health threshold for liquidating a Kami on a Node is determined
                by the difference between the attacker's Violence and the defender's Harmony.
                <br />
                <br />
                Slots don't do anything yet, but will soon. Very few traits give
                them.
              </Description>
            </div>
          );
          break;
        case HelpComponentState.NODES:
          helpContent = (
            <div>
              <img style={{ height: 'auto', width: '100%' }} src={whatNode} alt='nodes' />
              <Description>
                Nodes are sites of spiritual significance within Kamigotchi
                World. Kamigotchi, and only Kamigotchi, can generate $MUSU
                by gathering energy at Nodes. This costs Kamigotchi health,
                and can leave them vulnerable to attack from other Kamigotchi.
                <br />
                <br />
                Some nodes have a type affinity, such as Eerie or Scrap. You may
                be able to find more $MUSU by harvesting on these nodes with
                Kami that share the same affinity.
              </Description>
            </div>
          );
          break;
        case HelpComponentState.WORLD:
          helpContent = (
            <div>
              <img style={{ height: 'auto', width: '100%' }} src={world} alt='world' />
              <Description>
                Kamigotchi World is an Autonomous World that exists entirely on-chain.
                <br />
                <br />
                All actions taken within this world are blockchain transactions. Your Operator -
                that is, the entity you named on entry - is a representation of you within this world.
                <br />
                <br />

                The chat feature relies on a centralized backend at this time.
              </Description>
            </div>
          );
          break;
      }

      return (
        <ModalWrapperFull divName='help' id='help_modal'>
          {Header}
          <Scrollable ref={scrollableRef}>
            {helpContent}
          </Scrollable>
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

const Description = styled.p`
  font-size: 16px;
  color: #333;
  text-align: left;
  line-height: 110%;
  font-family: Pixel;
  margin: 5px;
`;

const Scrollable = styled.div`
  overflow-y: scroll;
  height: 100%;
  max-height: 100%;
`;
