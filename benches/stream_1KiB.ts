import url from 'node:url';
import path from 'node:path';
import b from 'benny';
import Logger, { LogLevel } from '#logger/index.js';
import { BenchHandler, suiteCommon } from './utils/index.js';
import * as testsUtils from '../tests/utils.js';
import QUICClient from '#QUICClient.js';
import QUICServer from '#QUICServer.js';
import * as events from '#events.js';
import * as utils from '#utils.js';

const filePath = url.fileURLToPath(import.meta.url);

async function main() {
  const logger = new Logger(`stream_1KiB Bench`, LogLevel.SILENT, [
    new BenchHandler(),
  ]);
  const data1KiB = Buffer.allocUnsafe(1024);
  const tlsConfig = await testsUtils.generateTLSConfig('RSA');
  const quicServer = new QUICServer({
    config: {
      verifyPeer: false,
      key: tlsConfig.leafKeyPairPEM.privateKey,
      cert: tlsConfig.leafCertPEM,
    },
    crypto: {
      key: await testsUtils.generateKeyHMAC(),
      ops: {
        sign: testsUtils.signHMAC,
        verify: testsUtils.verifyHMAC,
      },
    },
    logger: logger.getChild('QUICServer'),
  });
  const { p: serverStreamEndedP, resolveP: serverStreamEndedResolveP } =
    utils.promise<void>();
  quicServer.addEventListener(
    events.EventQUICServerConnection.name,
    (evt: events.EventQUICServerConnection) => {
      const connection = evt.detail;
      connection.addEventListener(
        events.EventQUICConnectionStream.name,
        async (evt: events.EventQUICConnectionStream) => {
          const stream = evt.detail;
          await stream.writable.close();
          // Consume until graceful close of readable
          for await (const _ of stream.readable) {
            // Do nothing, only consume
          }
          serverStreamEndedResolveP();
        },
      );
    },
  );
  await quicServer.start();
  const quicClient = await QUICClient.createQUICClient({
    host: utils.resolvesZeroIP(quicServer.host),
    port: quicServer.port,
    config: {
      verifyPeer: false,
    },
    crypto: {
      ops: {
        randomBytes: testsUtils.randomBytes,
      },
    },
    logger: logger.getChild('QUICClient'),
  });
  const clientStream = quicClient.connection.newStream();
  const writer = clientStream.writable.getWriter();
  await writer.write(data1KiB);
  for await (const _ of clientStream.readable) {
    // No nothing, just consume
  }
  const summary = await b.suite(
    path.basename(filePath, path.extname(filePath)),
    b.add('send 1Kib of data over QUICStream with UDP socket', async () => {
      await writer.write(data1KiB);
    }),
    ...suiteCommon,
  );
  await writer.close();
  await serverStreamEndedP;
  await quicClient?.destroy();
  await quicServer?.stop();
  return summary;
}

if (import.meta.url.startsWith('file:')) {
  const modulePath = url.fileURLToPath(import.meta.url);
  if (process.argv[1] === modulePath) {
    void main();
  }
}

export default main;
