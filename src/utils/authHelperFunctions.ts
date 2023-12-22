import { User } from "@prisma/client";
import { sign, verify } from "jsonwebtoken";
import crypto from "crypto";
import { Response } from "express";
import { hash, compare } from "bcrypt";
import { promisify } from "util";

export const hashPassword = async (password: string) => {
  const hashedPassword = await hash(password, 12);
  return hashedPassword;
};

export const comparePassword = async (
  password: string,
  hashedPassword: string
) => {
  const isMatch = await compare(password, hashedPassword);
  return isMatch;
};

export function exclude<User, Key extends keyof User>(
  user: User,
  keys: Array<Extract<keyof User, Key>>
): Omit<User, Key> {
  return Object.fromEntries(
    Object.entries(user as any).filter(([key]) => !keys.includes(key as any))
  ) as Omit<User, Key>;
}

export const createAccessToken = (id: number) => {
  return sign({ id }, process.env.JWT_ACCESS_SECRET!, {
    expiresIn: process.env.JWT_ACCESS_EXPIRES_IN,
  });
};

export const createRefreshToken = (id: number) => {
  return sign({ id }, process.env.JWT_REFRESH_SECRET!, {
    expiresIn: process.env.JWT_REFRESH_EXPIRES_IN,
  });
};

export const responseAndTokens = (
  user: User,
  res: Response,
  statusCode: number
) => {
  const accessToken = createAccessToken(user.id);
  const refreshToken = createRefreshToken(user.id);

  const cookieOptions = (tokenType: "accessToken" | "refreshToken") => {
    const expiresIn =
      tokenType === "accessToken"
        ? parseInt(process.env.JWT_ACCESS_COOKIE_EXPIRES_IN || "0") / 60 / 24
        : parseInt(process.env.JWT_REFRESH_COOKIE_EXPIRES_IN || "0");

    return {
      expires: new Date(Date.now() + expiresIn * 24 * 60 * 60 * 1000),
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
    };
  };

  res.cookie("accessToken", accessToken, cookieOptions("accessToken"));
  res.cookie("refreshToken", refreshToken, cookieOptions("refreshToken"));

  res.status(statusCode).json({
    status: "success",
    data: {
      user: exclude(user, [
        "password",
        "passwordResetToken",
        "passwordResetTokenExpiry",
      ]),
    },
  });
};

export const verifyRefreshToken = async (token: string) => {
  let payload: any = null;

  try {
    payload = await promisify(verify)(
      token,
      // @ts-ignore
      process.env.JWT_REFRESH_SECRET!
    );
  } catch (err) {
    return null;
  }

  return payload;
};

export const verifyAccessToken = async (token: string) => {
  let payload: any = null;

  try {
    payload = await promisify(verify)(
      token,
      // @ts-ignore
      process.env.JWT_ACCESS_SECRET!
    );
  } catch (err) {
    return null;
  }

  return payload;
};

export const createPasswordResetToken = () => {
  const resetToken = crypto.randomBytes(6).toString("hex");
  const hashedResetToken = crypto
    .createHash("sha256")
    .update(resetToken)
    .digest("hex");
  const resetTokenExpiresAt = new Date(Date.now() + 10 * 60 * 1000);
  return { resetToken, hashedResetToken, resetTokenExpiresAt };
};
