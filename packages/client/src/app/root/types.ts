import React from 'react';
import { Observable } from 'rxjs';

import { Layers } from 'network/';

export type UIComponentWithGrid = {
  uiComponent: UIComponent;
  gridConfig: {
    colStart: number;
    colEnd: number;
    rowStart: number;
    rowEnd: number;
  };
};

export type UIComponent = {
  id: string;
  requirement: (layers: Layers) => Observable<any>;
  Render: React.FC<any>;
};
