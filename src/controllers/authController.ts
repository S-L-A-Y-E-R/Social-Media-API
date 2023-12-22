import { Request, Response, NextFunction } from "express";
import crypto from "crypto";
import {
  hashPassword,
  responseAndTokens,
  comparePassword,
  createAccessToken,
  verifyRefreshToken,
  createPasswordResetToken,
} from "../utils/authHelperFunctions";
import catchAsync from "../utils/catchAsync";
import { prisma } from "../utils/prismaClient";
import AppError from "../utils/appError";
import { signUpSchema, loginSchema } from "../validators/authValidator";
import Email from "../utils/email";

 declare module "express-serve-static-core" {
  interface Request {
    user?:any;
  }
}

export const signUp = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    req.body.birthDate = new Date(req.body.birthDate);
    const validatedData = signUpSchema.parse(req.body);

    if (validatedData instanceof Error) {
      return next(new AppError(validatedData.message, 400));
    }

    const { username, email, password, birthDate, fullName } = validatedData;
    const hashedPassword = await hashPassword(password);

    const user = await prisma.user.create({
      data: {
        username,
        email,
        password: hashedPassword,
        birthDate,
      },
    });

    await prisma.profile.create({
      data: {
        fullName,
        userId: user.id,
      },
    });

    responseAndTokens(user, res, 201);
  }
);

export const login = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const validatedData = loginSchema.parse(req.body);

    if (validatedData instanceof Error) {
      return next(new AppError(validatedData.message, 400));
    }

    const { email, password } = validatedData;

    const user = await prisma.user.findUnique({
      where: {
        email,
      },
    });

    if (!user || !(await comparePassword(password, user.password))) {
      return next(new AppError("Invalid email or password", 401));
    }

    user.lastLogin = new Date();

    responseAndTokens(user, res, 200);
  }
);

export const refreshToken = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const { refreshToken: token } = req.cookies;

    if (!token) {
      return next(new AppError("You are not logged in", 401));
    }

    let payload = await verifyRefreshToken(token);

    if (!payload) {
      return next(new AppError("Invalid token", 401));
    }

    const user = await prisma.user.findUnique({
      where: {
        id: payload.id,
      },
    });

    if (!user) {
      return next(new AppError("User not found", 404));
    }

    const accessToken = createAccessToken(user.id);

    const expiresIn =
      parseInt(process.env.JWT_ACCESS_COOKIE_EXPIRES_IN || "0") * 60 * 1000;

    res.cookie("accessToken", accessToken, {
      expires: new Date(Date.now() + expiresIn),
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
    });

    res.status(200).json({
      status: "success",
    });
  }
);

export const forgetPassword = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const { email } = req.body;

    const user = await prisma.user.findUnique({
      where: {
        email,
      },
    });

    if (!user) {
      return next(new AppError("User not found", 404));
    }

    const { resetToken, hashedResetToken, resetTokenExpiresAt } =
      createPasswordResetToken();

    try {
      await new Email(user, resetToken).sendPasswordReset();
    } catch (e) {
      return next(
        new AppError(
          "There was an error sending the email. Try again later!",
          500
        )
      );
    }

    await prisma.user.update({
      where: {
        id: user.id,
      },
      data: {
        passwordResetToken: hashedResetToken,
        passwordResetTokenExpiry: resetTokenExpiresAt,
      },
    });

    res.status(200).json({
      status: "success",
      message: "Token sent to email!",
    });
  }
);

export const resetPassword = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const { resetToken } = req.params;
    const { password } = req.body;

    const hashedResetToken = crypto
      .createHash("sha256")
      .update(resetToken)
      .digest("hex");

    const user = await prisma.user.findFirst({
      where: {
        passwordResetToken: hashedResetToken,
        passwordResetTokenExpiry: {
          gt: new Date(),
        },
      },
    });

    if (!user) {
      return next(new AppError("Token is invalid or has expired", 400));
    }

    const hashedPassword = await hashPassword(password);

    await prisma.user.update({
      where: {
        id: user.id,
      },
      data: {
        password: hashedPassword,
        passwordResetToken: null,
        passwordResetTokenExpiry: null,
      },
    });

    responseAndTokens(user, res, 200);
  }
);

export const updatePassword = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const { currentPassword, newPassword } = req.body;

    if (req.user) {
      const user = await prisma.user.findUnique({
        where: {
          id: req.user.id,
        },
      });
      if (!user || !(await comparePassword(currentPassword, user.password))) {
        return next(new AppError("Invalid current password", 401));
      }
      const hashedPassword = await hashPassword(newPassword);
      await prisma.user.update({
        where: {
          id: req.user.id,
        },
        data: {
          password: hashedPassword,
        },
      });
    }

    responseAndTokens(req.user!, res, 200);
  }
);

export const logout = catchAsync(async (req: Request, res: Response) => {
  res.clearCookie("accessToken");
  res.clearCookie("refreshToken");

  res.status(200).json({
    status: "success",
  });
});
