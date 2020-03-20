import classNames from 'classnames/bind';
import React, { useContext, useEffect, useState } from 'react';

import getChimeContext from '../context/getChimeContext';
import RosterAttendeeType from '../types/RosterAttendeeType';
import RosterType from '../types/RosterType';
import styles from './Roster.css';

const cx = classNames.bind(styles);

export default function Roster() {
  const chime = useContext(getChimeContext());
  const [roster, setRoster] = useState({});

  useEffect(() => {
    const callback = (newRoster: RosterType) => {
      setRoster(newRoster);
    };
    chime.subscribeToRosterUpdate(callback);
    return () => {
      chime.unsubscribeFromRosterUpdate(callback);
    };
  }, []);

  return (
    <div className={cx('roster')}>
      {Object.keys(roster).map((attendeeId: string) => {
        const rosterAttendee: RosterAttendeeType = roster[attendeeId];
        return (
          <div key={attendeeId} className={cx('attendee')}>
            <div className={cx('name')}>{rosterAttendee.name}</div>
            {typeof rosterAttendee.muted === 'boolean' && (
              <div className={cx('muted')}>
                {rosterAttendee.muted ? (
                  <i className="fas fa-microphone-slash" />
                ) : (
                  <i className="fas fa-microphone" />
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
