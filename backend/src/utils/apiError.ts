class ApiError extends Error {
  statusCode: any;
  success?: boolean;
  errors?: any;
  data: null;
  constructor(
    statusCode: any,
    message = "Something went wrong!!!",
    errors?: [],
    stack = ""
  ) {
    super(message);
    this.statusCode = statusCode;
    this.data = null;
    this.message = message;
    this.success = false;
    this.errors = errors;
    if (stack) {
      this.stack = stack;
    } else {
      Error.captureStackTrace(this, this.constructor);
    }
  }
}

export { ApiError };
