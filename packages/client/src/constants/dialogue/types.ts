export interface DialogueNode {
  index: number;
  text: string[];
  action?: {
    label: string;
    type: string;
    input: number;
  };
  next?: Map<string, number>; // points to more dialogue nodes
};
