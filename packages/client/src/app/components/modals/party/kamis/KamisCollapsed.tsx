import styled from 'styled-components';

import { isDead } from 'app/cache/kami';
import { KamiBar } from 'app/components/library/bars';
import { FeedIcon, ReviveIcon } from 'assets/images/icons/actions';
import { Account } from 'network/shapes/Account';
import { Bonus } from 'network/shapes/Bonus';
import { Kami } from 'network/shapes/Kami';
import { Node } from 'network/shapes/Node';

export const KamisCollapsed = ({
  data: { account, node },
  display: { HarvestButton, UseItemButton, OnyxReviveButton, levelUp },
  state: { displayedKamis, tick },
  isVisible,
  utils,
}: {
  data: {
    account: Account;
    kamis: Kami[];
    node: Node;
  };
  display: {
    HarvestButton: (account: Account, kami: Kami, node: Node) => JSX.Element;
    UseItemButton: (kami: Kami, account: Account, icon: string) => JSX.Element;
    OnyxReviveButton: (account: Account, kami: Kami) => JSX.Element;
    levelUp: (kami: Kami) => void;
  };
  state: {
    displayedKamis: Kami[];
    tick: number;
  };
  isVisible: boolean;
  utils: {
    levelUp: (kami: Kami) => void;
    calcExpRequirement: (lvl: number) => number;
    getTempBonuses: (kami: Kami) => Bonus[];
  };
}) => {
  /////////////////
  // DISPLAY

  // Choose and return the action button to display
  // Q: what's the right way to prevent recomputes here?
  const DisplayedActions = (account: Account, kami: Kami, node: Node) => {
    if (!isVisible) return <></>;

    let buttons = [];
    if (!isDead(kami)) {
      buttons.push(UseItemButton(kami, account, FeedIcon));
      buttons.push(HarvestButton(account, kami, node));
    } else {
      buttons.push(OnyxReviveButton(account, kami));
      buttons.push(UseItemButton(kami, account, ReviveIcon));
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
          options={{
            showCooldown: true,
            showLevelUp: true,
            showPercent: true,
            showTooltip: true,
            showSkillPoints: true,
          }}
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
