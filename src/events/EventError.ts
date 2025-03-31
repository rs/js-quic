import AbstractEvent from './AbstractEvent.js';

/**
 * EventError dispatches all unhandled rejections and uncaught exceptions
 * coming out of event handlers. Asynchronous event handlers may produce
 * unhandled rejections. While synchronous event handlers may produce
 * uncaught exceptions.
 *
 * Note that when an `EventError` is dispatched, even if there's no
 * handler registered for it, it will not result in an `EventDefault`.
 * Furthermore, it is also not redispatched via `EventAll`.
 *
 * This is because `EventError` is a special event that is dispatched
 * when an exception is thrown in an event handler. It does not represent
 * one of the events that the user has in fact dispatched.
 *
 * If there is no event handler for `EventError`, the exception will
 * be thrown to become an uncaught exception. This may crash the program
 * unless you have registered a global uncaught exception handler.
 *
 * The `detail` property is an `any` type because that's what a thrown
 * value can be.
 */
class EventError extends AbstractEvent<any> {
  public constructor(options: EventInit & { detail: any }) {
    super(EventError.name, options, arguments);
  }
}

export default EventError;
