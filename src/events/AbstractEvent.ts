/**
 * Unlike `CustomEvent`, the `detail` property can be `undefined`.
 * It will not default to `null`.
 */
class AbstractEvent<T = undefined> extends Event {
  public readonly detail: T;

  protected constructorParams: IArguments;

  public constructor(
    type?: string,
    options?: CustomEventInit<T>,
    constructorParams?: IArguments,
  );
  public constructor(
    options: CustomEventInit<T>,
    constructorParams?: IArguments,
  );
  public constructor(
    type: string | CustomEventInit<T> = new.target.name,
    options?: CustomEventInit<T> | IArguments,
    constructorParams?: IArguments,
  ) {
    if (typeof type === 'string') {
      super(type, options as CustomEventInit<T> | undefined);
      this.detail = (options as CustomEventInit<T> | undefined)?.detail as T;
    } else {
      super(new.target.name, type);
      this.detail = type.detail as T;
      constructorParams = options as IArguments | undefined;
    }
    this.constructorParams = constructorParams ?? arguments;
  }

  /**
   * Events cannot be re-dispatched. This was probably to prevent infinite
   * loops. So instead of re-dispatching the same instance, we re-dispatch
   * a clone of the instance.
   */
  public clone(): this {
    try {
      return new (this.constructor as any)(...this.constructorParams);
    } catch (e) {
      // Normally we would check `instanceof TypeError`
      // However jest appears to choke on that
      if (e.name === 'TypeError') {
        throw new TypeError(
          `Cloning ${this.constructor.name} requires the original constructor arguments to be passed into super`,
        );
      }
      throw e;
    }
  }
}

export default AbstractEvent;
