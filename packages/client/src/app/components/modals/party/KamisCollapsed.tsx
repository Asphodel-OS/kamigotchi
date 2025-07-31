import styled from 'styled-components';

import { isDead } from 'app/cache/kami';
import { KamiBar } from 'app/components/library/bars';
import { OnyxButton } from 'app/components/library/buttons';
import { FeedIcon, ReviveIcon } from 'assets/images/icons/actions';
import { Account } from 'network/shapes/Account';
import { Bonus } from 'network/shapes/Bonus';
import { Kami } from 'network/shapes/Kami';
import { Node } from 'network/shapes/Node';

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

export const KamisCollapsed = (props: Props) => {
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
  // Q: what's the right way to prevent recomputes here?
  const DisplayedActions = (account: Account, kami: Kami, node: Node) => {
    if (!isVisible) return <></>;
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
          options={{ showCooldown: true }}
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
