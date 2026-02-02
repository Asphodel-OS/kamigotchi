export type Filter = 'MINE' | 'OTHERS';

// table header columns
export const COLUMN_WIDTHS = {
  Account: 0,
  Type: 0,
  Token: 0,
  Amount: 0,
  Status: 0,
  Created: 0,
  Actions: 0,
};
export type Column = keyof typeof COLUMN_WIDTHS;
export type ColumnWidths = Partial<Record<Column, number>>;

// sortable table header columns
export type Sortable = 'Account' | 'Type' | 'Amount' | 'Status' | 'Created';
export type Sort = {
  key: Sortable;
  reverse: boolean;
};

export const SORTABLE = ['Account', 'Type', 'Amount', 'Status', 'Created'] as Sortable[];
