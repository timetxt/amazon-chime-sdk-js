import classNames from 'classnames/bind';
import React, { useContext, useEffect, useRef, useState } from 'react';

import { VideoTileState } from '../../amazon-chime-sdk-js';
import getChimeContext from '../context/getChimeContext';
import styles from './TeacherVideo.css';

const cx = classNames.bind(styles);

enum VideoStatus {
  Disabled,
  Loading,
  Enabled
}

export default function TeacherVideo() {
  const [videoStatus, setVideoStatus] = useState(VideoStatus.Disabled);
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
      }
    });
  }, []);

  return (
    <div className={cx('teacherVideo')}>
      {videoStatus === VideoStatus.Disabled && (
        <button
          type="button"
          onClick={async () => {
            setVideoStatus(VideoStatus.Loading);
            const videoInputs = await chime.audioVideo.listVideoInputDevices();
            await chime.audioVideo.chooseVideoInputDevice(
              videoInputs[0].deviceId
            );
            chime.audioVideo.startLocalVideoTile();
            setVideoStatus(VideoStatus.Enabled);
          }}
        >
          Enable video
        </button>
      )}
      {videoStatus === VideoStatus.Enabled && (
        <button
          type="button"
          onClick={() => {
            setVideoStatus(VideoStatus.Loading);
            chime.audioVideo.stopLocalVideoTile();
            setVideoStatus(VideoStatus.Disabled);
          }}
        >
          Disable video
        </button>
      )}
      <video muted ref={videoElement} className={cx('video')} />
    </div>
  );
}
