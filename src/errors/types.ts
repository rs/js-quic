/**
 * Plain data dictionary
 */
type POJO = { [key: string]: any };

type Class<T> = new (...args: any[]) => T;

export type { POJO, Class };
