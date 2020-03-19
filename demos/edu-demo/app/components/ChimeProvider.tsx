import React from 'react';

import {
  AudioVideoFacade,
  AudioVideoObserver,
  ConsoleLogger,
  ContentShareObserver,
  DefaultDeviceController,
  DefaultMeetingSession,
  DeviceChangeObserver,
  LogLevel,
  MeetingSession,
  MeetingSessionConfiguration
} from 'amazon-chime-sdk-js';
import getChimeContext from '../context/getChimeContext';
import getBaseUrl from '../utils/getBaseUrl';

class ChimeSdkWrapper
  implements AudioVideoObserver, ContentShareObserver, DeviceChangeObserver {
  meetingSession: MeetingSession;

  audioVideo: AudioVideoFacade;

  title: string;

  name: string;

  region: string;

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
    this.audioVideo.addObserver(this);
    this.audioVideo.addContentShareObserver(this);
    this.audioVideo.addDeviceChangeObserver(this);
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
    if (end) {
      await fetch(
        `${getBaseUrl()}end?title=${encodeURIComponent(this.title)}`,
        {
          method: 'POST'
        }
      );
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
