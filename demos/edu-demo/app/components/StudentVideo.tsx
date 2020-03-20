import classNames from 'classnames/bind';
import React from 'react';

import RosterAttendeeType from '../types/RosterAttendeeType';
import styles from './StudentVideo.css';

const cx = classNames.bind(styles);

export enum Size {
  Small,
  Medium,
  Large
}

type Props = {
  enabled: boolean;
  videoElementRef: Function;
  size: Size;
  rosterAttendee?: RosterAttendeeType;
};

export default function StudentVideo(props: Props) {
  const {
    enabled,
    videoElementRef,
    size = Size.Large,
    rosterAttendee = {}
  } = props;
  const { name, muted } = rosterAttendee;
  return (
    <div
      className={cx('studentVideo', {
        studentVideoEnabled: enabled,
        small: size === Size.Small,
        medium: size === Size.Medium,
        large: size === Size.Large
      })}
    >
      <video muted ref={videoElementRef} className={styles.video} />
      {name && typeof muted === 'boolean' && (
        <div className={cx('nameplate')}>
          {name && <div className={cx('name')}>{name}</div>}
          {typeof muted === 'boolean' && (
            <div className={cx('muted')}>
              {muted ? (
                <i className="fas fa-microphone-slash" />
              ) : (
                <i className="fas fa-microphone" />
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
