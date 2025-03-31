import type { ResourceAcquire } from '../resources/index.js';
import type { PromiseCancellableController } from '../async-cancellable/index.js';
import type {
  RWLockReader,
  RWLockWriter,
  LockBox,
} from '../async-locks/index.js';
import { Timer } from '../timer/index.js';
import { Monitor } from '../async-locks/index.js';

const AsyncFunction = (async () => {}).constructor;
const GeneratorFunction = function* () {}.constructor;
const AsyncGeneratorFunction = async function* () {}.constructor;

const contexts = new WeakMap<object, number>();

function getContextIndex(
  target: any,
  key: string | symbol,
  targetName: string,
): number {
  const contextIndex = contexts.get(target[key]);
  if (contextIndex == null) {
    throw new TypeError(
      `\`${targetName}.${key.toString()}\` does not have a \`@context\` parameter decorator`,
    );
  }
  return contextIndex;
}

function checkContextCancellable(
  ctx: any,
  key: string | symbol,
  targetName: string,
): void {
  if (typeof ctx !== 'object' || ctx === null) {
    throw new TypeError(
      `\`${targetName}.${key.toString()}\` decorated \`@context\` parameter is not a context object`,
    );
  }
  if (ctx.signal !== undefined && !(ctx.signal instanceof AbortSignal)) {
    throw new TypeError(
      `\`${targetName}.${key.toString()}\` decorated \`@context\` parameter's \`signal\` property is not an instance of \`AbortSignal\``,
    );
  }
}

function checkContextTimed(
  ctx: any,
  key: string | symbol,
  targetName: string,
): void {
  if (typeof ctx !== 'object' || ctx === null) {
    throw new TypeError(
      `\`${targetName}.${key.toString()}\` decorated \`@context\` parameter is not a context object`,
    );
  }
  if (ctx.signal !== undefined && !(ctx.signal instanceof AbortSignal)) {
    throw new TypeError(
      `\`${targetName}.${key.toString()}\` decorated \`@context\` parameter's \`signal\` property is not an instance of \`AbortSignal\``,
    );
  }
  if (
    ctx.timer !== undefined &&
    !(typeof ctx.timer === 'number' || ctx.timer instanceof Timer)
  ) {
    throw new TypeError(
      `\`${targetName}.${key.toString()}\` decorated \`@context\` parameter's \`timer\` property is not a number nor an instance of \`Timer\``,
    );
  }
}

/**
 * Timer resource
 * Use it with `withF` or `withG`.
 */
function timer<T = void>(
  handlerOrOpts?:
    | ((signal: AbortSignal) => T | PromiseLike<T>)
    | {
        handler?: (signal: AbortSignal) => T | PromiseLike<T>;
        delay?: number;
        lazy?: boolean;
        controller?: PromiseCancellableController;
      },
  delay: number = 0,
  lazy: boolean = false,
  controller?: PromiseCancellableController,
): ResourceAcquire<Timer<T>> {
  return async () => {
    let timer: Timer<T>;
    if (typeof handlerOrOpts === 'function') {
      timer = new Timer(handlerOrOpts, delay, lazy, controller);
    } else {
      timer = new Timer(handlerOrOpts);
    }
    return [
      async () => {
        timer.cancel();
      },
      timer,
    ];
  };
}

function monitor<RWLock extends RWLockReader | RWLockWriter>(
  lockBox: LockBox<RWLock>,
  lockConstructor: new () => RWLock,
  locksPending?: Map<string, { count: number }>,
): ResourceAcquire<Monitor<RWLock>> {
  return async () => {
    const monitor = new Monitor(lockBox, lockConstructor, locksPending);
    return [
      async () => {
        await monitor.unlockAll();
      },
      monitor,
    ];
  };
}

function isPromiseLike(v: any): v is PromiseLike<unknown> {
  return v != null && typeof v.then === 'function';
}

/**
 * Is generator object
 * Use this to check for generators
 */
function isGenerator(v: any): v is Generator<unknown> {
  return (
    v != null &&
    typeof v[Symbol.iterator] === 'function' &&
    typeof v.next === 'function' &&
    typeof v.return === 'function' &&
    typeof v.throw === 'function'
  );
}

/**
 * Is async generator object
 * Use this to check for async generators
 */
function isAsyncGenerator(v: any): v is AsyncGenerator<unknown> {
  return (
    v != null &&
    typeof v === 'object' &&
    typeof v[Symbol.asyncIterator] === 'function' &&
    typeof v.next === 'function' &&
    typeof v.return === 'function' &&
    typeof v.throw === 'function'
  );
}

export {
  AsyncFunction,
  GeneratorFunction,
  AsyncGeneratorFunction,
  contexts,
  getContextIndex,
  checkContextCancellable,
  checkContextTimed,
  timer,
  monitor,
  isPromiseLike,
  isGenerator,
  isAsyncGenerator,
};
