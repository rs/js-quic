import type { ContextCancellable } from '../types.js';
import { setupCancellable } from '../functions/cancellable.js';
import * as utils from '../utils.js';

function cancellable(lazy: boolean = false) {
  return <
    T extends TypedPropertyDescriptor<
      (...params: Array<any>) => PromiseLike<any>
    >,
  >(
    target: any,
    key: string | symbol,
    descriptor: T,
  ): T => {
    // Target is instance prototype for instance methods // or the class prototype for static methods
    const targetName = target['name'] ?? target.constructor.name;
    const f = descriptor['value'];
    if (typeof f !== 'function') {
      throw new TypeError(
        `\`${targetName}.${key.toString()}\` is not a function`,
      );
    }
    const contextIndex = utils.getContextIndex(target, key, targetName);
    descriptor['value'] = function (...args) {
      let ctx: Partial<ContextCancellable> = args[contextIndex];
      if (ctx === undefined) {
        ctx = {};
      } else {
        // Copy the ctx into a new ctx object to avoid mutating the ctx in case
        // it is used again
        ctx = { ...ctx };
      }
      args[contextIndex] = ctx;
      // Runtime type check on the context parameter
      utils.checkContextCancellable(ctx, key, targetName);
      return setupCancellable(
        (_, ...args) => f.apply(this, args),
        lazy,
        ctx,
        args,
      );
    };
    // Preserve the name
    Object.defineProperty(descriptor['value'], 'name', {
      value: typeof key === 'symbol' ? `[${key.description}]` : key,
    });
    return descriptor;
  };
}

export default cancellable;
