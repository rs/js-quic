import AbstractEvent from './AbstractEvent.js';

/**
 * EventDefault wraps dispatched events that were not handled.
 */
class EventDefault<T extends Event = Event> extends AbstractEvent<T> {
  public constructor(options: EventInit & { detail: T }) {
    super(EventDefault.name, options, arguments);
  }
}

export default EventDefault;
