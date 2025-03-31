/**
 * Resource acquisition function
 * This returns a tuple of resource release function and the acquired resource
 * When implementing this type, make sure to use arrow functions or
 * if you are passing a method, make sure to bind the `this` context
 */
type ResourceAcquire<Resource> = (
  resources?: readonly any[],
) => Promise<readonly [ResourceRelease, Resource?]>;

/**
 * Resource release function
 * Pass any error during resource usage into the function
 * The function should not rethrow the error, it only uses it to change
 * its releasing behaviour, the `withF` and `withG` utilities will rethrow
 * the error
 */
type ResourceRelease = (e?: Error) => Promise<void>;

type Resources<T extends readonly ResourceAcquire<unknown>[]> = {
  [K in keyof T]: T[K] extends ResourceAcquire<infer R> ? R : never;
};

export type { ResourceAcquire, ResourceRelease, Resources };
