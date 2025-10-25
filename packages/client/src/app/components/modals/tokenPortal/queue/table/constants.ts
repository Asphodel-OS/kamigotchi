export type Filter = 'MINE' | 'ALL';

// table header columns
export const COLUMN_WIDTHS = {
  Account: 0,
  Token: 0,
  Amount: 0,
  Status: 0,
  Actions: 0,
};
export type Column = keyof typeof COLUMN_WIDTHS;
export type ColumnWidths = {
  [key in Column]: number;
};

// sortable table header columns
export type Sortable = 'Account' | 'Amount' | 'Status';
export type Sort = {
  key: Sortable;
  reverse: boolean;
};

export const SORTABLE = ['Account', 'Amount', 'Status'] as Sortable[];
