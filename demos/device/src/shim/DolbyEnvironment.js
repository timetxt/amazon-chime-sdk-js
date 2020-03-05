export class DolbyEnvironment {
  dapi;
  application;

  constructor(dapi) {
    this.dapi = dapi;
  }

  init = messageHandler => {
    console.info('Controller environment init called.');

    const onInit = ok => {
      console.debug('DAPI.onInit.');

      if (!ok) {
        console.debug('DAPI: failed to init.');
        throw new Error('Failed to init DAPI.');
      }

      const session = this.dapi.appLink2;

      if (!session) {
        console.debug('DAPI: error: init: Could not connect');
        throw new Error('No window.dapi.appLink2.');
      }

      session.onStatusChanged = () => {
        console.log(`AppLink2 status changed: ${session.statusString()}`);
        const status = session.status();

        if (status === session.Status.Error) {
          console.log(`AppLink2 status error: ${session.errorString()}`);
          setTimeout(session.connect, 3000);
        }
      };

      session.onMessageReceived = message => {
        console.debug('DAPI: debug: onMessageReceived');
        messageHandler(JSON.parse(message));
      };

      session.connect();
    };

    this.dapi.init(onInit);
  };

  sendMessage = message => {
    this.dapi.appLink2.sendMessage(JSON.stringify(message));
  };
}

export default DolbyEnvironment;
