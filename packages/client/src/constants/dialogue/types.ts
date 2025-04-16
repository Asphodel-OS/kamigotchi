export interface DialogueNode {
  index: number;
  text: Array<string | ((...args: any[]) => string)>;
  npc?: { name: string; background: string };
  action?: ActionParam | Array<ActionParam>; // apply to last step or specific steps
  next?: Map<string, number>; // points to more dialogue nodes
  args?: GetterParam[];
}

// designed to getBalance
export interface GetterParam {
  type: string;
  index: number;
}

export interface ActionParam {
  label: string;
  type: string;
  input?: number;
}
