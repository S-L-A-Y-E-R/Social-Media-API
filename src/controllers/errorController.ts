import {
  PrismaClientKnownRequestError,
  PrismaClientInitializationError,
  PrismaClientRustPanicError,
  PrismaClientUnknownRequestError,
  PrismaClientValidationError,
} from "@prisma/client/runtime/library";
import { Prisma } from "@prisma/client";
import { ZodError } from "zod";
import { Request, Response, NextFunction } from "express";
import AppError from "../utils/appError";

interface ErrorResponse {
  statusCode: number;
  status: string;
  message: string;
  stack?: string;
  isOperational?: boolean;
}

type PrismaError =
  | PrismaClientKnownRequestError
  | PrismaClientUnknownRequestError
  | PrismaClientInitializationError
  | PrismaClientRustPanicError
  | PrismaClientValidationError;

const handlePrismaError = (err: PrismaError): AppError => {
  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    const regex =
      /Invalid `(.+?)` invocation:\n\n\nUnique constraint failed on the fields: \((.+?)\)/s;
    const match = err.message.match(regex);
    const fields = match?.[2].split(",").map((field) => field.trim());
    const message = `This fields need to be unique: (${fields?.join(", ")}).`;

    return new AppError(message || "Prisma Client Request Error", 400);
  }

  if (err instanceof Prisma.PrismaClientUnknownRequestError) {
    return new AppError(err.message, 500);
  }

  if (err instanceof Prisma.PrismaClientInitializationError) {
    const message =
      err.errorCode === "P1012"
        ? "Unable to connect to the database"
        : "Prisma Client Initialization Error";
    return new AppError(message, 500);
  }

  if (err instanceof Prisma.PrismaClientRustPanicError) {
    return new AppError(err.message || "Panic Error", 500);
  }

  if (err instanceof Prisma.PrismaClientValidationError) {
    const regex = /Argument `(.+?)` is missing\./;
    const match = err.message.match(regex);
    const missingField = match?.[1];
    const message = `Missing required field: '${missingField}'.`;
    return new AppError(message || "Validation Error", 400);
  }

  return new AppError("Unknown Prisma Client Error", 500);
};

const handleZodError = (err: ZodError): AppError => {
  const messagesObj = err.issues.map((issue) => {
    return { [issue.path[0]]: issue.message };
  });
  const messages = Object.assign({}, ...messagesObj);
  const messageKeys = Object.keys(messages);
  const messageValues = Object.values(messages);
  const message = `Invalid ${
    messageKeys.length > 1 ? "fields" : "field"
  }:{ ${messageKeys.join(", ")}} - {${messageValues.join(", ")}}.`;
  return new AppError(message, 400);
};

const handleExpiredTokenError = (): AppError =>
  new AppError("Expired token, please login again!", 401);

const handleTokenError = (): AppError =>
  new AppError("Invalid token, please login!", 401);

const devError = (res: Response, err: ErrorResponse): void => {
  res.status(err.statusCode).json({
    status: err.status,
    error: err,
    message: err.message,
    stack: err.stack,
  });
};

const prodError = (res: Response, err: ErrorResponse): void => {
  if (err.isOperational) {
    res.status(err.statusCode).json({
      status: err.status,
      message: err.message,
    });
  } else {
    res.status(500).json({
      status: "error",
      message: "Something went wrong",
    });
  }
};

const globalErrorHandler = (
  err: AppError,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  err.statusCode = err.statusCode || 500;
  err.status = err.status || "error";

  if (process.env.NODE_ENV === "development") {
    devError(res, err);
  } else {
    try {
      const error = handlePrismaError(err as unknown as PrismaError);
      if (err.name === "JsonWebTokenError") throw handleTokenError();
      if (err.name === "TokenExpiredError") throw handleExpiredTokenError();
      if (err.name === "ZodError")
        throw handleZodError(err as unknown as ZodError);
      prodError(res, error);
    } catch (error) {
      prodError(res, error as ErrorResponse);
    }
  }

  next();
};

export default globalErrorHandler;
