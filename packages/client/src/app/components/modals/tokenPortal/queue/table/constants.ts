// table header columns
export type Column = 'Account' | 'Item' | 'Amount' | 'Status' | 'Actions';

export const COLUMNS = ['Account', 'Item', 'Amount', 'Status', 'Actions'] as Column[];

// sortable table header columns
export type Sortable = 'Account' | 'Amount' | 'Status';
export type Sort = {
  key: Sortable;
  reverse: boolean;
};

export const SORTABLE = ['Account', 'Amount', 'Status'] as Sortable[];
