import { reviveIcon } from 'assets/images/icons/actions';
import { Account } from 'network/shapes/Account';
import { Inventory, filterInventories } from 'network/shapes/Item';
import { Kami } from 'network/shapes/Kami';
import { IconButton, Tooltip } from '../base';

// button for reviving kami
export const ReviveButton = (kami: Kami, account: Account, triggerAction: Function) => {
  let tooltipText = 'Revive your Kami';
  if (!hasRevive(account)) tooltipText = 'no revives in inventory';

  let inventories = account.inventories ?? [];
  inventories = filterInventories(inventories, 'FOOD', 'KAMI');
  const reviveIndex = 110; /// temporary hardcoded revive index

  return (
    <Tooltip text={[tooltipText]}>
      <IconButton
        img={reviveIcon}
        onClick={() => triggerAction(kami, reviveIndex)}
        disabled={!hasRevive(account)}
        noMargin
      />
    </Tooltip>
  );
};

const hasRevive = (account: Account): boolean => {
  const revives = account.inventories?.filter((inv) => inv?.item.type === 'REVIVE');
  if (!revives || revives.length == 0) return false;
  const total = revives.reduce((tot: number, inv: Inventory) => tot + (inv.balance || 0), 0);
  return total > 0;
};
