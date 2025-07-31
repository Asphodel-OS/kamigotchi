import styled from 'styled-components';

import { isDead } from 'app/cache/kami';
import { OnyxButton } from 'app/components/library/buttons/actions/OnyxButton';
import { FeedIcon, ReviveIcon } from 'assets/images/icons/actions';
import { Account } from 'network/shapes/Account';
import { Bonus } from 'network/shapes/Bonus';
import { Kami } from 'network/shapes/Kami';
import { Node } from 'network/shapes/Node';
import { KamiBar } from './KamiBar';

const ONYX_REVIVE_PRICE = 3;

interface Props {
  actions: {
    onyxApprove: (price: number) => void;
    onyxRevive: (kami: Kami) => void;
  };
  data: {
    account: Account;
    kamis: Kami[];
    node: Node;
    onyx: {
      allowance: number;
      balance: number;
    };
  };
  display: {
    HarvestButton: (account: Account, kami: Kami, node: Node) => JSX.Element;
    UseItemButton: (kami: Kami, account: Account, icon: string) => JSX.Element;
  };
  state: {
    displayedKamis: Kami[];
    tick: number;
  };
  isVisible: boolean;
  utils: {
    getTempBonuses: (kami: Kami) => Bonus[];
  };
}

export const KamisExternal = (props: Props) => {
  const { actions, data, display, state, isVisible, utils } = props;
  const { onyxApprove, onyxRevive } = actions;
  const { account, node, onyx } = data;
  const { displayedKamis, tick } = state;
  const { HarvestButton, UseItemButton } = display;

  /////////////////
  // INTERPRETATION

  const getOnyxTooltip = (kami: Kami) => {
    let tooltip: string[] = [`the Fortunate may resurrect`, 'their kami in other ways..', `\n`];

    if (onyx.balance < ONYX_REVIVE_PRICE) {
      tooltip = tooltip.concat([
        `you only have ${onyx.balance} $ONYX`,
        `you need ${ONYX_REVIVE_PRICE} $ONYX`,
      ]);
    } else if (onyx.allowance < ONYX_REVIVE_PRICE) {
      tooltip = tooltip.concat([`approve spend of ${ONYX_REVIVE_PRICE} $ONYX`]);
    } else {
      tooltip = tooltip.concat([`save ${kami.name} with ${ONYX_REVIVE_PRICE} onyx`]);
    }
    return tooltip;
  };

  /////////////////
  // DISPLAY

  // Choose and return the action button to display
  const DisplayedActions = (account: Account, kami: Kami, node: Node) => {
    let buttons = [];
    let useIcon = isDead(kami) ? ReviveIcon : FeedIcon;

    buttons.push(UseItemButton(kami, account, useIcon));
    if (!isDead(kami)) buttons.push(HarvestButton(account, kami, node));
    else {
      buttons.push(
        <OnyxButton
          key='onyx-revive'
          kami={kami}
          onyx={{ ...onyx, price: ONYX_REVIVE_PRICE }}
          actions={{ onyxApprove, onyxUse: onyxRevive }}
          tooltip={getOnyxTooltip(kami)}
        />
      );
    }
    return buttons;
  };

  return (
    <Container isVisible={isVisible}>
      {displayedKamis.map((kami) => (
        <KamiBar
          key={kami.entity}
          kami={kami}
          actions={DisplayedActions(account, kami, node)}
          utils={utils}
          tick={tick}
        />
      ))}
    </Container>
  );
};

const Container = styled.div<{ isVisible: boolean }>`
  display: ${({ isVisible }) => (isVisible ? 'flex' : 'none')};
  flex-flow: column nowrap;
  gap: 0.45vw;
  padding: 0.6vw;
`;
