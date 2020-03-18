import classNames from 'classnames/bind';
import React from 'react';

import styles from './StudentVideo.css';

const cx = classNames.bind(styles);

type Props = {
  enabled: boolean;
  videoElementRef: Function;
};

export default function StudentVideo(props: Props) {
  const { enabled, videoElementRef } = props;
  return (
    <div
      className={cx('studentVideo', {
        studentVideoEnabled: enabled
      })}
    >
      <video muted ref={videoElementRef} className={styles.video} />
    </div>
  );
}
