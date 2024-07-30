import { reviveIcon } from 'assets/images/icons/actions';
import { Account } from 'network/shapes/Account';
import { Inventory } from 'network/shapes/Item';
import { Kami, onCooldown } from 'network/shapes/Kami';
import { IconButton } from '../IconButton';
import { Tooltip } from '../Tooltip';

// button for reviving kami
// TOOD: clean this up
export const ReviveButton = (kami: Kami, account: Account, triggerAction: Function) => {
  let tooltipText = 'Revive your Kami';
  if (!hasRevive(account)) tooltipText = 'no revives in inventory';
  else if (onCooldown(kami)) tooltipText = 'on cooldown';

  const stockedInventories =
    account.inventories?.filter((inv: Inventory) => inv.item.type === 'REVIVE') ?? [];
  const reviveIndex = stockedInventories.length > 0 ? stockedInventories[0].item.index : 110;

  return (
    <Tooltip text={[tooltipText]}>
      <IconButton
        img={reviveIcon}
        onClick={() => triggerAction(kami, reviveIndex)}
        disabled={!hasRevive(account) || onCooldown(kami)}
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
