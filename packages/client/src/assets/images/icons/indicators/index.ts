import canceled from './canceled.png';
import executing from './executing.png';
import failure from './failure.png';
import pending from './pending.png';
import requested from './requested.png';
import success from './success.png';

export const TxStatusIcons = {
  requested, // requested by user
  executing, // pending execution
  pending, // pending confirmation
  success, // successfully completed
  failure, // failed
  canceled, // canceled by user
};
