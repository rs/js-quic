/**
 * Symbols prevents name clashes with decorated classes
 */
const _eventTarget = Symbol('_eventTarget');
const eventTarget = Symbol('eventTarget');

const _eventHandlers = Symbol('_eventHandlers');
const eventHandlers = Symbol('eventHandlers');

const _eventHandled = Symbol('_eventHandled');
const eventHandled = Symbol('eventHandled');

const _handleEventError = Symbol('_handleEventError');
const handleEventError = Symbol('handleEventError');

function canonicalizeOptions(
  options?: AddEventListenerOptions | EventListenerOptions | boolean,
): AddEventListenerOptions {
  return {
    capture: false,
    once: false,
    passive: false,
    ...(typeof options === 'boolean'
      ? { capture: options }
      : typeof options === 'object'
      ? options
      : undefined),
  };
}

/**
 * EventTarget relies on option comparison.
 * Only the capture property is used.
 */
function isEqualOptions(
  options1: EventListenerOptions,
  options2: EventListenerOptions,
): boolean {
  return options1.capture === options2.capture;
}

export {
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
};
