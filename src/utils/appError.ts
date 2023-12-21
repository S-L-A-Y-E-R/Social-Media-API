interface IAppError {
  statusCode: number;
  status: string;
  message: string;
  isOperational: boolean;
  stack?: string;
  code?: number;
}

class AppError extends Error implements IAppError {
  statusCode: number;
  status: string;
  isOperational: boolean;
  code?: number;

  constructor(message: string, statusCode: number, code?: number) {
    super(message);

    this.statusCode = statusCode;
    this.status = `${statusCode}`.startsWith("4") ? "fail" : "error";
    this.isOperational = true;
    this.code = code;

    Error.captureStackTrace(this, this.constructor);
  }
}

export default AppError;
