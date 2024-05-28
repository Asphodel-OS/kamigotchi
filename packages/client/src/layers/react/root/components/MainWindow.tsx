import { observer } from 'mobx-react-lite';
import React from 'react';
import { ComponentRenderer } from './Renderer';

export const MainWindow: React.FC = observer(() => {
  return <ComponentRenderer />;
});
