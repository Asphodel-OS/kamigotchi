export enum HelpTabs {
  HOME,
  KAMIS,
  NODES,
  WORLD,
}

export interface PageCopy {
  title: string;
  menuIcon?: string;
  header: string;
  body: string[];
}
