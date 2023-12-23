import { Request, Response, NextFunction } from "express";
import { prisma } from "./prismaClient";

export const getUser = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  return await prisma.user.findUnique({
    where: {
      id: Number(req.user.id),
    },
    include: {
      profile: {
        include: {
          following: true,
        },
      },
    },
  });
};
