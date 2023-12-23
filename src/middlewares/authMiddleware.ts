import { Request, Response, NextFunction } from "express";
import passport from "passport";
import { Strategy, VerifyCallback } from "passport-google-oauth2";
import { User } from "@prisma/client";
import crypto from "crypto";
import { IProfileGoogle } from "../types/auth-types";
import { prisma } from "../utils/prismaClient";
import AppError from "../utils/appError";
import catchAsync from "../utils/catchAsync";
import { verifyAccessToken } from "../utils/authHelperFunctions";

declare module "express-serve-static-core" {
  interface Request {
    user?: any;
  }
}

export const protect = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    let token = null;

    if (
      req.headers.authorization &&
      req.headers.authorization.startsWith("Bearer")
    ) {
      token = req.headers.authorization.split(" ")[1];
    }

    if (!token) {
      return next(new AppError("You are not logged in", 401));
    }

    let payload = await verifyAccessToken(token);

    if (!payload) {
      return next(new AppError("Invalid token", 401));
    }

    const user = await prisma.user.findUnique({
      where: {
        id: payload.id,
      },
    });

    if (!user) {
      return next(new AppError("No user found for the given token", 401));
    }

    req.user = user;
    next();
  }
);

passport.use(
  new Strategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      callbackURL: "http://localhost:4000/api/v1/auth/google/callback",
      passReqToCallback: true,
    },
    async function (
      req: Request,
      accessToken: string,
      refreshToken: string,
      profile: IProfileGoogle,
      done: VerifyCallback
    ) {
      req.user = null;
      const password = crypto.randomBytes(16).toString("hex");
      const user = await prisma.user.upsert({
        where: {
          email: profile._json.email,
        },
        update: {
          lastLogin: new Date(),
        },
        create: {
          username: profile._json.email.split("@")[0],
          email: profile._json.email,
          password: crypto.createHash("sha256").update(password).digest("hex"),
          birthDate: new Date(),
        },
      });

      await prisma.profile.upsert({
        where: {
          userId: user.id,
        },
        update: {},
        create: {
          fullName: profile._json.name,
          userId: user.id,
          profilePicture: {
            create: {
              url: profile._json.picture,
            },
          },
        },
      });
      req.user = user;
      done(null, profile);
    }
  )
);

passport.serializeUser(function (user, done) {
  done(null, user);
});

passport.deserializeUser(function (user: User, done) {
  done(null, user);
});
