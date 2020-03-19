import classNames from 'classnames/bind';
import React, { useCallback, useContext, useEffect, useState } from 'react';

import { VideoTileState } from 'amazon-chime-sdk-js';
import getChimeContext from '../context/getChimeContext';
import StudentVideo from './StudentVideo';
import styles from './StudentVideoGroup.css';

const cx = classNames.bind(styles);
const MAX_STUDENT_VIDEOS = 16;

export default function StudentVideoGroup() {
  const chime = useContext(getChimeContext());
  const [visibleIndices, setVisibleIndices] = useState({});
  const videoElements: HTMLVideoElement[] = [];
  const tiles: { [index: number]: number } = {};

  const acquireVideoIndex = (tileId: number): number => {
    for (let index = 0; index < MAX_STUDENT_VIDEOS; index += 1) {
      if (tiles[index] === tileId) {
        return index;
      }
    }
    for (let index = 0; index < MAX_STUDENT_VIDEOS; index += 1) {
      if (!(index in tiles)) {
        tiles[index] = tileId;
        return index;
      }
    }
    throw new Error('no tiles are available');
  };

  const releaseVideoIndex = (tileId: number): number => {
    for (let index = 0; index < MAX_STUDENT_VIDEOS; index += 1) {
      if (tiles[index] === tileId) {
        delete tiles[index];
        return index;
      }
    }
    return -1;
  };

  const numberOfVisibleIndices = Object.keys(visibleIndices).reduce(
    (result, key) => result + (visibleIndices[key] ? 1 : 0),
    0
  );

  useEffect(() => {
    chime.audioVideo.addObserver({
      videoTileDidUpdate: (tileState: VideoTileState): void => {
        if (!tileState.boundAttendeeId || tileState.localTile) {
          return;
        }
        const index = acquireVideoIndex(tileState.tileId);
        chime.audioVideo.bindVideoElement(
          tileState.tileId,
          videoElements[index]
        );
        setVisibleIndices(previousVisibleIndices => ({
          ...previousVisibleIndices,
          [index]: true
        }));
      },
      videoTileWasRemoved: (tileId: number): void => {
        const index = releaseVideoIndex(tileId);
        setVisibleIndices(previousVisibleIndices => ({
          ...previousVisibleIndices,
          [index]: false
        }));
      }
    });
  }, []);

  return (
    <div
      className={cx(
        'studentVideoGroup',
        `studentVideoGroup-${numberOfVisibleIndices}`
      )}
    >
      {Array.from(Array(MAX_STUDENT_VIDEOS).keys()).map((key, index) => (
        <StudentVideo
          key={key}
          enabled={visibleIndices[index]}
          videoElementRef={useCallback((element: HTMLVideoElement) => {
            videoElements[index] = element;
          }, [])}
        />
      ))}
    </div>
  );
}
