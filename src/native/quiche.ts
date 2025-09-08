/**
 * JS binding to NAPI quiche dynamic library.
 * This code was derived from the auto-generated binding and declaration
 * files provided by napi-rs.
 */
import type {
  ConnectionErrorCode,
  CongestionControlAlgorithm,
  Shutdown,
  Type,
  ConfigConstructor,
  ConnectionConstructor,
  HeaderConstructor,
} from './types.js';
import process from 'process';
import path from 'path';
import url from 'url';
import Module from 'node:module';

interface Quiche {
  MAX_CONN_ID_LEN: number;
  MIN_CLIENT_INITIAL_LEN: number;
  PROTOCOL_VERSION: number;
  MAX_DATAGRAM_SIZE: number;
  MAX_UDP_PACKET_SIZE: number;
  MAX_STREAM_WINDOW: number;
  MAX_CONNECTION_WINDOW: number;
  CRYPTO_ERROR_START: number;
  CRYPTO_ERROR_STOP: number;
  CongestionControlAlgorithm: typeof CongestionControlAlgorithm;
  Shutdown: typeof Shutdown;
  Type: typeof Type;
  ConnectionErrorCode: typeof ConnectionErrorCode;
  negotiateVersion(
    scid: Uint8Array,
    dcid: Uint8Array,
    data: Uint8Array,
  ): number;
  retry(
    scid: Uint8Array,
    dcid: Uint8Array,
    newScid: Uint8Array,
    token: Uint8Array,
    version: number,
    out: Uint8Array,
  ): number;
  versionIsSupported(version: number): boolean;
  Config: ConfigConstructor;
  Connection: ConnectionConstructor;
  Header: HeaderConstructor;
}

/**
 * Try require on all prebuild targets first, then
 * try require on all npm targets second.
 */
function requireBinding(targets: Array<string>): Quiche {
  let requireFn: NodeRequire;
  let dirname: string;

  try {
    // ESM
    requireFn = Module.createRequire(import.meta.url);
    dirname = url.fileURLToPath(new URL('.', import.meta.url));
  } catch {
    // CJS
    requireFn = require;
    dirname = __dirname;
  }

  const projectRoot = path.join(dirname, '../../');
  const prebuildPath = path.join(projectRoot, 'prebuild');

  const prebuildTargets = targets.map((target) =>
    path.join(prebuildPath, `quic-${target}.node`),
  );
  for (const prebuildTarget of prebuildTargets) {
    try {
      return requireFn(prebuildTarget);
    } catch (e) {
      if (e.code !== 'MODULE_NOT_FOUND') throw e;
    }
    try {
      return requireFn(url.pathToFileURL(prebuildTarget).href);
    } catch (e) {
      if (e.code !== 'MODULE_NOT_FOUND') throw e;
    }
  }
  const npmTargets = targets.map((target) => `@rs/quic-${target}`);
  for (const npmTarget of npmTargets) {
    try {
      return requireFn(npmTarget);
    } catch (e) {
      if (e.code !== 'MODULE_NOT_FOUND') throw e;
    }
    try {
      return requireFn(url.pathToFileURL(npmTarget).href);
    } catch (e) {
      if (e.code !== 'MODULE_NOT_FOUND') throw e;
    }
  }
  throw new Error(
    `Failed requiring possible native bindings: ${prebuildTargets.concat(
      npmTargets,
    )}`,
  );
}

let nativeBinding: Quiche;

/**
 * For desktop we only support win32, darwin and linux.
 * Mobile OS support is pending.
 */
switch (process.platform) {
  case 'win32':
    switch (process.arch) {
      case 'x64':
        nativeBinding = requireBinding(['win32-x64']);
        break;
      case 'ia32':
        nativeBinding = requireBinding(['win32-ia32']);
        break;
      case 'arm64':
        nativeBinding = requireBinding(['win32-arm64']);
        break;
      default:
        throw new Error(`Unsupported architecture on Windows: ${process.arch}`);
    }
    break;
  case 'darwin':
    switch (process.arch) {
      case 'x64':
        nativeBinding = requireBinding([
          'darwin-x64',
          'darwin-x64+arm64',
          'darwin-arm64+x64',
          'darwin-universal',
        ]);
        break;
      case 'arm64':
        nativeBinding = requireBinding([
          'darwin-arm64',
          'darwin-arm64+x64',
          'darwin-x64+arm64',
          'darwin-universal',
        ]);
        break;
      default:
        throw new Error(`Unsupported architecture on macOS: ${process.arch}`);
    }
    break;
  case 'linux':
    switch (process.arch) {
      case 'x64':
        nativeBinding = requireBinding(['linux-x64']);
        break;
      case 'arm64':
        nativeBinding = requireBinding(['linux-arm64']);
        break;
      case 'arm':
        nativeBinding = requireBinding(['linux-arm']);
        break;
      default:
        throw new Error(`Unsupported architecture on Linux: ${process.arch}`);
    }
    break;
  default:
    throw new Error(
      `Unsupported OS: ${process.platform}, architecture: ${process.arch}`,
    );
}

export default nativeBinding;

export type { Quiche };
