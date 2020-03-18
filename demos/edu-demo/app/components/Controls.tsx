import classNames from 'classnames/bind';
import React, { useContext } from 'react';
import { useHistory } from 'react-router-dom';

import getChimeContext from '../context/getChimeContext';
import styles from './Controls.css';

const cx = classNames.bind(styles);

export default function Controls() {
  const chime = useContext(getChimeContext());
  const history = useHistory();
  return (
    <div className={cx('controls')}>
      <button
        type="button"
        onClick={() => {
          chime.leaveRoom(true);
          history.push('/');
        }}
      >
        End
      </button>
    </div>
  );
}
