import classNames from 'classnames/bind';
import React, { useContext, useState } from 'react';
import { useHistory } from 'react-router-dom';

import getChimeContext from '../context/getChimeContext';
import styles from './Controls.css';

const cx = classNames.bind(styles);

enum VideoStatus {
  Disabled,
  Loading,
  Enabled
}

export default function Controls() {
  const chime = useContext(getChimeContext());
  const history = useHistory();
  const [muted, setMuted] = useState(false);
  const [videoStatus, setVideoStatus] = useState(VideoStatus.Disabled);
  return (
    <div className={cx('controls')}>
      <button
        type="button"
        className={cx('muteButton', {
          enabled: !muted
        })}
        onClick={() => {
          if (muted) {
            chime.audioVideo.realtimeUnmuteLocalAudio();
          } else {
            chime.audioVideo.realtimeMuteLocalAudio();
          }
          setMuted(!muted);
        }}
      >
        {muted ? (
          <i className="fas fa-microphone-slash" />
        ) : (
          <i className="fas fa-microphone" />
        )}
      </button>
      <button
        type="button"
        className={cx('videoButton', {
          enabled: videoStatus === VideoStatus.Enabled
        })}
        onClick={async () => {
          if (videoStatus === VideoStatus.Disabled) {
            setVideoStatus(VideoStatus.Loading);
            const videoInputs = await chime.audioVideo.listVideoInputDevices();
            await chime.audioVideo.chooseVideoInputDevice(
              videoInputs[0].deviceId
            );
            chime.audioVideo.startLocalVideoTile();
            setVideoStatus(VideoStatus.Enabled);
          } else if (videoStatus === VideoStatus.Enabled) {
            setVideoStatus(VideoStatus.Loading);
            chime.audioVideo.stopLocalVideoTile();
            setVideoStatus(VideoStatus.Disabled);
          }
        }}
      >
        {videoStatus === VideoStatus.Enabled ? (
          <i className="fas fa-video" />
        ) : (
          <i className="fas fa-video-slash" />
        )}
      </button>
      <button type="button" className={cx('shareButton')} onClick={() => {}}>
        <i className="fas fa-desktop" />
      </button>
      <button
        type="button"
        className={cx('endButton')}
        onClick={() => {
          chime.leaveRoom(true);
          chime.leaveRoomMessaging();
          history.push('/');
        }}
      >
        <i className="fas fa-times" />
      </button>
    </div>
  );
}
