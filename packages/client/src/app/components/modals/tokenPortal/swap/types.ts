export type Mode = 'DEPOSIT' | 'WITHDRAW';

// where a withdrawal pays out: the owner wallet, or the account's operator (gas) wallet
export type Destination = 'OWNER' | 'OPERATOR';
