// the various validation steps of the WalletConnector
export type Step = 'CONNECTION' | 'NETWORK' | 'AUTHENTICATION';

// the state of the validation steps
export type Status = 'WRONG' | 'FIXING' | 'FIXED';
