interface PromiseLikeCancellable<T> extends PromiseLike<T> {
  cancel(reason?: any): void;
}

type PromiseCancellableController =
  | ((signal: AbortSignal) => void)
  | AbortController;

export type { PromiseLikeCancellable, PromiseCancellableController };
