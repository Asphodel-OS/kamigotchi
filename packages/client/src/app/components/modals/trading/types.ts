export type TabType = 'Orderbook' | 'Management';
export type OrderType = 'Buy' | 'Sell' | 'Barter' | 'Forex' | '???';
export type OrderState = 'OPEN' | 'EXECUTED';
export enum CreateMode {
  BUY = 'Buy',
  SELL = 'Sell',
}
