import React from 'react';
import { hot } from 'react-hot-loader/root';
import { HashRouter } from 'react-router-dom';

import Routes from '../Routes';
import ChimeProvider from './ChimeProvider';

const Root = () => (
  <ChimeProvider>
    <HashRouter>
      <Routes />
    </HashRouter>
  </ChimeProvider>
);

export default hot(Root);
