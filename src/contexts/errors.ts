import { AbstractError } from '../errors/index.js';

class ErrorContexts<T> extends AbstractError<T> {
  static description = 'Contexts error';
}

class ErrorContextsTimedTimeOut<T> extends ErrorContexts<T> {
  static description = 'Aborted due to timer expiration';
}

export { ErrorContexts, ErrorContextsTimedTimeOut };
