interface ReadonlyWeakSet<T extends object> {
  has(value: T): boolean;
}

type EventHandlerInfo = {
  callback: EventListenerOrEventListenerObject;
  options: AddEventListenerOptions;
  handler: EventListener;
};

export type { ReadonlyWeakSet, EventHandlerInfo };
