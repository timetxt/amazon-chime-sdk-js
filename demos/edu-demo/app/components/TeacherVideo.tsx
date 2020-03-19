import classNames from 'classnames/bind';
import React, { useContext, useEffect, useRef, useState } from 'react';

import { VideoTileState } from '../../amazon-chime-sdk-js';
import getChimeContext from '../context/getChimeContext';
import styles from './TeacherVideo.css';

const cx = classNames.bind(styles);

export default function TeacherVideo() {
  const [enabled, setEnabled] = useState(false);
  const chime = useContext(getChimeContext());
  const videoElement = useRef(null);

  useEffect(() => {
    chime.audioVideo.addObserver({
      videoTileDidUpdate: (tileState: VideoTileState): void => {
        if (!tileState.boundAttendeeId || !tileState.localTile) {
          return;
        }
        chime.audioVideo.bindVideoElement(
          tileState.tileId,
          videoElement.current
        );
        setEnabled(tileState.active);
      }
    });
  }, []);

  return (
    <div
      className={cx('teacherVideo', {
        teacherVideoEnabled: enabled
      })}
    >
      <video muted ref={videoElement} className={cx('video')} />
    </div>
  );
}
