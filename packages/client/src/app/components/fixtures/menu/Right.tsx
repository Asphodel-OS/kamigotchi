import { IconListButton } from 'app/components/library';
import { UIComponent } from 'app/root/types';
import { Modals, useAccount, useSelected, useVisibility } from 'app/stores';
import { CraftIcon, HarvestIcon } from 'assets/images/icons/actions';
import {
  ChatIcon,
  InventoryIcon,
  Items,
  KamiIcon,
  MapIcon,
  OperatorIcon,
  QuestsIcon,
  Social2,
  TradeIcon,
  World,
} from 'assets/images/icons/menu';
import { ItemImages } from 'assets/images/items';
import { TokenIcons } from 'assets/images/tokens';
import styled from 'styled-components';
import { MoreMenuButton, SudoMenuButton } from './buttons';

export const RightMenuFixture: UIComponent = {
  id: 'RightMenuFixture',
  Render: () => {
    const menuVisible = useVisibility((s) => s.fixtures.menu);
    const setModals = useVisibility((s) => s.setModals);
    const setNode = useSelected((s) => s.setNode);
    const setAccount = useSelected((s) => s.setAccount);
    const accountIndex = useAccount((s) => s.account.index);

    const manageMobile = (targetModal: keyof Modals, hideModals: Partial<Modals>) => {
      const isMobile = window.matchMedia('(max-aspect-ratio: 11/16)').matches;
      const { modals } = useVisibility.getState();
      const isModalOpen = modals[targetModal];
      let nextModals: Partial<Modals> = { [targetModal]: !isModalOpen };
      if (!isModalOpen) {
        if (isMobile) {
          // Close everything except
          // the target modal
          const { modals } = useVisibility.getState();
          const allClosed = Object.fromEntries(Object.keys(modals).map((key) => [key, false]));
          nextModals = { ...allClosed, [targetModal]: true };
        } else {
          nextModals = { ...nextModals, ...hideModals };
        }
      }
      setModals(nextModals);
    };
    // TODO: move all this inside new Menu buttons
    const toggleAccount = (targetModal: keyof Modals) => {
      setAccount(accountIndex);
      const modalsToHide: Partial<Modals> = {
        bridgeERC20: false,
        bridgeERC721: false,
        dialogue: false,
        emaBoard: false,
        kami: false,
        leaderboard: false,
        map: false,
        merchant: false,
        party: false,
        trading: false,
      };
      manageMobile(targetModal, modalsToHide);
    };

    const toggleParty = (targetModal: keyof Modals) => {
      const modalsToHide: Partial<Modals> = {
        account: false,
        bridgeERC20: false,
        dialogue: false,
        kami: false,
        leaderboard: false,
        map: false,
        merchant: false,
        trading: false,
      };
      manageMobile(targetModal, modalsToHide);
    };
    const toggleQuests = (targetModal: keyof Modals) => {
      const modalsToHide: Partial<Modals> = {
        chat: false,
        help: false,
        inventory: false,
        settings: false,
        questDialogue: false,
        dialogue: false,
        kami: false,
      };
      manageMobile(targetModal, modalsToHide);
    };

    const toggleMap = (targetModal: keyof Modals) => {
      const modalsToHide: Partial<Modals> = {
        account: false,
        bridgeERC20: false,
        bridgeERC721: false,
        dialogue: false,
        emaBoard: false,
        goal: false,
        kami: false,
        leaderboard: false,
        merchant: false,
        party: false,
        trading: false,
      };
      manageMobile(targetModal, modalsToHide);
    };

    const toggleHarvest = (targetModal: keyof Modals) => {
      const { roomIndex } = useSelected.getState();
      setNode(roomIndex);
      const modalsToHide: Partial<Modals> = {
        goal: false,
        crafting: false,
        bridgeERC20: false,
        bridgeERC721: false,
        dialogue: false,
        kami: false,
        gacha: false,
        emaBoard: false,
        presale: false,
        tokenPortal: false,
        trading: false,
      };
      manageMobile(targetModal, modalsToHide);
    };

    const toggleChat = (targetModal: keyof Modals) => {
      const modalsToHide: Partial<Modals> = {
        help: false,
        inventory: false,
        quests: false,
        settings: false,
        questDialogue: false,
        dialogue: false,
        kami: false,
      };
      manageMobile(targetModal, modalsToHide);
    };

    const toggleInventory = (targetModal: keyof Modals) => {
      const modalsToHide: Partial<Modals> = {
        chat: false,
        help: false,
        quests: false,
        settings: false,
        questDialogue: false,
        dialogue: false,
        kami: false,
      };
      manageMobile(targetModal, modalsToHide);
    };

    const toggleCrafting = (targetModal: keyof Modals) => {
      const modalsToHide: Partial<Modals> = {
        bridgeERC20: false,
        bridgeERC721: false,
        dialogue: false,
        emaBoard: false,
        kami: false,
        leaderboard: false,
        node: false,
        tokenPortal: false,
        presale: false,
        trading: false,
      };
      manageMobile(targetModal, modalsToHide);
    };

    const toggleTokenPortal = (targetModal: keyof Modals) => {
      const modalsToHide: Partial<Modals> = {
        crafting: false,
        node: false,
        kami: false,
      };
      manageMobile(targetModal, modalsToHide);
    };

    const toggleOrderbook = (targetModal: keyof Modals) => {
      const modalsToHide: Partial<Modals> = {
        account: false,
        bridgeERC20: false,
        dialogue: false,
        kami: false,
        leaderboard: false,
        map: false,
        merchant: false,
        party: false,
        goal: false,
        crafting: false,
        bridgeERC721: false,
        gacha: false,
        emaBoard: false,
        presale: false,
        tokenPortal: false,
        node: false,
      };
      manageMobile(targetModal, modalsToHide);
    };

    const toggleObol = (targetModal: keyof Modals) => {
      const modalsToHide: Partial<Modals> = {
        goal: false,
        crafting: false,
        bridgeERC20: false,
        bridgeERC721: false,
        dialogue: false,
        kami: false,
        gacha: false,
        emaBoard: false,
        presale: false,
        tokenPortal: false,
        trading: false,
        node: false,
      };
      manageMobile(targetModal, modalsToHide);
    };

    return (
      <Wrapper>
        {menuVisible && (
          <>
            <IconListButton
              img={Social2}
              options={[
                { text: 'Account', image: OperatorIcon, onClick: () => toggleAccount('account') },
                { text: 'Party', image: KamiIcon, onClick: () => toggleParty('party') },
                { text: 'Quests', image: QuestsIcon, onClick: () => toggleQuests('quests') },
              ]}
              tooltip={{ text: ['Social'] }}
              menuButton={true}
            />
            <IconListButton
              img={World}
              options={[
                { text: 'Map', image: MapIcon, onClick: () => toggleMap('map') },
                { text: 'Node', image: HarvestIcon, onClick: () => toggleHarvest('node') },
                { text: 'Chat', image: ChatIcon, onClick: () => toggleChat('chat') },
              ]}
              tooltip={{ text: ['World'] }}
              menuButton={true}
            />
            <IconListButton
              img={Items}
              options={[
                {
                  text: 'Inventory',
                  image: InventoryIcon,
                  onClick: () => toggleInventory('inventory'),
                },
                { text: 'Craft', image: CraftIcon, onClick: () => toggleCrafting('crafting') },
                {
                  text: 'Trade',
                  image: TradeIcon,
                  onClick: () => toggleOrderbook('trading'),
                },
                {
                  text: 'Pop-up Shop',
                  image: ItemImages.obol,
                  onClick: () => toggleObol('lootBox'),
                },
                {
                  text: 'Token Portal',
                  image: TokenIcons.onyx,
                  onClick: () => toggleTokenPortal('tokenPortal'),
                },
              ]}
              tooltip={{ text: ['Items'] }}
              menuButton={true}
            />
          </>
        )}
        <SudoMenuButton />
        <MoreMenuButton />
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
