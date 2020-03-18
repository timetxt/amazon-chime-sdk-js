import React from 'react';
import { Route, Switch } from 'react-router-dom';

import App from './components/App';
import Home from './components/Home';
import Login from './components/Login';
import TeacherRoom from './components/TeacherRoom';
import routes from './constants/routes.json';

export default function Routes() {
  return (
    <App>
      <Switch>
        <Route path={routes.TEACHER_ROOM} component={TeacherRoom} />
        <Route path={routes.LOGIN} component={Login} />
        <Route path={routes.HOME} component={Home} />
      </Switch>
    </App>
  );
}
