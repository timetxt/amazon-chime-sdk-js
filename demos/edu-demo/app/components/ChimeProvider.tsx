import {
  AudioVideoFacade,
  AudioVideoObserver,
  ConsoleLogger,
  ContentShareObserver,
  DefaultDeviceController,
  DefaultMeetingSession,
  DefaultModality,
  DeviceChangeObserver,
  LogLevel,
  MeetingSession,
  MeetingSessionConfiguration
} from 'amazon-chime-sdk-js';
import React from 'react';

import getChimeContext from '../context/getChimeContext';
import RosterType from '../types/RosterType';
import getBaseUrl from '../utils/getBaseUrl';

class ChimeSdkWrapper
  implements AudioVideoObserver, ContentShareObserver, DeviceChangeObserver {
  meetingSession: MeetingSession;

  audioVideo: AudioVideoFacade;

  title: string;

  name: string;

  region: string;

  roster: RosterType = {};

  contentShareEnabled = false;

  // eslint-disable-next-line
  createRoom = async (title: string, name: string, region: string): Promise<any> => {
    const response = await fetch(
      `${getBaseUrl()}join?title=${encodeURIComponent(
        title
      )}&name=${encodeURIComponent(name)}&region=${encodeURIComponent(region)}`,
      {
        method: 'POST'
      }
    );
    const json = await response.json();
    if (json.error) {
      throw new Error(`Server error: ${json.error}`);
    }

    const { JoinInfo } = json;
    await this.initializeMeetingSession(
      new MeetingSessionConfiguration(JoinInfo.Meeting, JoinInfo.Attendee)
    );

    this.title = title;
    this.name = name;
    this.region = region;
  };

  initializeMeetingSession = async (
    configuration: MeetingSessionConfiguration
  ): Promise<void> => {
    const logger = new ConsoleLogger('SDK', LogLevel.DEBUG);
    const deviceController = new DefaultDeviceController(logger);
    this.meetingSession = new DefaultMeetingSession(
      configuration,
      logger,
      deviceController
    );
    this.audioVideo = this.meetingSession.audioVideo;
    this.audioVideo.realtimeSubscribeToAttendeeIdPresence(
      (presentAttendeeId: string, present: boolean): void => {
        if (!present) {
          delete this.roster[presentAttendeeId];
          this.publishRosterUpdate();
          return;
        }

        this.audioVideo.realtimeSubscribeToVolumeIndicator(
          presentAttendeeId,
          async (
            attendeeId: string,
            volume: number | null,
            muted: boolean | null,
            signalStrength: number | null
          ) => {
            if (!this.roster[attendeeId]) {
              this.roster[attendeeId] = { name: '' };
            }
            if (volume !== null) {
              this.roster[attendeeId].volume = Math.round(volume * 100);
            }
            if (muted !== null) {
              this.roster[attendeeId].muted = muted;
            }
            if (signalStrength !== null) {
              this.roster[attendeeId].signalStrength = Math.round(
                signalStrength * 100
              );
            }
            if (!this.roster[attendeeId].name) {
              const baseAttendeeId = new DefaultModality(attendeeId).base();
              const response = await fetch(
                `${getBaseUrl()}attendee?title=${encodeURIComponent(
                  this.title
                )}&attendee=${encodeURIComponent(baseAttendeeId)}`
              );
              const json = await response.json();
              let name = json.AttendeeInfo.Name;
              if (baseAttendeeId !== attendeeId) {
                name += ' «Content»';
                if (
                  baseAttendeeId !==
                    this.meetingSession.configuration.credentials.attendeeId &&
                  this.contentShareEnabled
                ) {
                  // TODO: Stop conte share
                }
              }
              this.roster[attendeeId].name = name || '';
            }
            this.publishRosterUpdate();
          }
        );
      }
    );
  };

  joinRoom = async (element: HTMLAudioElement): Promise<void> => {
    window.addEventListener(
      'unhandledrejection',
      (event: PromiseRejectionEvent) => {
        // eslint-disable-next-line
        console.error(event.reason);
      }
    );

    const audioInputs = await this.audioVideo.listAudioInputDevices();
    await this.audioVideo.chooseAudioInputDevice(audioInputs[0].deviceId);
    this.audioVideo.bindAudioElement(element);
    this.audioVideo.start();
  };

  leaveRoom = async (end: boolean): Promise<void> => {
    this.audioVideo.stop();

    try {
      // eslint-disable-next-line
      if (end) {
        await fetch(
          `${getBaseUrl()}end?title=${encodeURIComponent(this.title)}`,
          {
            method: 'POST'
          }
        );
      }
    } catch (error) {
      // eslint-disable-next-line
      console.error(error);
    } finally {
      this.meetingSession = null;
      this.audioVideo = null;
      this.title = null;
      this.name = null;
      this.region = null;
      this.roster = {};
      this.contentShareEnabled = false;
      this.rosterUpdateCallbacks = [];
    }
  };

  private rosterUpdateCallbacks: RosterType[] = [];

  subscribeToRosterUpdate = (callback: (roster: RosterType) => void) => {
    this.rosterUpdateCallbacks.push(callback);
  };

  unsubscribeFromRosterUpdate = (callback: (roster: RosterType) => void) => {
    const index = this.rosterUpdateCallbacks.indexOf(callback);
    if (index !== -1) {
      this.rosterUpdateCallbacks.splice(index, 1);
    }
  };

  private publishRosterUpdate = () => {
    const clonedRoster = {
      ...this.roster
    };
    for (let i = 0; i < this.rosterUpdateCallbacks.length; i += 1) {
      const callback = this.rosterUpdateCallbacks[i];
      callback(clonedRoster);
    }
  };
}

type Props = {
  children: ReactNode;
};

export default function ChimeProvider(props: Props) {
  const { children } = props;
  const chimeSdkWrapper = new ChimeSdkWrapper();
  const ChimeContext = getChimeContext();
  return (
    <ChimeContext.Provider value={chimeSdkWrapper}>
      {children}
    </ChimeContext.Provider>
  );
}
