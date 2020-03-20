import {
  MeetingSessionStatus,
  MeetingSessionStatusCode
} from 'amazon-chime-sdk-js';
import classNames from 'classnames/bind';
import React, { useContext, useEffect, useRef, useState } from 'react';
import { Link, useHistory, useLocation } from 'react-router-dom';

import routes from '../constants/routes.json';
import getChimeContext from '../context/getChimeContext';
import Controls from './Controls';
import LoadingSpinner from './LoadingSpinner';
import Roster from './Roster';
import StudentVideoGroup from './StudentVideoGroup';
import styles from './TeacherRoom.css';
import TeacherVideo from './TeacherVideo';

const cx = classNames.bind(styles);

enum Status {
  Loading,
  RoomReady,
  Succeeded,
  Failed
}

export default function TeacherRoom() {
  const chime = useContext(getChimeContext());
  const [status, setStatus] = useState(Status.Loading);
  const [errorMesssage, setErrorMesssage] = useState(null);
  const audioElement = useRef(null);
  const history = useHistory();

  const query = new URLSearchParams(useLocation().search);
  const title = query.get('title');
  const name = query.get('name');
  const region = query.get('region');

  useEffect(() => {
    const createRoom = async () => {
      try {
        await chime.createRoom(title, name, region);
        setStatus(Status.RoomReady);
      } catch (error) {
        // eslint-disable-next-line
        console.error(error);
        setErrorMesssage(error.message);
        setStatus(Status.Failed);
      }
    };
    createRoom();
  }, []);

  useEffect(() => {
    const joinRoom = async () => {
      try {
        await chime.audioVideo.addObserver({
          audioVideoDidStart: (): void => {
            setStatus(Status.Succeeded);
          },
          audioVideoDidStop: (sessionStatus: MeetingSessionStatus): void => {
            if (
              sessionStatus.statusCode() ===
              MeetingSessionStatusCode.AudioCallEnded
            ) {
              history.push('/');
            }
          }
        });
        await chime.joinRoom(audioElement.current);
      } catch (error) {
        // eslint-disable-next-line
        console.error(error);
        setErrorMesssage(error.message);
        setStatus(Status.Failed);
      }
    };
    if (status === Status.RoomReady) {
      joinRoom();
    }
  }, [status]);

  return (
    <div className={cx('teacherRoom')}>
      {/* eslint-disable-next-line */}
      <audio ref={audioElement} className={cx('audio')} />
      {status === Status.Loading && <LoadingSpinner />}
      {(status === Status.RoomReady || status === Status.Succeeded) && (
        <>
          <div className={cx('left')}>
            <div className={cx('remoteVideoGroup')}>
              <StudentVideoGroup />
            </div>
            <div className={cx('localVideoContainer')}>
              <Controls />
              <TeacherVideo />
            </div>
          </div>
          <div className={cx('right')}>
            <div className={cx('roster')}>
              <Roster />
            </div>
            <div className={cx('chat')}>Chat here</div>
          </div>
        </>
      )}
      {status === Status.Failed && errorMesssage && (
        <div className={cx('error')}>
          <div className={cx('errorMessage')}>{errorMesssage}</div>
          <Link className={cx('goHomeLink')} to={routes.HOME}>
            Take me home
          </Link>
        </div>
      )}
    </div>
  );
}
