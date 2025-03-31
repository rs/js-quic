import type { ReadonlyWeakSet, EventHandlerInfo } from './types.js';
import EventAll from './EventAll.js';
import EventDefault from './EventDefault.js';
import EventError from './EventError.js';
import {
  _eventTarget,
  eventTarget,
  _eventHandlers,
  eventHandlers,
  _eventHandled,
  eventHandled,
  _handleEventError,
  handleEventError,
  canonicalizeOptions,
  isEqualOptions,
} from './utils.js';

interface Evented {
  get [eventTarget](): EventTarget;
  get [eventHandlers](): ReadonlyMap<string, Set<EventHandlerInfo>>;
  get [eventHandled](): ReadonlyWeakSet<Event>;
  get [handleEventError](): (evt: EventError) => void;
  addEventListener(
    type: string,
    callback: EventListenerOrEventListenerObject | null,
    options?: AddEventListenerOptions | boolean,
  ): void;
  removeEventListener(
    type: string,
    callback: EventListenerOrEventListenerObject | null,
    options?: EventListenerOptions | boolean,
  ): void;
  dispatchEvent(event: Event): boolean;
}

function Evented() {
  return <
    T extends {
      new (...args: any[]): object;
    },
  >(
    constructor: T,
  ) => {
    const constructor_ = class extends constructor {
      public [_eventTarget]: EventTarget = new EventTarget();
      public [_eventHandlers]: Map<string, Set<EventHandlerInfo>> = new Map();
      public [_eventHandled]: WeakSet<Event> = new WeakSet();
      public [_handleEventError]: (evt: EventError) => void = (
        evt: EventError,
      ) => {
        throw evt.detail;
      };

      public constructor(...args: Array<any>) {
        super(...args);
        // Default `EventError` handler
        this[_eventTarget].addEventListener(
          EventError.name,
          this[_handleEventError],
        );
      }

      public get [eventTarget](): EventTarget {
        return this[_eventTarget];
      }

      public get [eventHandlers](): ReadonlyMap<string, Set<EventHandlerInfo>> {
        return this[_eventHandlers];
      }

      public get [eventHandled](): ReadonlyWeakSet<Event> {
        return this[_eventHandled];
      }

      public get [handleEventError](): (evt: EventError) => void {
        return this[_handleEventError];
      }

      /**
       * This can be O(n) per type due to searching for both handler and options.
       */
      public addEventListener(
        type: string,
        callback: EventListenerOrEventListenerObject | null,
        options?: AddEventListenerOptions | boolean,
      ) {
        options = canonicalizeOptions(options);
        const that = this;
        // Get the previously wrapped handler if it exists
        let handler: EventListenerOrEventListenerObject | null | undefined;
        let handlerSet: Set<EventHandlerInfo> | undefined;
        let optionsEqual = false;
        if (
          typeof callback === 'function' ||
          typeof callback?.handleEvent === 'function'
        ) {
          handlerSet = this[_eventHandlers].get(type);
          if (handlerSet === undefined) {
            handlerSet = new Set();
            this[_eventHandlers].set(type, handlerSet);
          }
          for (const handlerInfo of handlerSet) {
            if (handlerInfo.callback === callback) {
              handler = handlerInfo.handler;
              if (isEqualOptions(handlerInfo.options, options)) {
                optionsEqual = true;
                break;
              }
            }
          }
        }
        if (typeof callback === 'function') {
          if (handler == null) {
            handler = async function (e) {
              // Indicate that the event is now handled
              // It must done earlier in case the callback is asynchronous
              that[_eventHandled].add(e);
              let result: any;
              try {
                // Propagate the `that`
                result = callback.call(that, e);
              } catch (e) {
                // Deal with the uncaught exception
                this.dispatchEvent(
                  new EventError({
                    detail: e,
                  }),
                );
              }
              // If the result is `PromiseLike` await the result
              // This does use `await` on the callback in case it is synchronous
              // in order to preserve operational microtask scheduling behaviour
              // Deal with the unhandled rejection
              if (typeof result?.then === 'function') {
                try {
                  await result;
                } catch (e) {
                  this.dispatchEvent(
                    new EventError({
                      detail: e,
                    }),
                  );
                }
              }
            };
            // Add new handler info because handler is new
            handlerSet!.add({
              callback,
              options,
              handler,
            });
          } else if (!optionsEqual) {
            // Add new handler info with the same handler because options is different
            handlerSet!.add({
              callback,
              options,
              handler: handler as EventListener,
            });
          }
        } else if (typeof callback?.handleEvent === 'function') {
          if (handler == null) {
            handler = async function (e) {
              // Indicate that the event is now handled
              // It must done earlier in case the callback is asynchronous
              that[_eventHandled].add(e);
              let result: any;
              try {
                // Don't propagate the `that`
                result = callback.handleEvent(e);
              } catch (e) {
                // Deal with the uncaught exception
                this.dispatchEvent(
                  new EventError({
                    detail: e,
                  }),
                );
              }
              // If the result is `PromiseLike` await the result
              // This does use `await` on the callback in case it is synchronous
              // in order to preserve operational microtask scheduling behaviour
              // Deal with the unhandled rejection
              if (typeof result?.then === 'function') {
                try {
                  await result;
                } catch (e) {
                  this.dispatchEvent(
                    new EventError({
                      detail: e,
                    }),
                  );
                }
              }
              return result;
            };
            // Add new handler info because handler is new
            handlerSet!.add({
              callback,
              options,
              handler,
            });
          } else if (!optionsEqual) {
            // Add new handler info with the same handler because options is different
            handlerSet!.add({
              callback,
              options,
              handler: handler as EventListener,
            });
          }
        } else {
          handler = callback;
        }
        this[_eventTarget].addEventListener(type, handler, options);
        // Disable the base error handler if there is at least one listener for errors
        if (type === EventError.name && handlerSet?.size === 1) {
          this[_eventTarget].removeEventListener(
            EventError.name,
            this[_handleEventError],
          );
        }
      }

      /**
       * This can be O(n) per type due to searching for both handler and options.
       */
      public removeEventListener(
        type: string,
        callback: EventListenerOrEventListenerObject | null,
        options?: EventListenerOptions | boolean,
      ) {
        options = canonicalizeOptions(options);
        let handler: EventListenerOrEventListenerObject | null | undefined;
        let handlerSet: Set<EventHandlerInfo> | undefined;
        let handlerInfoToBeRemoved: EventHandlerInfo | undefined;
        if (callback != null) {
          handlerSet = this[_eventHandlers].get(type);
          if (handlerSet === undefined) {
            return;
          }
          for (const handlerInfo of handlerSet) {
            if (
              handlerInfo.callback === callback &&
              isEqualOptions(handlerInfo.options, options)
            ) {
              // The handler will be the same instance
              handler = handlerInfo.handler;
              handlerInfoToBeRemoved = handlerInfo;
              break;
            }
          }
          if (handler == null) {
            return;
          }
        } else {
          handler = callback;
        }
        this[_eventTarget].removeEventListener(type, handler, options);
        if (handlerSet != null && handlerInfoToBeRemoved != null) {
          handlerSet.delete(handlerInfoToBeRemoved);
          // Enable the base error handler if there is no listener for errors
          if (type === EventError.name && handlerSet.size === 0) {
            this[_eventTarget].addEventListener(
              EventError.name,
              this[_handleEventError],
            );
          }
        }
      }

      public dispatchEvent(event: Event) {
        // Override the `target` and `currentTarget` to point to the current object
        Object.defineProperties(event, {
          target: {
            value: this,
            writable: false,
          },
          currentTarget: {
            value: this,
            writable: false,
          },
        });
        if (event instanceof EventError) {
          // If the event is `EventError`, we don't bother with `EventDefault` and `EventAll`
          return this[_eventTarget].dispatchEvent(event);
        } else {
          let status = this[_eventTarget].dispatchEvent(event);
          if (status && !this[_eventHandled].has(event)) {
            const eventDefault = new EventDefault({
              bubbles: event.bubbles,
              cancelable: event.cancelable,
              composed: event.composed,
              detail: event,
            });
            Object.defineProperties(eventDefault, {
              target: {
                value: this,
                writable: false,
              },
              currentTarget: {
                value: this,
                writable: false,
              },
            });
            status = this[_eventTarget].dispatchEvent(eventDefault);
          }
          if (status) {
            const eventAll = new EventAll({
              bubbles: event.bubbles,
              cancelable: event.cancelable,
              composed: event.composed,
              detail: event,
            });
            Object.defineProperties(eventAll, {
              target: {
                value: this,
                writable: false,
              },
              currentTarget: {
                value: this,
                writable: false,
              },
            });
            status = this[_eventTarget].dispatchEvent(eventAll);
          }
          return status;
        }
      }
    };
    // Preserve the name
    Object.defineProperty(
      constructor_,
      'name',
      Object.getOwnPropertyDescriptor(constructor, 'name')!,
    );
    return constructor_;
  };
}

export { Evented, eventTarget, eventHandlers, eventHandled, handleEventError };
