
export enum HelpTabs {
  HOME,
  KAMIS,
  NODES,
  START,
  WORLD
}

export interface PageCopy {
  title: string;
  menuIcon?: string;
  header: string;
  body: string[];
}