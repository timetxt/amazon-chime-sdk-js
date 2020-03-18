import classNames from 'classnames/bind';
import React from 'react';
import { Redirect } from 'react-router-dom';

import styles from './Home.css';

const cx = classNames.bind(styles);

export default function Home() {
  return (
    <div className={cx('home')}>
      <Redirect to="/login" />
    </div>
  );
}
