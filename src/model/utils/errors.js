export class AppError extends Error {

  constructor(message, properties) {
    super(message);
    Object.assign(this, properties);
    this.name = this.constructor.name;
    // non-V8 browsers don't have captureStackTrace
    if (Error.captureStackTrace) Error.captureStackTrace(this, this.constructor);
  }

}
