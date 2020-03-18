import React, { useEffect, useReducer, useRef } from 'react';
import { RouteComponentProps, withRouter } from 'react-router-dom';

import MeetingManager from '../../MeetingManager';
import routes from '../../../routes';
import { initialState, reducer, Type as actionType } from './reducer';
import { MessageHandler, DeviceMessage } from '../../../shim/types';
import { Type as messageType } from '../../../controller/containers/ControllerProvider/reducer';
import { ScreenObserver, ScreenMessageDetail } from '../../../../../../build';

const screenViewDiv = () => document.getElementById('shared-content-view') as HTMLDivElement;
const nameplateDiv = () =>
  document.getElementById('share-content-view-nameplate') as HTMLDivElement;

const sendMessage = async (msg: DeviceMessage): Promise<void> => {
  if (!window.deviceEnvironment) return;
  console.log(`Sending message to controller ${msg.type}`);

  const env = await window.deviceEnvironment;
  env.sendMessage(msg);
};

interface RoomProviderProps extends RouteComponentProps {}

const RoomProvider: React.FC<RoomProviderProps> = ({ history }) => {
  const [state, dispatch] = useReducer(reducer, initialState);
  const isInitialized = useRef(false);

  const screenShareObservers: ScreenObserver = {
    streamDidStart(screenMessageDetail: ScreenMessageDetail): void {
      MeetingManager.getAttendee(screenMessageDetail.attendeeId).then((name: string) => {
        nameplateDiv().innerHTML = name;
      });
      const deviceMessage: DeviceMessage = {
        type: actionType.StartScreenShareView,
      };
      messageHandler(deviceMessage);
    },
    streamDidStop(_screenMessageDetail: ScreenMessageDetail): void {
      nameplateDiv().innerHTML = 'No one is sharing screen';

      const deviceMessage: DeviceMessage = {
        type: actionType.StopScreenShareView,
      };
      messageHandler(deviceMessage);
    },
  };
  const messageHandler: MessageHandler = async ({ type, payload }) => {
    console.log(`RoomProvider::messageHandler - Message received with type: ${type}`);

    try {
      switch (type) {
        case actionType.JoinMeeting:
          const { meetingId, name } = payload;
          if (!meetingId || !name) return;

          await MeetingManager.joinMeeting(meetingId, name);
          dispatch({ type: actionType.JoinMeeting });
          history.push(routes.MEETING);
          MeetingManager.registerScreenShareObservers(screenShareObservers);
          break;
        case actionType.StartLocalVideo:
          MeetingManager.startLocalVideo();
          dispatch({ type: actionType.StartLocalVideo });
          break;
        case actionType.StopLocalVideo:
          MeetingManager.stopLocalVideo();
          dispatch({ type: actionType.StopLocalVideo });
          break;
        case actionType.LeaveMeeting:
          await MeetingManager.leaveMeeting();
          history.push(routes.ROOT);
          dispatch({ type: actionType.LeaveMeeting });
          break;
        case actionType.EndMeeting:
          await MeetingManager.endMeeting();
          history.push(routes.ROOT);
          dispatch({ type: actionType.EndMeeting });
          break;
        case actionType.StartScreenShareView:
          screenViewDiv().style.display = 'grid';
          MeetingManager.startViewingScreenShare(screenViewDiv());
          dispatch({ type: actionType.StartScreenShareView });
          break;
        case actionType.StopScreenShareView:
          screenViewDiv().style.display = 'none';
          MeetingManager.stopViewingScreenShare();
          dispatch({ type: actionType.StopScreenShareView });
          break;
        default:
          console.log(`Unhandled incoming message: ${type}`);
          break;
      }
    } catch (e) {
      alert(e);
    }
  };

  useEffect(() => {
    if (!isInitialized.current) return;

    if (state.activeMeeting) {
      sendMessage({ type: messageType.MeetingJoined });
    } else {
      sendMessage({ type: messageType.MeetingLeft });
    }
  }, [state.activeMeeting]);

  useEffect(() => {
    if (!isInitialized.current) return;

    const { isSharingLocalVideo } = state;
    sendMessage({
      type: messageType.MeetingData,
      payload: { isSharingLocalVideo },
    });
  }, [state.isSharingLocalVideo]);

  useEffect(() => {
    if (!isInitialized.current) return;

    const { isViewingSharedScreen } = state;
    sendMessage({
      type: messageType.MeetingData,
      payload: { isViewingSharedScreen },
    });
  }, [state.isViewingSharedScreen]);

  useEffect(() => {
    if (!window.deviceEnvironment) return;

    window.deviceEnvironment.then(env => {
      env.init(messageHandler);
    });

    isInitialized.current = true;
  }, []);

  return null;
};

export default withRouter(RoomProvider);
