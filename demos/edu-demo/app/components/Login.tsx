import classNames from 'classnames/bind';
import React, { useState } from 'react';
import { useHistory } from 'react-router-dom';

import styles from './Login.css';

const cx = classNames.bind(styles);

export default function Login() {
  const [title, setTitle] = useState('');
  const [name, setName] = useState('');
  const history = useHistory();
  const region = 'us-east-1';

  return (
    <div className={cx('login')}>
      <div className={cx('formWrapper')}>
        <h1 className={cx('title')}>Create a classroom</h1>
        <form
          className={cx('form')}
          onSubmit={event => {
            event.preventDefault();
            if (title && name && region) {
              history.push(
                `/teacher-room?title=${encodeURIComponent(
                  title
                )}&name=${encodeURIComponent(name)}&region=${region}`
              );
            }
          }}
        >
          <input
            className={cx('titleInput')}
            onChange={event => {
              setTitle(event.target.value);
            }}
            placeholder="Subject"
          />
          <input
            className={cx('nameInput')}
            onChange={event => {
              setName(event.target.value);
            }}
            placeholder="Your name"
          />
          <button className={cx('button')} type="submit">
            Continue
          </button>
        </form>
      </div>
    </div>
  );
}
